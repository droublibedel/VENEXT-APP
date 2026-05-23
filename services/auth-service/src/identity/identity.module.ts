import { Module } from "@nestjs/common";
import { OtpOnboardingController } from "./otp-onboarding.controller";

@Module({
  controllers: [OtpOnboardingController],
})
export class IdentityModule {}
