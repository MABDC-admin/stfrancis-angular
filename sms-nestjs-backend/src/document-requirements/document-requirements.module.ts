import { Module } from '@nestjs/common';
import { DocumentRequirementsService } from './document-requirements.service';
import { DocumentRequirementsController } from './document-requirements.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentRequirementsController],
  providers: [DocumentRequirementsService],
})
export class DocumentRequirementsModule {}
