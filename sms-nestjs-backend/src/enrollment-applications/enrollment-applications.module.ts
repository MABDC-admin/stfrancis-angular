import { Module } from '@nestjs/common';
import { EnrollmentApplicationsController } from './enrollment-applications.controller';
import { EnrollmentApplicationsService } from './enrollment-applications.service';

import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [EnrollmentApplicationsController],
  providers: [EnrollmentApplicationsService],
})
export class EnrollmentApplicationsModule {}
