import { Controller, Get } from '@nestjs/common';
import { QuestionService } from './question.service';

@Controller('api/questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  getQuestions() {
    return this.questionService.getAllQuestions();
  }
}
