import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { AdminTeachersController } from './admin-teachers.controller';
import { AdminTeachersService } from './admin-teachers.service';

@Module({
  imports: [DrizzleModule],
  controllers: [AdminTeachersController],
  providers: [AdminTeachersService],
})
export class AdminTeachersModule {}
