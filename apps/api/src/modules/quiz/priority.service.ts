import { Injectable } from '@nestjs/common';
import { LearningRecord } from '@prisma/client';

const ALPHA = 0.40;
const BETA = 0.40;
const GAMMA = 0.20;
const FLOOR = 5;
const TIME_NORMALIZE_DAYS = 30;
const STREAK_CAP = 80;

@Injectable()
export class PriorityService {
  calculate(record: LearningRecord | null): number {
    if (!record || !record.lastAnsweredAt) {
      return 100;
    }

    const daysSince =
      (Date.now() - record.lastAnsweredAt.getTime()) / (1000 * 60 * 60 * 24);
    const T = Math.min(daysSince / TIME_NORMALIZE_DAYS, 1.0) * 100;

    const total = record.correctCount + record.incorrectCount;
    const E = (record.incorrectCount / (total + 1)) * 100;

    const S = Math.min(record.streak * 10, STREAK_CAP);

    return Math.max(FLOOR, ALPHA * T + BETA * E - GAMMA * S);
  }

  weightedSample(
    items: Array<{ id: string; score: number }>,
    count: number,
  ): string[] {
    const pool = [...items];
    const selected: string[] = [];
    const target = Math.min(count, pool.length);

    for (let i = 0; i < target; i++) {
      const totalWeight = pool.reduce((sum, item) => sum + item.score, 0);
      let random = Math.random() * totalWeight;

      for (let j = 0; j < pool.length; j++) {
        random -= pool[j].score;
        if (random <= 0) {
          selected.push(pool[j].id);
          pool.splice(j, 1);
          break;
        }
      }
    }

    return selected;
  }
}
