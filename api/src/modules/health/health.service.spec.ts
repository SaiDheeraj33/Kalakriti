import { Test } from "@nestjs/testing";
import { HealthService } from "./health.service";

describe("HealthService", () => {
  let service: HealthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = moduleRef.get(HealthService);
  });

  it("returns a healthy report", () => {
    const report = service.getReport();

    expect(report.status).toBe("ok");
    expect(report.service).toBe("kalakriti-api");
    expect(report.uptimeSec).toBeGreaterThanOrEqual(0);
    expect(new Date(report.timestamp).getTime()).not.toBeNaN();
  });
});
