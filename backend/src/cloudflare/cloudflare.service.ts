// cloudflare.service.ts
import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

type CfDnsRecord = {
  id: string;
  type: "A" | "CNAME";
  name: string;
  content: string;
  proxied?: boolean;
  ttl?: number;
};

@Injectable()
export class CloudflareService {
  constructor(private readonly http: HttpService) {}

  private get headers() {
    return {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    };
  }

  async upsertARecord(params: {
    fqdn: string;          // e.g. "*.rg1.orchestronic.dev"
    ip: string;            // e.g. "52.221.xxx.xxx"
    proxied?: boolean;     // Cloudflare orange cloud (recommended if you use CF as edge)
    ttl?: number;          // 1 = auto
  }) {
    const { fqdn, ip } = params;
    const proxied = params.proxied ?? false;
    const ttl = params.ttl ?? 1;
    const baseUrl = process.env.CLOUDFLARE_BASE_URL;
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;

    const searchUrl =
      `${baseUrl}/zones/${zoneId}/dns_records` +
      `?type=A&name=${encodeURIComponent(fqdn)}`;

    const searchRes = await firstValueFrom(
      this.http.get(searchUrl, { headers: this.headers }),
    );

    const existing: CfDnsRecord | undefined = searchRes.data?.result?.[0];

    // 2) Create if not exists
    if (!existing) {
      const createUrl = `${baseUrl}/zones/${zoneId}/dns_records`;
      const createRes = await firstValueFrom(
        this.http.post(
          createUrl,
          { type: "A", name: fqdn, content: ip, proxied, ttl },
          { headers: this.headers },
        ),
      );
      return { action: "created", record: createRes.data.result };
    }

    // 3) Update if changed (idempotent)
    const needsUpdate =
      existing.content !== ip || (existing.proxied ?? false) !== proxied;

    if (!needsUpdate) {
      return { action: "unchanged", record: existing };
    }

    const updateUrl = `${baseUrl}/zones/${zoneId}/dns_records/${existing.id}`;
    const updateRes = await firstValueFrom(
      this.http.put(
        updateUrl,
        { type: "A", name: fqdn, content: ip, proxied, ttl },
        { headers: this.headers },
      ),
    );
    return { action: "updated", record: updateRes.data.result };
  }

  async ensureResourceGroupWildcard(params: {
    resourceGroup: string; // "rg1"
    lbPublicIp: string;
    proxied?: boolean;
  }) {
    const rg = params.resourceGroup.trim().toLowerCase();
    const zone = "orchestronic.dev";
    const wildcardFqdn = `*.${rg}.${zone}`;

    const wildcard = await this.upsertARecord({
      fqdn: wildcardFqdn,
      ip: params.lbPublicIp,
      proxied: params.proxied ?? true,
      ttl: 1,
    });

    return wildcard;
  }
}