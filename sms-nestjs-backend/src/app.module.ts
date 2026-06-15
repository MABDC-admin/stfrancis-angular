import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';
import { EnrollmentApplicationsModule } from './enrollment-applications/enrollment-applications.module';
import { SectionsModule } from './sections/sections.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { DocumentRequirementsModule } from './document-requirements/document-requirements.module';
import { AcademicRecordsModule } from './academic-records/academic-records.module';
import { LearnerMovementsModule } from './learner-movements/learner-movements.module';
import { DocumentRequestsModule } from './document-requests/document-requests.module';
import { DepedFormsModule } from './deped-forms/deped-forms.module';
import { IdQrRecordsModule } from './id-qr-records/id-qr-records.module';
import { AuthModule } from './auth/auth.module';
import { FinanceModule } from './finance/finance.module';
import { IntegrationModule } from './integration/integration.module';
import { StorageModule } from './storage/storage.module';
import { ChatModule } from './chat/chat.module';
import { TeacherModule } from './teacher/teacher.module';

@Module({
  imports: [
    PrismaModule,
    StudentsModule,
    EnrollmentApplicationsModule,
    SectionsModule,
    AcademicYearsModule,
    DocumentRequirementsModule,
    AcademicRecordsModule,
    LearnerMovementsModule,
    DocumentRequestsModule,
    DepedFormsModule,
    IdQrRecordsModule,
    AuthModule,
    FinanceModule,
    IntegrationModule,
    StorageModule,
    ChatModule,
    TeacherModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
