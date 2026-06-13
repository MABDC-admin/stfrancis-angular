import { Module } from '@nestjs/common';
import { EnrollmentApplicationsController } from './enrollment-applications.controller';
import { EnrollmentApplicationsService } from './enrollment-applications.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentApplicationsController],
  providers: [EnrollmentApplicationsService],
})
export class EnrollmentApplicationsModule {}
