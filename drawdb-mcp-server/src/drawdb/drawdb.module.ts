import { Module } from '@nestjs/common';
import { DrawDBGateway } from './drawdb.gateway';
import { DrawDBClientService } from './drawdb-client.service';

@Module({
  providers: [DrawDBGateway, DrawDBClientService],
  exports: [DrawDBClientService],
})
export class DrawDBModule {}
