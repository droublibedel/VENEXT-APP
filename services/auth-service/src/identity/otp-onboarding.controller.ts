import { Body, Controller, Post } from "@nestjs/common";
import { randomUUID } from "node:crypto";

/** OTP challenge issuance — persistence wired when auth DB module lands */
@Controller("v1/identity/otp")
export class OtpOnboardingController {
  @Post("challenge")
  issueChallenge(@Body() body: { destination: string }) {
    return {
      status: "foundation",
      destinationHint: body.destination.slice(-4),
      challengeId: randomUUID(),
    };
  }
}
