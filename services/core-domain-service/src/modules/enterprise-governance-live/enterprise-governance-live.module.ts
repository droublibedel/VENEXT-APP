import { Module } from "@nestjs/common";

import {
  EnterpriseChannelRepository,
  EnterpriseCollaboratorRepository,
  EnterpriseContractDocumentRepository,
  EnterpriseGovernanceHistoryRepository,
  EnterpriseInvitationRepository,
  EnterprisePoleActivationRepository,
  EnterpriseSecurityAlertRepository,
  EnterpriseTrustedDeviceRepository,
} from "./repositories/enterprise-governance.repositories";
import { EnterpriseGovernanceLiveService } from "./enterprise-governance-live.service";
import { EnterpriseGovernanceLiveController } from "./enterprise-governance-live.controller";

@Module({
  controllers: [EnterpriseGovernanceLiveController],
  providers: [
    EnterpriseChannelRepository,
    EnterprisePoleActivationRepository,
    EnterpriseInvitationRepository,
    EnterpriseCollaboratorRepository,
    EnterpriseTrustedDeviceRepository,
    EnterpriseSecurityAlertRepository,
    EnterpriseGovernanceHistoryRepository,
    EnterpriseContractDocumentRepository,
    EnterpriseGovernanceLiveService,
  ],
  exports: [EnterpriseGovernanceLiveService],
})
export class EnterpriseGovernanceLiveModule {}
