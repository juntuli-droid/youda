import { Injectable } from '@nestjs/common';
import { questions } from '@youda/game-assets';

@Injectable()
export class QuestionService {
  getAllQuestions() {
    return {
      code: 'OK',
      data: questions,
      traceId: Date.now().toString(),
    };
  }
}
