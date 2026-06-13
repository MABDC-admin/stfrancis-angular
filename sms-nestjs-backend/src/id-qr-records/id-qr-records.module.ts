import { Module } from '@nestjs/common';
import { IdQrRecordsService } from './id-qr-records.service';
import { IdQrRecordsController } from './id-qr-records.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IdQrRecordsController],
  providers: [IdQrRecordsService],
})
export class IdQrRecordsModule {}
