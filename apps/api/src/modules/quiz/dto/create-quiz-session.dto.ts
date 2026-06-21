import { IsInt, IsIn } from 'class-validator';

export class CreateQuizSessionDto {
  @IsInt()
  @IsIn([5, 10, 20, 50], { message: 'questionCount must be one of: 5, 10, 20, 50' })
  questionCount: number;
}
