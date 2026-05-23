import { Module } from "@nestjs/common";
import { BackofficeSignalMonitoringService } from "./backoffice-signal-monitoring.service";

@Module({
  providers: [BackofficeSignalMonitoringService],
  exports: [BackofficeSignalMonitoringService],
})
export class BackofficeSignalMonitoringModule {}
