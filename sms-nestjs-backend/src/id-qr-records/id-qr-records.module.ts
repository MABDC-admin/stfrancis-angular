import { Module } from '@nestjs/common';
import { IdQrRecordsService } from './id-qr-records.service';
import { IdQrRecordsController } from './id-qr-records.controller';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [IdQrRecordsController],
  providers: [IdQrRecordsService],
})
export class IdQrRecordsModule {}
