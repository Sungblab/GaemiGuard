import { describe, expect, it } from "vitest";
import { evaluateToolPermission } from "./permission-engine";

describe("evaluateToolPermission", () => {
  it("blocks live order submission in Stage 1 for every permission mode", () => {
    const modes = ["manual", "guarded_auto", "trusted_auto", "full_access"] as const;

    for (const mode of modes) {
      const result = evaluateToolPermission({
        mode,
        action: "submit_live_order",
        risk: "critical",
        stage: "stage_1_foundation"
      });

      expect(result.decision).toBe("blocked");
      expect(result.auditRequired).toBe(true);
      expect(result.reason).toContain("Stage 1");
    }
  });

  it("continues to block live order submission in the Stage 2 read-only connector slice", () => {
    const result = evaluateToolPermission({
      mode: "full_access",
      action: "submit_live_order",
      risk: "critical",
      stage: "stage_2_toss_readonly_connector"
    });

    expect(result.decision).toBe("blocked");
    expect(result.auditRequired).toBe(true);
    expect(result.reason).toContain("Stage 2");
  });

  it("allows read-only market and account tools in guarded modes", () => {
    expect(
      evaluateToolPermission({
        mode: "guarded_auto",
        action: "read_market_data",
        risk: "low",
        stage: "stage_1_foundation"
      }).decision
    ).toBe("allowed");

    expect(
      evaluateToolPermission({
        mode: "trusted_auto",
        action: "read_account_snapshot",
        risk: "medium",
        stage: "stage_1_foundation"
      }).decision
    ).toBe("allowed");
  });

  it("allows order dry-run but requires an audit trail", () => {
    const result = evaluateToolPermission({
      mode: "guarded_auto",
      action: "order_dry_run",
      risk: "high",
      stage: "stage_1_foundation"
    });

    expect(result.decision).toBe("allowed");
    expect(result.auditRequired).toBe(true);
    expect(result.reason).toContain("dry-run");
  });
});
