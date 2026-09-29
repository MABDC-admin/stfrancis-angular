import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [DrizzleModule, AiModule],
  controllers: [TeacherController],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule {}
