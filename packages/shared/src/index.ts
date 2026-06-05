export * from "./toss-readonly";

export type Stage = "stage_1_foundation" | "stage_2_toss_readonly_connector";

export type PermissionMode = "manual" | "guarded_auto" | "trusted_auto" | "full_access";

export type ToolRisk = "low" | "medium" | "high" | "critical";

export type ToolAction =
  | "read_market_data"
  | "read_account_snapshot"
  | "read_artifact"
  | "write_artifact"
  | "run_sidecar"
  | "create_order_draft"
  | "order_dry_run"
  | "submit_live_order";

export type PermissionDecision = "allowed" | "needs_approval" | "blocked";

export type ToolPermissionRequest = {
  mode: PermissionMode;
  action: ToolAction;
  risk: ToolRisk;
  stage: Stage;
};

export type ToolPermissionResult = {
  decision: PermissionDecision;
  auditRequired: boolean;
  reason: string;
};

export type AgentName =
  | "CommanderAgent"
  | "PortfolioAgent"
  | "ResearchAgent"
  | "ScenarioAgent"
  | "OrderGuardAgent"
  | "MemoryAgent"
  | "ReportAgent"
  | "BrokerTossAgent"
  | "SettingsSecretsAgent";

export type AgentRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type AgentRunEventType =
  | "run_started"
  | "context_loaded"
  | "specialist_called"
  | "artifact_created"
  | "policy_checked"
  | "run_completed";

export type ArtifactKind =
  | "run_markdown"
  | "scenario_markdown"
  | "scenario_json"
  | "order_review_json"
  | "order_review_markdown";

export type AgentRunSummary = {
  id: string;
  status: AgentRunStatus;
  userMessage: string;
  permissionMode: PermissionMode;
  startedAt: string;
  finishedAt?: string;
  answer: string;
};

export type AgentRunEvent = {
  id: string;
  runId: string;
  agent: AgentName;
  type: AgentRunEventType;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type ArtifactRecord = {
  id: string;
  runId: string;
  kind: ArtifactKind;
  title: string;
  path: string;
  createdAt: string;
};

export type AgentRunBundle = {
  run: AgentRunSummary;
  timeline: AgentRunEvent[];
  artifacts: ArtifactRecord[];
};

export type ChartRange = {
  from: string;
  to: string;
};

export type CommanderContext = {
  selectedSymbol?: string;
  selectedRange?: ChartRange;
  accountLabel?: string;
};

export type CommanderRequest = {
  message: string;
  permissionMode: PermissionMode;
  context?: CommanderContext;
};

export type CommanderResponse = AgentRunBundle & {
  answer: string;
  guardrails: {
    liveOrderBlocked: boolean;
    reason: string;
  };
};

export type HealthCheck = {
  name: string;
  status: "ok" | "disabled" | "not_configured" | "warning" | "error";
  message: string;
  metadata?: Record<string, unknown>;
};
