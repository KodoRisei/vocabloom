import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { VocabulariesModule } from './modules/vocabularies/vocabularies.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { LearningRecordsModule } from './modules/learning-records/learning-records.module';

@Module({
  imports: [
    PrismaModule,
    VocabulariesModule,
    QuizModule,
    LearningRecordsModule,
  ],
})
export class AppModule {}
