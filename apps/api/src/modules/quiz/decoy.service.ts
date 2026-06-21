import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface DecoyOption {
  vocabularyId: string;
  japaneseTranslation: string;
}

@Injectable()
export class DecoyService {
  constructor(private readonly prisma: PrismaService) {}

  async generateRandom(excludeVocabIds: string[], count: number): Promise<DecoyOption[]> {
    if (count <= 0) return [];

    // Fetch random vocab outside the current window
    const candidates = await this.prisma.$queryRaw<
      Array<{ id: string; japanese_translation: string }>
    >`
      SELECT id, japanese_translation
      FROM vocabularies
      WHERE id != ALL(${excludeVocabIds}::uuid[])
      ORDER BY random()
      LIMIT ${count}
    `;

    return candidates.map((c) => ({
      vocabularyId: c.id,
      japaneseTranslation: c.japanese_translation,
    }));
  }
}
