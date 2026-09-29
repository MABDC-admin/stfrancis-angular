import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [DrizzleModule],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
