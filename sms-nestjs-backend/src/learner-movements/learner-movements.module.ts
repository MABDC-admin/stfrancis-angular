import { Module } from '@nestjs/common';
import { LearnerMovementsService } from './learner-movements.service';
import { LearnerMovementsController } from './learner-movements.controller';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [LearnerMovementsController],
  providers: [LearnerMovementsService],
})
export class LearnerMovementsModule {}
