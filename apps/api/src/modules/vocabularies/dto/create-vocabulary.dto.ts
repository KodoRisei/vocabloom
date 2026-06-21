import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateVocabularyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  englishExpression: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  japaneseTranslation: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
