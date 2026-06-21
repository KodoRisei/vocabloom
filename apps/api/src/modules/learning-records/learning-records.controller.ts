import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { LearningRecordsService } from './learning-records.service';

@Controller('learning-records')
export class LearningRecordsController {
  constructor(private readonly service: LearningRecordsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('vocabulary/:vocabularyId')
  findByVocabulary(@Param('vocabularyId', ParseUUIDPipe) vocabularyId: string) {
    return this.service.findByVocabulary(vocabularyId);
  }
}
