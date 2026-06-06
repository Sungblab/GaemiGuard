import type {
  AgentName,
  AgentRunBundle,
  AgentRunEvent,
  AgentRunSummary,
  ArtifactRecord,
  BrokerAdapter,
  BrokerAdapterStatus,
  CommanderRequest,
  CommanderResponse,
  InvestmentMemoryRecord,
  InvestmentMemoryRepository,
  InvestmentMemorySkippedItem,
  PermissionMode,
  TossReadonlyConnector,
  TossReadonlyConnectorStatus,
  TossReadonlySnapshotBundle,
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
  brokerAdapters?: BrokerAdapter[];
  tossReadOnlyConnector?: TossReadonlyConnector;
  tossSnapshotReader?: Pick<TossReadonlySnapshotRepository, "getFreshnessStatus"> &
    Partial<Pick<TossReadonlySnapshotRepository, "readLatest">>;
  investmentMemory?: Pick<InvestmentMemoryRepository, "recall">;
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
  brokerStatuses: BrokerAdapterStatus[],
  tossStatus?: TossReadonlyConnectorStatus,
  tossSnapshotFreshness?: TossReadonlySnapshotFreshness,
  accountGrounding?: string,
  memoryGrounding?: string
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

  if (brokerStatuses.length > 0) {
    sentences.splice(
      2,
      0,
      `broker adapter availability is published as metadata for ${brokerStatuses
        .map((status) => `${status.provider.displayName}:${status.status}`)
        .join(", ")}. Account facts still require source and freshness context.`
    );
  }

  if (tossSnapshotFreshness) {
    sentences.splice(
      3,
      0,
      tossSnapshotFreshness.source === "production_snapshot"
        ? `Toss 스냅샷 freshness는 ${tossSnapshotFreshness.status}이며 source는 ${tossSnapshotFreshness.source}입니다.`
        : `Toss 스냅샷 freshness는 ${tossSnapshotFreshness.status}이며, 이 응답에는 snapshot availability만 반영하고 보유 수량이나 계좌 사실은 생성하지 않습니다.`
    );
  }

  if (accountGrounding) {
    sentences.splice(4, 0, accountGrounding);
  }

  if (memoryGrounding) {
    sentences.splice(4, 0, memoryGrounding);
  }

  return sentences.join(" ");
}

function asksAccountFacts(message: string): boolean {
  return /계좌|보유|수량|비중|잔고|portfolio|holding|account/i.test(message);
}

function asksMemoryFacts(message: string): boolean {
  return /투자 논리|논리|원칙|기억|매매 기록|리서치|research|journal|thesis|rule|memory|recall/i.test(message);
}

function canUseProductionSnapshot(freshness?: TossReadonlySnapshotFreshness): boolean {
  return (
    freshness?.mode === "production_secret_store" &&
    freshness.source === "production_snapshot" &&
    (freshness.status === "fresh" || freshness.status === "stale") &&
    Boolean(freshness.lastSuccessfulSyncAt)
  );
}

function buildAccountGrounding(
  symbol: string,
  userMessage: string,
  freshness?: TossReadonlySnapshotFreshness,
  snapshot?: TossReadonlySnapshotBundle,
  productionFactsAllowed = true
): string | undefined {
  if (!asksAccountFacts(userMessage)) {
    return undefined;
  }

  if (!productionFactsAllowed || !freshness || !canUseProductionSnapshot(freshness) || !snapshot) {
    return `실제 계좌/보유 사실은 production_snapshot source/freshness가 없어서 모릅니다.`;
  }

  const matchingHolding = snapshot.holdings
    .flatMap((holdingSnapshot) =>
      holdingSnapshot.overview.items.map((item) => ({
        accountRef: holdingSnapshot.accountRef,
        syncedAt: holdingSnapshot.syncedAt,
        item
      }))
    )
    .find((holding) => holding.item.symbol === symbol);

  if (!matchingHolding) {
    return `production_snapshot source와 last sync ${freshness.lastSuccessfulSyncAt} 기준으로 ${symbol} 보유 항목은 확인되지 않았습니다.`;
  }

  return `production_snapshot source, last sync ${freshness.lastSuccessfulSyncAt} 기준으로 ${matchingHolding.accountRef} 계좌의 ${symbol} 보유 수량은 ${matchingHolding.item.quantity}입니다.`;
}

function canUseMemoryRecord(record: InvestmentMemoryRecord): boolean {
  const freshness = record.source?.freshness;
  if (!freshness) {
    return false;
  }
  return freshness.status === "fresh" || freshness.status === "local_manual";
}

function buildMemoryGrounding(records: InvestmentMemoryRecord[]): string | undefined {
  if (records.length === 0) {
    return undefined;
  }

  const labels = records.map((record) => `${record.kind}: ${record.title}`).join("; ");
  return `Stage 3 memory context used with source/freshness grounding: ${labels}.`;
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

      const brokerStatuses = options.brokerAdapters
        ? await Promise.all(options.brokerAdapters.map((adapter) => adapter.getStatus()))
        : [];
      if (brokerStatuses.length > 0) {
        timeline.push(
          event(
            idFactory,
            runId,
            "BrokerAgent",
            "specialist_called",
            "Published broker-independent adapter availability and capability metadata.",
            startedAt,
            {
              adapters: brokerStatuses
            }
          )
        );
      }

      const tossStatus = options.tossReadOnlyConnector ? await options.tossReadOnlyConnector.getStatus() : undefined;
      const tossSnapshotFreshness = options.tossSnapshotReader
        ? await options.tossSnapshotReader.getFreshnessStatus({ now: clock().toISOString() })
        : undefined;
      const tossSnapshot =
        tossSnapshotFreshness && canUseProductionSnapshot(tossSnapshotFreshness) && options.tossSnapshotReader?.readLatest
          ? await options.tossSnapshotReader.readLatest()
          : undefined;
      const tossBrokerStatus = brokerStatuses.find((status) => status.provider.id === "toss");
      const productionFactsAllowed =
        brokerStatuses.length === 0 ||
        tossBrokerStatus?.status === "readonly_available" ||
        tossBrokerStatus?.status === "stale";
      const accountGrounding = buildAccountGrounding(
        symbol,
        request.message,
        tossSnapshotFreshness,
        tossSnapshot,
        productionFactsAllowed
      );
      if (tossStatus && options.tossReadOnlyConnector) {
        const tossContract = options.tossReadOnlyConnector.getToolContract();
        timeline.push(
          event(idFactory, runId, "BrokerTossAgent", "specialist_called", "Published Toss read-only tool contract.", startedAt, {
            connectorStatus: tossStatus.status,
            toolContract: tossContract.tools,
            includedOperations: tossContract.includedOperations,
            forbiddenOperations: tossContract.forbiddenOperations,
            ...(tossBrokerStatus ? { brokerAdapterStatus: tossBrokerStatus } : {}),
            ...(tossSnapshotFreshness ? { snapshotFreshness: tossSnapshotFreshness } : {}),
            ...(accountGrounding ? { accountGrounding } : {})
          })
        );
      } else if (tossBrokerStatus) {
        timeline.push(
          event(
            idFactory,
            runId,
            "BrokerTossAgent",
            "specialist_called",
            "Published Toss adapter specialist status from the common broker adapter contract.",
            startedAt,
            {
              brokerAdapterStatus: tossBrokerStatus
            }
          )
        );
      }

      let memoryGrounding: string | undefined;
      if (options.investmentMemory && asksMemoryFacts(request.message)) {
        const recall = await options.investmentMemory.recall({
          symbol,
          query: request.message,
          now: clock().toISOString()
        });
        const usableMemory = recall.items.filter(canUseMemoryRecord);
        const staleSkipped: InvestmentMemorySkippedItem[] = recall.items
          .filter((item) => !canUseMemoryRecord(item))
          .map((item) => ({
            id: item.id,
            reason: "stale_source"
          }));
        const skippedMemory = [...recall.skipped, ...staleSkipped].filter(
          (item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index
        );
        memoryGrounding = buildMemoryGrounding(usableMemory);

        timeline.push(
          event(idFactory, runId, "MemoryAgent", "context_loaded", "Loaded local Stage 3 investment memory context.", startedAt, {
            usedMemory: usableMemory.map((item) => ({
              id: item.id,
              kind: item.kind,
              source: item.source.freshness.source,
              freshnessStatus: item.source.freshness.status
            })),
            skippedMemory
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
      const answer = buildAnswer(
        symbol,
        request.permissionMode,
        brokerStatuses,
        tossStatus,
        tossSnapshotFreshness,
        accountGrounding,
        memoryGrounding
      );

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
