import { Module } from '@nestjs/common';
import { AcademicRecordsService } from './academic-records.service';
import { AcademicRecordsController } from './academic-records.controller';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [AcademicRecordsController],
  providers: [AcademicRecordsService],
})
export class AcademicRecordsModule {}
