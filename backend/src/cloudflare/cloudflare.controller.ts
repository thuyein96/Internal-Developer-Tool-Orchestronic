// dns.controller.ts
import { Body, Controller, Param, Post } from "@nestjs/common";
import { CloudflareService } from "./cloudflare.service";

@Controller("dns")
export class DnsController {
  constructor(private readonly cf: CloudflareService) {}

  @Post("resource-groups/:rg/wildcard")
  async upsertRgWildcard(
    @Param("rg") rg: string,
    @Body() body: { lbPublicIp: string; proxied?: boolean },
  ) {
    return this.cf.ensureResourceGroupWildcard({
      resourceGroup: rg,
      lbPublicIp: body.lbPublicIp,
      proxied: body.proxied,
    });
  }
}