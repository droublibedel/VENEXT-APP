import { Body, Controller, Post } from "@nestjs/common";

@Controller("v1/geo-signals")
export class GeoSignalsController {
  @Post("enqueue")
  enqueue(
    @Body()
    body: {
      organizationId?: string;
      signalType: string;
      lat?: number;
      lng?: number;
    },
  ) {
    return { status: "queued", received: body };
  }
}
