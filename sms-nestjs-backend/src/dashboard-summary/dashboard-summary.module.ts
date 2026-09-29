import { Module } from '@nestjs/common';
import { DashboardSummaryController } from './dashboard-summary.controller';
import { DashboardSummaryService } from './dashboard-summary.service';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [DashboardSummaryController],
  providers: [DashboardSummaryService],
})
export class DashboardSummaryModule {}
