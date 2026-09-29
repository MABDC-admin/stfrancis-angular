import { Module } from '@nestjs/common';
import { DepedFormsService } from './deped-forms.service';
import { DepedFormsController } from './deped-forms.controller';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [DepedFormsController],
  providers: [DepedFormsService],
})
export class DepedFormsModule {}
