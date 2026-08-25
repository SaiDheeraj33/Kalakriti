import { Injectable } from "@nestjs/common";
import type { HealthReport } from "../../shared";

@Injectable()
export class HealthService {
  getReport(): HealthReport {
    return {
      status: "ok",
      service: "kalakriti-api",
      version: process.env.npm_package_version ?? "0.1.0",
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
