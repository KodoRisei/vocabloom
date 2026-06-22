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

  async getCalendar(): Promise<{ data: Array<{ date: string; count: number }> }> {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);

    const rows = await this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(answered_at AT TIME ZONE 'Asia/Tokyo')::text AS date,
             COUNT(*)::bigint AS count
      FROM quiz_session_items
      WHERE answered_at IS NOT NULL
        AND answered_at >= ${since}
      GROUP BY DATE(answered_at AT TIME ZONE 'Asia/Tokyo')
      ORDER BY date
    `;

    return {
      data: rows.map((r) => ({ date: r.date, count: Number(r.count) })),
    };
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
