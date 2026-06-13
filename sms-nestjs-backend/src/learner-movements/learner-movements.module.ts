import { Module } from '@nestjs/common';
import { LearnerMovementsService } from './learner-movements.service';
import { LearnerMovementsController } from './learner-movements.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LearnerMovementsController],
  providers: [LearnerMovementsService],
})
export class LearnerMovementsModule {}
