import { Module } from '@nestjs/common';
import { DocumentRequestsService } from './document-requests.service';
import { DocumentRequestsController } from './document-requests.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentRequestsController],
  providers: [DocumentRequestsService],
})
export class DocumentRequestsModule {}
