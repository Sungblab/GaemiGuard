import type {
  AgentName,
  AgentRunBundle,
  AgentRunEvent,
  AgentRunSummary,
  ArtifactRecord,
  CommanderRequest,
  CommanderResponse,
  PermissionMode,
  TossReadonlyConnector,
  TossReadonlyConnectorStatus,
  TossReadonlySnapshotFreshness,
  TossReadonlySnapshotRepository
} from "@gaemiguard/shared";
import { InMemoryArtifactStore, type ArtifactStore } from "./artifact-store";
import { reviewOrderIntent } from "./order-guard";

export { InMemoryArtifactStore } from "./artifact-store";

export interface AgentRunRepository {
  save(bundle: AgentRunBundle): Promise<void>;
  findById(id: string): Promise<AgentRunBundle | null>;
  listRecent(limit: number): Promise<AgentRunSummary[]>;
}

export class InMemoryAgentRunRepository implements AgentRunRepository {
  private readonly runs = new Map<string, AgentRunBundle>();

  async save(bundle: AgentRunBundle): Promise<void> {
    this.runs.set(bundle.run.id, bundle);
  }

  async findById(id: string): Promise<AgentRunBundle | null> {
    return this.runs.get(id) ?? null;
  }

  async listRecent(limit: number): Promise<AgentRunSummary[]> {
    return [...this.runs.values()]
      .map((item) => item.run)
      .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
      .slice(0, limit);
  }
}

export type CommanderRuntimeOptions = {
  repository: AgentRunRepository;
  artifactStore: ArtifactStore;
  tossReadOnlyConnector?: TossReadonlyConnector;
  tossSnapshotReader?: Pick<TossReadonlySnapshotRepository, "getFreshnessStatus">;
  clock?: () => Date;
  idFactory?: (prefix: string) => string;
};

export type CommanderRuntime = {
  handleUserMessage(request: CommanderRequest): Promise<CommanderResponse>;
};

const DEFAULT_HOLDINGS = [
  { symbol: "005930", name: "삼성전자", weight: "18.4%", unrealizedPnl: "-1.10%" },
  { symbol: "000660", name: "SK하이닉스", weight: "9.2%", unrealizedPnl: "-2.71%" },
  { symbol: "035420", name: "NAVER", weight: "6.8%", unrealizedPnl: "-2.31%" }
];

function defaultIdFactory(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function event(
  idFactory: (prefix: string) => string,
  runId: string,
  agent: AgentName,
  type: AgentRunEvent["type"],
  message: string,
  createdAt: string,
  metadata?: Record<string, unknown>
): AgentRunEvent {
  return {
    id: idFactory("event"),
    runId,
    agent,
    type,
    message,
    createdAt,
    ...(metadata ? { metadata } : {})
  };
}

function buildScenarioMarkdown(symbol: string, userMessage: string): string {
  return [
    `# ${symbol} Scenario Draft`,
    "",
    "Stage 1에서는 실제 MiroFish 실행 대신 sidecar 입력 계약을 검증하는 가상 시나리오 artifact를 생성한다.",
    "",
    "## User Question",
    "",
    userMessage,
    "",
    "## Cases",
    "",
    "- Bull: 반도체 업황 회복과 수급 개선이 이어지는 경우.",
    "- Base: 가격 변동성은 남지만 기존 투자 논리를 재검토할 시간이 필요한 경우.",
    "- Bear: 환율, 실적, 수급, 외국인 매도 압력이 동시에 악화되는 경우.",
    "",
    "## Guardrail",
    "",
    "이 결과는 주문 신호가 아니라 Order Guard가 참고하는 시나리오 근거다."
  ].join("\n");
}

function buildAnswer(
  symbol: string,
  permissionMode: PermissionMode,
  tossStatus?: TossReadonlyConnectorStatus,
  tossSnapshotFreshness?: TossReadonlySnapshotFreshness
): string {
  const sentences = [
    `${symbol} 기준으로 Portfolio, Research, Scenario, Order Guard를 순서대로 확인했습니다.`,
    "현재 Stage 1은 실제 Toss 계좌/주문 연결 전 foundation 단계라 샘플 포트폴리오와 제한된 리서치 컨텍스트만 사용합니다.",
    "추가매수 판단은 투자 논리, 비중, 현금 조건, 최근 리스크를 먼저 연결해야 합니다.",
    `권한 모드는 ${permissionMode}이지만 실주문은 Stage 1에서 차단됩니다.`,
    "지금 생성된 주문 초안은 dry-run review로만 남겼고, 투자 성과를 약속하지 않습니다."
  ];

  if (tossStatus) {
    sentences.splice(
      2,
      0,
      `Toss 읽기 도구는 ${tossStatus.status} 상태이며, 계좌/시세 조회 계약만 열려 있고 주문 생성/정정/취소는 제외됩니다.`
    );
  }

  if (tossSnapshotFreshness) {
    sentences.splice(
      3,
      0,
      `Toss 스냅샷 freshness는 ${tossSnapshotFreshness.status}이며, 이 응답에는 snapshot availability만 반영하고 보유 수량이나 계좌 사실은 생성하지 않습니다.`
    );
  }

  return sentences.join(" ");
}

export function createCommanderRuntime(options: CommanderRuntimeOptions): CommanderRuntime {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? defaultIdFactory;

  return {
    async handleUserMessage(request: CommanderRequest): Promise<CommanderResponse> {
      const runId = idFactory("run");
      const startedAt = clock().toISOString();
      const symbol = request.context?.selectedSymbol ?? "005930";
      const timeline: AgentRunEvent[] = [];

      timeline.push(
        event(idFactory, runId, "CommanderAgent", "run_started", "Commander received the user request.", startedAt, {
          permissionMode: request.permissionMode,
          selectedSymbol: symbol
        })
      );
      timeline.push(
        event(idFactory, runId, "PortfolioAgent", "context_loaded", "Loaded Stage 1 sample portfolio context.", startedAt, {
          holdings: DEFAULT_HOLDINGS
        })
      );

      const tossStatus = options.tossReadOnlyConnector ? await options.tossReadOnlyConnector.getStatus() : undefined;
      const tossSnapshotFreshness = options.tossSnapshotReader
        ? await options.tossSnapshotReader.getFreshnessStatus({ now: clock().toISOString() })
        : undefined;
      if (tossStatus && options.tossReadOnlyConnector) {
        const tossContract = options.tossReadOnlyConnector.getToolContract();
        timeline.push(
          event(idFactory, runId, "BrokerTossAgent", "specialist_called", "Published Toss read-only tool contract.", startedAt, {
            connectorStatus: tossStatus.status,
            toolContract: tossContract.tools,
            includedOperations: tossContract.includedOperations,
            forbiddenOperations: tossContract.forbiddenOperations,
            ...(tossSnapshotFreshness ? { snapshotFreshness: tossSnapshotFreshness } : {})
          })
        );
      }

      timeline.push(
        event(idFactory, runId, "ResearchAgent", "specialist_called", "Prepared research limitations and source plan.", startedAt, {
          limitation: "Hermes/OpenBB connectors are not connected in Stage 1 foundation."
        })
      );
      timeline.push(
        event(idFactory, runId, "ScenarioAgent", "specialist_called", "Created MiroFish-ready scenario draft.", startedAt, {
          sidecar: "mirofish",
          execution: "stubbed"
        })
      );

      const orderReview = reviewOrderIntent(
        {
          symbol,
          side: "BUY",
          quantity: 1,
          estimatedPrice: 70000
        },
        request.permissionMode
      );

      timeline.push(
        event(idFactory, runId, "OrderGuardAgent", "policy_checked", "Reviewed order draft and blocked live submission.", startedAt, {
          liveSubmitAllowed: orderReview.liveSubmit.allowed
        })
      );

      const scenarioArtifact = await options.artifactStore.writeArtifact({
        id: idFactory("artifact"),
        runId,
        kind: "scenario_markdown",
        title: `${symbol} scenario draft`,
        createdAt: startedAt,
        extension: "md",
        content: buildScenarioMarkdown(symbol, request.message)
      });

      const orderArtifact = await options.artifactStore.writeArtifact({
        id: idFactory("artifact"),
        runId,
        kind: "order_review_json",
        title: `${symbol} order guard dry-run`,
        createdAt: startedAt,
        extension: "json",
        content: JSON.stringify(orderReview, null, 2)
      });

      const finishedAt = clock().toISOString();
      const answer = buildAnswer(symbol, request.permissionMode, tossStatus, tossSnapshotFreshness);

      timeline.push(
        event(idFactory, runId, "CommanderAgent", "run_completed", "Commander synthesized the Stage 1 answer.", finishedAt, {
          artifacts: [scenarioArtifact.id, orderArtifact.id]
        })
      );

      const run: AgentRunSummary = {
        id: runId,
        status: "completed",
        userMessage: request.message,
        permissionMode: request.permissionMode,
        startedAt,
        finishedAt,
        answer
      };

      const artifacts: ArtifactRecord[] = [scenarioArtifact, orderArtifact];
      const bundle: AgentRunBundle = { run, timeline, artifacts };
      await options.repository.save(bundle);

      return {
        ...bundle,
        answer,
        guardrails: {
          liveOrderBlocked: true,
          reason: orderReview.liveSubmit.reason
        }
      };
    }
  };
}
