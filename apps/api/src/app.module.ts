import { Module } from '@nestjs/common';
import { QueueModule } from './queue.module';
import { AuditController } from './audit.controller';

@Module({
  imports: [QueueModule],
  controllers: [AuditController],
})
export class AppModule {}
