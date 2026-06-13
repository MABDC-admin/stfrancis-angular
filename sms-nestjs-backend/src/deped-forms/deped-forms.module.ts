import { Module } from '@nestjs/common';
import { DepedFormsService } from './deped-forms.service';
import { DepedFormsController } from './deped-forms.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DepedFormsController],
  providers: [DepedFormsService],
})
export class DepedFormsModule {}
