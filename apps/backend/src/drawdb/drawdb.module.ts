import { Module } from "@nestjs/common";
import { DrawDBClientService } from "./drawdb-client.service";

@Module({
  providers: [DrawDBClientService],
  exports: [DrawDBClientService],
})
export class DrawDBModule {}
