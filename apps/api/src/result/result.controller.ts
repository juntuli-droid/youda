import { Controller, Post, Body } from '@nestjs/common';
import { ResultService } from './result.service';
import { ScoreKey } from '@youda/game-assets';

@Controller('api/personality')
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @Post('submit')
  submitAnswers(@Body() body: { scores: Partial<Record<ScoreKey, number>> }) {
    return this.resultService.calculateResult(body.scores);
  }
}
