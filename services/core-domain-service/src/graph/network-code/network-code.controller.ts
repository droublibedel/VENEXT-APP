import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import { NetworkCodeService } from "./network-code.service";

@Controller("network-codes")
export class NetworkCodeGraphController {
  constructor(private readonly codes: NetworkCodeService) {}

  @Post()
  create(
    @Body()
    body: {
      organizationId: string;
      usageLimit?: number;
      expiresAt?: string;
    },
  ) {
    return this.codes.create(body);
  }

  @Get(":code/preview")
  preview(@Param("code") code: string) {
    return this.codes.preview(code);
  }

  @Post(":code/join")
  join(
    @Param("code") code: string,
    @Body() body: { joiningOrganizationId: string },
  ) {
    return this.codes.join(code, body.joiningOrganizationId);
  }
}
