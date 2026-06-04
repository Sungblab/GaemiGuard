import type { PermissionMode } from "@gaemiguard/shared";
import { evaluateToolPermission } from "./permission-engine";

export type OrderIntent = {
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  estimatedPrice: number;
  thesisId?: string;
};

export type OrderGuardReview = {
  intent: OrderIntent;
  status: "dry_run_only" | "blocked";
  checks: {
    name: string;
    result: "pass" | "warning" | "blocked";
    message: string;
  }[];
  liveSubmit: {
    allowed: boolean;
    reason: string;
  };
};

export function reviewOrderIntent(intent: OrderIntent, permissionMode: PermissionMode): OrderGuardReview {
  const livePermission = evaluateToolPermission({
    mode: permissionMode,
    action: "submit_live_order",
    risk: "critical",
    stage: "stage_1_foundation"
  });

  return {
    intent,
    status: "dry_run_only",
    checks: [
      {
        name: "investment_thesis",
        result: intent.thesisId ? "pass" : "warning",
        message: intent.thesisId
          ? "연결된 투자 논리가 있습니다."
          : "Stage 1 샘플 컨텍스트에서는 실제 투자 논리 연결이 아직 없습니다."
      },
      {
        name: "stage_1_live_order_policy",
        result: "blocked",
        message: livePermission.reason
      },
      {
        name: "audit_required",
        result: "pass",
        message: "주문 초안과 dry-run 결과는 SQLite와 artifact에 남깁니다."
      }
    ],
    liveSubmit: {
      allowed: false,
      reason: livePermission.reason
    }
  };
}

