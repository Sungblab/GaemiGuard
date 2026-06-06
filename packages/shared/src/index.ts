export * from "./broker-adapter";
export * from "./toss-readonly";

import type { BrokerFreshness, BrokerFreshnessSource, BrokerFreshnessStatus, BrokerProviderId } from "./broker-adapter";

export type Stage = "stage_1_foundation" | "stage_2_toss_readonly_connector" | "stage_3_research_memory";

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
  | "BrokerAgent"
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
  status:
    | "ok"
    | "disabled"
    | "no_broker"
    | "not_configured"
    | "credential_configured"
    | "syncing"
    | "mock_replay"
    | "readonly_available"
    | "stale"
    | "failed"
    | "warning"
    | "error";
  message: string;
  metadata?: Record<string, unknown>;
};

export type InvestmentMemoryKind = "thesis" | "rule" | "journal";

export type InvestmentMemorySourceKind = "manual_note" | "broker_snapshot" | "research_artifact";

export type InvestmentMemoryBrokerSnapshotSource = {
  providerId: BrokerProviderId;
  source: BrokerFreshnessSource;
  freshnessStatus: BrokerFreshnessStatus;
  lastSuccessfulSyncAt?: string;
};

export type InvestmentMemorySource = {
  kind: InvestmentMemorySourceKind;
  label: string;
  capturedAt: string;
  freshness: BrokerFreshness;
  brokerSnapshot?: InvestmentMemoryBrokerSnapshotSource;
};

export type InvestmentMemoryRecord = {
  id: string;
  kind: InvestmentMemoryKind;
  symbol?: string;
  title: string;
  body: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  source: InvestmentMemorySource;
};

export type InvestmentMemoryThesisInput = {
  symbol: string;
  title: string;
  body: string;
  source: InvestmentMemorySource;
};

export type InvestmentMemoryRuleInput = {
  name: string;
  body: string;
  source: InvestmentMemorySource;
};

export type InvestmentMemoryJournalInput = {
  symbol?: string;
  body: string;
  source: InvestmentMemorySource;
};

export type InvestmentMemoryRecallRequest = {
  symbol?: string;
  now?: string;
  includeStale?: boolean;
  limit?: number;
};

export type InvestmentMemorySkippedItem = {
  id: string;
  reason: "missing_source" | "stale_source";
};

export type InvestmentMemoryRecallResult = {
  items: InvestmentMemoryRecord[];
  skipped: InvestmentMemorySkippedItem[];
};

export interface InvestmentMemoryRepository {
  upsertThesis(input: InvestmentMemoryThesisInput): Promise<InvestmentMemoryRecord>;
  upsertRule(input: InvestmentMemoryRuleInput): Promise<InvestmentMemoryRecord>;
  addJournalEntry(input: InvestmentMemoryJournalInput): Promise<InvestmentMemoryRecord>;
  recall(request?: InvestmentMemoryRecallRequest): Promise<InvestmentMemoryRecallResult>;
}
