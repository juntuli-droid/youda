import { Injectable } from '@nestjs/common';
import { calculatePersonality, ScoreKey, resolveAvatar } from '@youda/game-assets';

@Injectable()
export class ResultService {
  calculateResult(scores: Partial<Record<ScoreKey, number>>) {
    try {
      const result = calculatePersonality(scores as Record<ScoreKey, number>);
      const avatar = resolveAvatar(result.code);
      
      return {
        code: 'OK',
        data: {
          ...result,
          avatar
        },
        traceId: Date.now().toString(),
      };
    } catch (error: any) {
      return {
        code: 'VAL_400',
        message: error.message || 'Invalid scores',
        traceId: Date.now().toString(),
      };
    }
  }
}
