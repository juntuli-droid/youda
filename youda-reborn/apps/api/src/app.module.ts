import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { QuestionModule } from './question/question.module';
import { ResultModule } from './result/result.module';

@Module({
  imports: [AuthModule, QuestionModule, ResultModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
