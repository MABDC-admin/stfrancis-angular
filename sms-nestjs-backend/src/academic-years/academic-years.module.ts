import { Module } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { AcademicYearsController } from './academic-years.controller';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [AcademicYearsController],
  providers: [AcademicYearsService],
})
export class AcademicYearsModule {}
