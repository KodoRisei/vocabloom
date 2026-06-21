import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { PriorityService } from './priority.service';
import { DecoyService } from './decoy.service';

@Module({
  controllers: [QuizController],
  providers: [QuizService, PriorityService, DecoyService],
})
export class QuizModule {}
