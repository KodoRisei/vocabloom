import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class LearningRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const records = await this.prisma.learningRecord.findMany({
      include: { vocabulary: true },
      orderBy: { priorityScore: 'desc' },
    });

    return { data: records };
  }

  async findByVocabulary(vocabularyId: string) {
    const record = await this.prisma.learningRecord.findUnique({
      where: { vocabularyId },
      include: { vocabulary: true },
    });

    return { data: record };
  }

  async getStats() {
    const [total, learned, sessions] = await this.prisma.$transaction([
      this.prisma.vocabulary.count(),
      this.prisma.learningRecord.count({ where: { correctCount: { gt: 0 } } }),
      this.prisma.quizSession.count({ where: { status: 'COMPLETED' } }),
    ]);

    const topStreak = await this.prisma.learningRecord.findFirst({
      orderBy: { streak: 'desc' },
      include: { vocabulary: true },
    });

    return {
      data: {
        totalVocabularies: total,
        learnedVocabularies: learned,
        completedSessions: sessions,
        topStreak: topStreak
          ? {
              streak: topStreak.streak,
              expression: topStreak.vocabulary.englishExpression,
            }
          : null,
      },
    };
  }
}
