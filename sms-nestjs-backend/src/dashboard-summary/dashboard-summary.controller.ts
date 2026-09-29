import { Controller, Get, Query, Req } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { DashboardSummaryService } from './dashboard-summary.service';

interface AuthenticatedRequest {
  user?: {
    role?: string;
  };
}

@Controller('dashboard-summary')
@Roles('ADMIN', 'REGISTRAR', 'FINANCE', 'PRINCIPAL')
export class DashboardSummaryController {
  constructor(private readonly service: DashboardSummaryService) {}

  @Get('overview')
  getOverview(@Query('academicYearId') academicYearId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getOverview(academicYearId, req.user?.role);
  }
}
