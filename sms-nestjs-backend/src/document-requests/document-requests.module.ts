import { Module } from '@nestjs/common';
import { DocumentRequestsService } from './document-requests.service';
import { DocumentRequestsController } from './document-requests.controller';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [DocumentRequestsController],
  providers: [DocumentRequestsService],
})
export class DocumentRequestsModule {}
