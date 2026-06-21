import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { QueryVocabularyDto } from './dto/query-vocabulary.dto';

@Injectable()
export class VocabulariesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryVocabularyDto) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { englishExpression: { contains: search, mode: 'insensitive' as const } },
            { japaneseTranslation: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vocabulary.findMany({
        where,
        include: { learningRecord: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vocabulary.count({ where }),
    ]);

    return {
      data: items,
      meta: { page, limit, total },
    };
  }

  async findOne(id: string) {
    const vocabulary = await this.prisma.vocabulary.findUnique({
      where: { id },
      include: { learningRecord: true },
    });

    if (!vocabulary) {
      throw new NotFoundException(`Vocabulary with id ${id} not found`);
    }

    return { data: vocabulary };
  }

  async create(dto: CreateVocabularyDto) {
    await this.assertNoDuplicateEnglish(dto.englishExpression);

    const vocabulary = await this.prisma.vocabulary.create({
      data: dto,
      include: { learningRecord: true },
    });

    return { data: vocabulary };
  }

  async update(id: string, dto: UpdateVocabularyDto) {
    await this.findOne(id);

    if (dto.englishExpression) {
      await this.assertNoDuplicateEnglish(dto.englishExpression, id);
    }

    const vocabulary = await this.prisma.vocabulary.update({
      where: { id },
      data: dto,
      include: { learningRecord: true },
    });

    return { data: vocabulary };
  }

  private async assertNoDuplicateEnglish(expression: string, excludeId?: string) {
    const existing = await this.prisma.vocabulary.findFirst({
      where: {
        englishExpression: { equals: expression, mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { englishExpression: true },
    });

    if (existing) {
      throw new ConflictException(
        `「${existing.englishExpression}」はすでに登録されています`,
      );
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.vocabulary.delete({ where: { id } });
    return { data: null };
  }
}
