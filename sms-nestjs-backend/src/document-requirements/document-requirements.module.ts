import { Module } from '@nestjs/common';
import { DocumentRequirementsService } from './document-requirements.service';
import { DocumentRequirementsController } from './document-requirements.controller';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [DocumentRequirementsController],
  providers: [DocumentRequirementsService],
})
export class DocumentRequirementsModule {}
