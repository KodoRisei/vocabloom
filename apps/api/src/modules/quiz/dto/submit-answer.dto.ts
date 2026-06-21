import { IsUUID } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  vocabularyId: string;

  @IsUUID()
  selectedVocabularyId: string;
}
