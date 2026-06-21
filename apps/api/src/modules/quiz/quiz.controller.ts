import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizSessionDto } from './dto/create-quiz-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('quiz')
export class QuizController {
  constructor(private readonly service: QuizService) {}

  @Post('sessions')
  createSession(@Body() dto: CreateQuizSessionDto) {
    return this.service.createSession(dto);
  }

  @Get('sessions/:id')
  getSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getSession(id);
  }

  @Get('sessions/:id/window')
  getWindow(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getWindow(id);
  }

  @Post('sessions/:id/answer')
  @HttpCode(HttpStatus.OK)
  submitAnswer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.service.submitAnswer(id, dto);
  }

  @Patch('sessions/:id/complete')
  completeSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.completeSession(id);
  }

  @Patch('sessions/:id/abandon')
  abandonSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.abandonSession(id);
  }
}
