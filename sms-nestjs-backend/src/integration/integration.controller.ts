import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { IntegrationService } from './integration.service';

interface AuthenticatedRequest {
  user?: { sub?: string; userId?: string; id?: string };
}

@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  private userId(req: AuthenticatedRequest): string | undefined {
    return req.user?.sub ?? req.user?.userId ?? req.user?.id;
  }

  @Get('students/:studentId/finance-profile')
  @Roles('REGISTRAR', 'FINANCE')
  getStudentFinanceProfile(
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.integrationService.getStudentFinanceProfile(
      studentId,
      academicYearId,
      this.userId(req),
    );
  }

  @Get('finance/clearance')
  @Roles('REGISTRAR', 'FINANCE')
  getFinanceClearance(
    @Query('academicYearId') academicYearId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.integrationService.getFinanceClearance(
      academicYearId,
      this.userId(req),
    );
  }

  @Post('finance/sync-student/:studentId')
  @Roles('FINANCE')
  syncStudentFinanceStatus(
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.integrationService.syncStudentFinanceStatus(
      studentId,
      academicYearId,
      this.userId(req),
    );
  }

  @Get('data-map')
  @Roles('REGISTRAR', 'FINANCE')
  getDataMap() {
    return this.integrationService.getDataMap();
  }
}
