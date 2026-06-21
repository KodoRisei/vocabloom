import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateVocabularyDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  englishExpression?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  japaneseTranslation?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
