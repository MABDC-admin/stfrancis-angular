import { Module } from '@nestjs/common';
import { AcademicRecordsService } from './academic-records.service';
import { AcademicRecordsController } from './academic-records.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AcademicRecordsController],
  providers: [AcademicRecordsService],
})
export class AcademicRecordsModule {}
