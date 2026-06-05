import type { ToolPermissionRequest, ToolPermissionResult } from "@gaemiguard/shared";

const READ_ONLY_ACTIONS = new Set(["read_market_data", "read_account_snapshot", "read_artifact"]);

export function evaluateToolPermission(request: ToolPermissionRequest): ToolPermissionResult {
  if (
    (request.stage === "stage_1_foundation" || request.stage === "stage_2_toss_readonly_connector") &&
    request.action === "submit_live_order"
  ) {
    const stageLabel =
      request.stage === "stage_1_foundation" ? "Stage 1 foundation" : "Stage 2 read-only connector";
    return {
      decision: "blocked",
      auditRequired: true,
      reason: `${stageLabel} blocks live order submission in every permission mode.`
    };
  }

  if (READ_ONLY_ACTIONS.has(request.action)) {
    return {
      decision: "allowed",
      auditRequired: request.action === "read_account_snapshot",
      reason: "Read-only market and account context is allowed for Commander grounding."
    };
  }

  if (request.action === "order_dry_run" || request.action === "create_order_draft") {
    return {
      decision: "allowed",
      auditRequired: true,
      reason: "Order draft and dry-run are allowed in Stage 1 when an audit trail is written."
    };
  }

  if (request.mode === "manual" && request.action === "run_sidecar") {
    return {
      decision: "needs_approval",
      auditRequired: true,
      reason: "Manual mode requires approval before running external sidecar processes."
    };
  }

  return {
    decision: "allowed",
    auditRequired: request.risk !== "low",
    reason: "Action is allowed by the Stage 1 non-trading permission policy."
  };
}
