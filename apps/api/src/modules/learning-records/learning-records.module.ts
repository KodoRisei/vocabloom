import { Module } from '@nestjs/common';
import { LearningRecordsController } from './learning-records.controller';
import { LearningRecordsService } from './learning-records.service';

@Module({
  controllers: [LearningRecordsController],
  providers: [LearningRecordsService],
})
export class LearningRecordsModule {}
