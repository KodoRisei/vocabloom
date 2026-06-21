import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { QuizItemStatus, QuizSessionStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PriorityService } from './priority.service';
import { DecoyService } from './decoy.service';
import { CreateQuizSessionDto } from './dto/create-quiz-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

const WINDOW_SIZE = 5;
const DECOY_COUNT = 3;

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priority: PriorityService,
    private readonly decoy: DecoyService,
  ) {}

  async createSession(dto: CreateQuizSessionDto) {
    const { questionCount } = dto;

    const vocabularies = await this.prisma.vocabulary.findMany({
      include: { learningRecord: true },
    });

    if (vocabularies.length < questionCount) {
      throw new BadRequestException(
        `Not enough vocabularies. Need ${questionCount}, have ${vocabularies.length}.`,
      );
    }

    const scored = vocabularies.map((v) => ({
      id: v.id,
      score: this.priority.calculate(v.learningRecord),
    }));

    const selectedIds = this.priority.weightedSample(scored, questionCount);

    const now = new Date();
    const initialWindowSize = Math.min(WINDOW_SIZE, questionCount);

    const session = await this.prisma.quizSession.create({
      data: {
        questionCount,
        windowSize: WINDOW_SIZE,
        items: {
          create: selectedIds.map((vocabularyId, index) => ({
            vocabularyId,
            position: index,
            status: index < initialWindowSize ? QuizItemStatus.ACTIVE : QuizItemStatus.PENDING,
            displayedAt: index < initialWindowSize ? now : null,
          })),
        },
      },
    });

    const window = await this.buildWindow(session.id);
    return { data: { sessionId: session.id, status: session.status, ...window } };
  }

  async getWindow(sessionId: string) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Quiz session ${sessionId} not found`);
    }

    if (session.status !== QuizSessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not in progress');
    }

    const window = await this.buildWindow(sessionId);
    return { data: window };
  }

  private async buildWindow(sessionId: string) {
    const [activeItems, totalItems] = await Promise.all([
      this.prisma.quizSessionItem.findMany({
        where: { sessionId, status: QuizItemStatus.ACTIVE },
        include: { vocabulary: true },
        orderBy: { position: 'asc' },
      }),
      this.prisma.quizSessionItem.count({ where: { sessionId } }),
    ]);

    const answeredCount = await this.prisma.quizSessionItem.count({
      where: { sessionId, status: QuizItemStatus.CORRECT },
    });

    const activeVocabIds = activeItems.map((i) => i.vocabularyId);
    const decoys = await this.decoy.generateRandom(activeVocabIds, DECOY_COUNT);

    const japaneseOptions = shuffle([
      ...activeItems.map((i) => ({
        vocabularyId: i.vocabularyId,
        japaneseTranslation: i.vocabulary.japaneseTranslation,
      })),
      ...decoys,
    ]);

    return {
      activeItems: activeItems.map((i) => ({
        vocabularyId: i.vocabularyId,
        englishExpression: i.vocabulary.englishExpression,
        position: i.position,
      })),
      japaneseOptions,
      stats: {
        totalCount: totalItems,
        answeredCount,
        remainingCount: totalItems - answeredCount,
        windowSize: WINDOW_SIZE,
      },
    };
  }

  async submitAnswer(sessionId: string, dto: SubmitAnswerDto) {
    const { vocabularyId, selectedVocabularyId } = dto;
    const isCorrect = vocabularyId === selectedVocabularyId;

    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Quiz session ${sessionId} not found`);
    }

    if (session.status !== QuizSessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not in progress');
    }

    const item = await this.prisma.quizSessionItem.findUnique({
      where: { sessionId_vocabularyId: { sessionId, vocabularyId } },
    });

    if (!item || item.status !== QuizItemStatus.ACTIVE) {
      throw new BadRequestException(`Vocabulary ${vocabularyId} is not active in this session`);
    }

    await this.prisma.$transaction(async (tx) => {
      if (isCorrect) {
        // Mark current item as CORRECT
        await tx.quizSessionItem.update({
          where: { id: item.id },
          data: {
            status: QuizItemStatus.CORRECT,
            isCorrect: true,
            attemptCount: { increment: 1 },
            answeredAt: new Date(),
          },
        });

        await tx.quizSession.update({
          where: { id: sessionId },
          data: { correctCount: { increment: 1 } },
        });

        // Promote next PENDING item to ACTIVE
        const nextPending = await tx.quizSessionItem.findFirst({
          where: { sessionId, status: QuizItemStatus.PENDING },
          orderBy: { position: 'asc' },
        });

        if (nextPending) {
          await tx.quizSessionItem.update({
            where: { id: nextPending.id },
            data: { status: QuizItemStatus.ACTIVE, displayedAt: new Date() },
          });
        }
      } else {
        // Wrong: increment attempt, leave ACTIVE (stays in window)
        await tx.quizSessionItem.update({
          where: { id: item.id },
          data: {
            attemptCount: { increment: 1 },
            answeredAt: new Date(),
          },
        });

        await tx.quizSession.update({
          where: { id: sessionId },
          data: { incorrectCount: { increment: 1 } },
        });
      }

      // Upsert learning record
      const existing = await tx.learningRecord.findUnique({ where: { vocabularyId } });
      const newStreak = isCorrect ? (existing?.streak ?? 0) + 1 : 0;

      const updatedRecord = await tx.learningRecord.upsert({
        where: { vocabularyId },
        create: {
          vocabularyId,
          correctCount: isCorrect ? 1 : 0,
          incorrectCount: isCorrect ? 0 : 1,
          streak: newStreak,
          lastAnsweredAt: new Date(),
          lastCorrectAt: isCorrect ? new Date() : null,
        },
        update: {
          ...(isCorrect ? { correctCount: { increment: 1 } } : { incorrectCount: { increment: 1 } }),
          streak: newStreak,
          lastAnsweredAt: new Date(),
          ...(isCorrect ? { lastCorrectAt: new Date() } : {}),
        },
      });

      const newScore = this.priority.calculate(updatedRecord);
      await tx.learningRecord.update({
        where: { vocabularyId },
        data: { priorityScore: newScore },
      });
    });

    // Check if session is complete: no ACTIVE and no PENDING items remain
    if (isCorrect) {
      const remaining = await this.prisma.quizSessionItem.count({
        where: { sessionId, status: { in: [QuizItemStatus.ACTIVE, QuizItemStatus.PENDING] } },
      });

      if (remaining === 0) {
        await this.prisma.quizSession.update({
          where: { id: sessionId },
          data: { status: QuizSessionStatus.COMPLETED, completedAt: new Date() },
        });

        return { data: { isCorrect, sessionCompleted: true, window: null } };
      }
    }

    const window = await this.buildWindow(sessionId);
    return { data: { isCorrect, sessionCompleted: false, window } };
  }

  async getSession(id: string) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id },
      include: {
        items: {
          include: { vocabulary: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Quiz session ${id} not found`);
    }

    return { data: session };
  }

  async completeSession(id: string) {
    const { data: session } = await this.getSession(id);

    if (session.status !== QuizSessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not in progress');
    }

    const updated = await this.prisma.quizSession.update({
      where: { id },
      data: { status: QuizSessionStatus.COMPLETED, completedAt: new Date() },
    });

    return { data: updated };
  }

  async abandonSession(id: string) {
    await this.prisma.quizSession.update({
      where: { id },
      data: { status: QuizSessionStatus.ABANDONED },
    });

    return { data: null };
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
