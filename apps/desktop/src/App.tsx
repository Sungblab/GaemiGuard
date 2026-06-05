import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bot,
  ChevronDown,
  Clock,
  FileText,
  Heart,
  LineChart,
  Lock,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { AgentRunEvent, ArtifactRecord, CommanderResponse, HealthCheck } from "@gaemiguard/shared";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4317";

type HealthResponse = {
  ok: boolean;
  checks: HealthCheck[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type GuardLevel = "blocked" | "warning" | "watch" | "pass" | "pending";

type Holding = {
  name: string;
  symbol: string;
  market: string;
  price: string;
  change: string;
  weight: string;
  thesis: "유지" | "변화 감지" | "작성 필요";
  rule: GuardLevel;
  summary: string;
  action: string;
};

const holdings: Holding[] = [
  {
    name: "AMD",
    symbol: "AMD",
    market: "US",
    price: "$166.40",
    change: "-2.42%",
    weight: "18.2%",
    thesis: "변화 감지",
    rule: "warning",
    summary: "AI 서버 수요 논리는 유지되지만 환율 규칙 확인 전 추가매수 보류.",
    action: "추가매수 검문"
  },
  {
    name: "삼성전자",
    symbol: "005930",
    market: "KR",
    price: "356,500원",
    change: "-1.10%",
    weight: "12.4%",
    thesis: "유지",
    rule: "watch",
    summary: "장기 논리는 유지. 외국인 수급 악화와 반도체 집중도 재확인 필요.",
    action: "수급 리서치"
  },
  {
    name: "QQQ",
    symbol: "QQQ",
    market: "US ETF",
    price: "$537.20",
    change: "-0.82%",
    weight: "10.6%",
    thesis: "유지",
    rule: "watch",
    summary: "FOMC 전 변동성 구간. 현금 비중과 분할 원칙 점검 필요.",
    action: "변동성 체크"
  },
  {
    name: "브로드컴",
    symbol: "AVGO",
    market: "US",
    price: "$1,845.10",
    change: "+1.14%",
    weight: "4.8%",
    thesis: "작성 필요",
    rule: "pending",
    summary: "관심 종목 편입만 되어 있고 투자 논리가 비어 있음.",
    action: "논리 작성"
  }
];

const defaultHolding = holdings[0]!;

const guardLabels: Record<GuardLevel, string> = {
  blocked: "차단",
  warning: "경고",
  watch: "주의",
  pass: "통과",
  pending: "대기"
};

const guardClass: Record<GuardLevel, string> = {
  blocked: "severity blocked",
  warning: "severity warning",
  watch: "severity watch",
  pass: "severity pass",
  pending: "severity pending"
};

function statusLabel(status: HealthCheck["status"]) {
  if (status === "ok") return "정상";
  if (status === "no_broker") return "브로커 없음";
  if (status === "not_configured") return "미연결";
  if (status === "mock_replay") return "목업";
  if (status === "readonly_available") return "읽기 가능";
  if (status === "disabled") return "꺼짐";
  if (status === "warning") return "주의";
  return "오류";
}

function statusClass(status: HealthCheck["status"]) {
  return `status status-${status}`;
}

function compactHealthLabel(checks: HealthCheck[], name: string, fallback: string) {
  const check = checks.find((item) => item.name === name);
  return check ? statusLabel(check.status) : fallback;
}

function artifactKindLabel(kind: ArtifactRecord["kind"]) {
  if (kind.includes("scenario")) return "시나리오 근거";
  if (kind.includes("order_review")) return "주문 검문 기록";
  return "실행 기록";
}

function Timeline({ events }: { events: AgentRunEvent[] }) {
  return (
    <div className="timeline">
      {events.map((event) => (
        <div className="timeline-item" key={event.id}>
          <div className="timeline-dot" />
          <div>
            <div className="timeline-agent">{event.agent}</div>
            <div className="timeline-message">{event.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EvidenceList({ artifacts }: { artifacts: ArtifactRecord[] }) {
  return (
    <div className="artifact-list">
      {artifacts.map((artifact) => (
        <div className="artifact-row" key={artifact.id}>
          <FileText size={15} />
          <div>
            <div className="artifact-title">{artifact.title}</div>
            <div className="artifact-kind">{artifactKindLabel(artifact.kind)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewCard({ run, selectedHolding }: { run: CommanderResponse; selectedHolding: Holding }) {
  const blocked = run.guardrails.liveOrderBlocked;

  return (
    <div className="review-card">
      <div className="review-head">
        <span className={blocked ? "verdict hold" : "verdict pass"}>{blocked ? "보류" : "검토 완료"}</span>
        <span>{selectedHolding.symbol} 검문 결과</span>
      </div>
      <h3>{selectedHolding.name} 추가매수 검토</h3>
      <p className="review-conclusion">
        결론: 지금은 바로 매수보다 보류가 맞습니다. 현재 샘플 데이터 기준이며, 실제 Toss 계좌 연결 전입니다.
      </p>
      <div className="review-grid">
        <div>
          <strong>이유</strong>
          <ul>
            <li>현재 비중 {selectedHolding.weight}로 이미 의미 있는 노출입니다.</li>
            <li>{selectedHolding.summary}</li>
            <li>실주문은 현재 안전 정책으로 차단되어 주문 초안만 검토합니다.</li>
          </ul>
        </div>
        <div>
          <strong>주의 규칙</strong>
          <ul>
            <li>환율 조건 확인 전 추가매수 보류</li>
            <li>투자 논리 변화 감지 시 리서치 필요</li>
            <li>실계좌 확인 전 결과를 확정 판단으로 사용 금지</li>
          </ul>
        </div>
      </div>
      <div className="next-actions">
        <button type="button">투자 논리 수정</button>
        <button type="button">리서치 실행</button>
        <button type="button">주문 초안 저장</button>
      </div>
      <details className="run-details">
        <summary>
          <ChevronDown size={14} />
          실행 로그 보기
        </summary>
        <div className="run-title">
          <Heart size={15} />
          <span>{run.run.id}</span>
        </div>
        <Timeline events={run.timeline} />
        <EvidenceList artifacts={run.artifacts} />
      </details>
    </div>
  );
}

export function App() {
  const [health, setHealth] = useState<HealthCheck[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "샘플 포트폴리오로 시작했습니다. 종목을 선택하고 '더 사도 돼?'라고 물어보면 원칙과 비중 기준으로 검문합니다."
    }
  ]);
  const [selectedSymbol, setSelectedSymbol] = useState("AMD");
  const [selectedRange, setSelectedRange] = useState({ from: "2026-05-13", to: "2026-06-04" });
  const [input, setInput] = useState("AMD 2주 더 사도 됨?");
  const [currentRun, setCurrentRun] = useState<CommanderResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const selectedHolding = useMemo(
    (): Holding => holdings.find((item) => item.symbol === selectedSymbol) ?? defaultHolding,
    [selectedSymbol]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const response = await fetch(`${API_BASE}/health`);
        const body = (await response.json()) as HealthResponse;
        if (!cancelled) {
          setHealth(body.checks);
          setApiError(null);
        }
      } catch {
        if (!cancelled) {
          setApiError("로컬 API 연결이 필요합니다.");
        }
      }
    }

    loadHealth();
    const timer = window.setInterval(loadHealth, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const healthSummary = useMemo(() => {
    const ok = health.filter((check) => check.status === "ok").length;
    return `${ok}/${health.length || 7}`;
  }, [health]);

  function askQuickQuestion(question: string) {
    setInput(question);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setApiError(null);
    setMessages((items) => [...items, { role: "user", content: trimmed }]);
    setInput("");

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmed,
          permissionMode: "manual",
          context: {
            selectedSymbol: selectedHolding.symbol,
            selectedRange,
            accountLabel: "샘플 포트폴리오"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const body = (await response.json()) as CommanderResponse;
      setCurrentRun(body);
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          content: `${selectedHolding.name} 검문 결과를 카드로 정리했습니다. 실주문은 차단했고 실행 로그는 접어 두었습니다.`
        }
      ]);
    } catch {
      setApiError("Commander 요청 처리에 실패했습니다. 로컬 API를 확인한 뒤 다시 시도하세요.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={20} />
          </div>
          <div>
            <strong>GaemiGuard</strong>
            <span>샘플 모드 · Toss 미연결</span>
          </div>
        </div>
        <nav className="main-nav" aria-label="Primary">
          <a className="active">홈</a>
          <a>포트폴리오</a>
          <a>논리장부</a>
          <a>리서치</a>
          <a>원칙</a>
          <a>시나리오</a>
        </nav>
        <div className="top-actions">
          <span className="mode-badge sample">샘플 데이터</span>
          <span className="mode-badge muted">Toss 미연결</span>
          <span className="mode-badge blocked">실주문 차단</span>
          <div className="health-pill" title="설정/진단에서 자세히 보기">
            <Activity size={15} />
            <span>{healthSummary}</span>
          </div>
          <button className="icon-button" aria-label="settings" title="설정">
            <Settings size={17} />
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="dashboard">
          <div className="market-strip product-strip">
            <div className="market-card primary">
              <div className="eyebrow">Today Guard</div>
              <h1>오늘 바로 살지 말지 먼저 검문</h1>
              <p>샘플 계좌 기준으로 보유 비중, 투자 논리, 원칙 위반, 주문 가드를 한 번에 확인합니다.</p>
              <div className="guard-summary">
                <div className="guard-summary-item danger">
                  <span>차단</span>
                  <strong>1</strong>
                  <small>AMD 추가매수</small>
                </div>
                <div className="guard-summary-item warning">
                  <span>주의</span>
                  <strong>3</strong>
                  <small>수급·환율·변동성</small>
                </div>
                <div className="guard-summary-item pending">
                  <span>리서치 필요</span>
                  <strong>4</strong>
                  <small>Hermes 브리핑 대기</small>
                </div>
                <div className="guard-summary-item info">
                  <span>논리 변화</span>
                  <strong>1</strong>
                  <small>AI 서버 수요</small>
                </div>
              </div>
            </div>
            <div className="market-card">
              <div className="metric-head">
                <Wallet size={17} />
                <span>샘플 포트폴리오</span>
              </div>
              <strong>42,850,000원</strong>
              <small>실계좌 아님 · 현금 12.8%</small>
            </div>
            <div className="market-card">
              <div className="metric-head">
                <TrendingUp size={17} />
                <span>관심 리스크</span>
              </div>
              <strong>환율 규칙</strong>
              <small>미국주식 추가매수 전 확인</small>
            </div>
            <div className="market-card">
              <div className="metric-head">
                <Lock size={17} />
                <span>시스템 상태</span>
              </div>
              <strong>Read-only</strong>
              <small>Toss {compactHealthLabel(health, "toss_read_only", "미연결")} · 실주문 차단</small>
            </div>
          </div>

          <div className="content-grid">
            <section className="panel wide holdings-panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Holdings Guard</span>
                  <h2>보유/관심 종목 검문표</h2>
                </div>
                <div className="panel-actions">
                  <button
                    className="compact-button"
                    type="button"
                    onClick={() => setSelectedRange({ from: "2026-05-13", to: "2026-06-04" })}
                  >
                    <LineChart size={15} />
                    구간 선택
                  </button>
                </div>
              </div>
              <div className="sample-alert">
                <AlertCircle size={15} />
                <span>샘플 데이터입니다. Toss 연결 전까지 실계좌로 해석하지 마세요.</span>
              </div>
              <table className="holdings-table product-table">
                <thead>
                  <tr>
                    <th>종목</th>
                    <th>현재가</th>
                    <th>등락</th>
                    <th>비중</th>
                    <th>논리</th>
                    <th>원칙</th>
                    <th>AI 요약</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((item) => (
                    <tr
                      className={item.symbol === selectedHolding.symbol ? "selected" : ""}
                      key={item.symbol}
                      onClick={() => setSelectedSymbol(item.symbol)}
                    >
                      <td>
                        <div className="stock-cell">
                          <div className="stock-logo">{item.name.slice(0, 1)}</div>
                          <div>
                            <strong>{item.name}</strong>
                            <span>
                              {item.symbol} · {item.market}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{item.price}</td>
                      <td className={item.change.startsWith("+") ? "up" : "down"}>{item.change}</td>
                      <td>{item.weight}</td>
                      <td>
                        <span className={`thesis thesis-${item.thesis === "유지" ? "stable" : item.thesis === "변화 감지" ? "changed" : "missing"}`}>
                          {item.thesis}
                        </span>
                      </td>
                      <td>
                        <span className={guardClass[item.rule]}>{guardLabels[item.rule]}</span>
                      </td>
                      <td className="summary-cell">{item.summary}</td>
                      <td>
                        <button className="row-action" type="button" onClick={() => askQuickQuestion(`${item.name} ${item.action} 해줘`)}>
                          {item.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="panel priority-panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Next Checks</span>
                  <h2>먼저 볼 것</h2>
                </div>
                <AlertTriangle size={18} />
              </div>
              <div className="guard-stack">
                <div className="guard-task blocked">
                  <strong>AMD 추가매수</strong>
                  <span>환율 규칙 확인 전 보류</span>
                </div>
                <div className="guard-task warning">
                  <strong>삼성전자</strong>
                  <span>외국인 수급 악화 확인</span>
                </div>
                <div className="guard-task pending">
                  <strong>브로드컴</strong>
                  <span>투자 논리 작성 필요</span>
                </div>
              </div>
            </section>

            <section className="panel scenario-panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Scenario Lab</span>
                  <h2>시나리오 초안</h2>
                </div>
                <BarChart3 size={18} />
              </div>
              <div className="range-card">
                <span>선택 구간</span>
                <strong>
                  {selectedRange.from} - {selectedRange.to}
                </strong>
                <small>차트 구간 질문이 Agent context에 붙습니다.</small>
              </div>
              <div className="scenario-band">
                <div>
                  <strong>Bull</strong>
                  <span>AI 서버 수요 회복</span>
                </div>
                <div>
                  <strong>Base</strong>
                  <span>변동성 유지</span>
                </div>
                <div>
                  <strong>Bear</strong>
                  <span>환율·수급 악화</span>
                </div>
              </div>
            </section>

            <section className="panel diagnostics-panel">
              <details>
                <summary>
                  <span>
                    <span className="eyebrow">Diagnostics</span>
                    <strong>설정 / 로컬 런타임</strong>
                  </span>
                  <Clock size={18} />
                </summary>
                <div className="health-list">
                  {health.length === 0 ? (
                    <div className="empty-state">{apiError ?? "상태 확인 중"}</div>
                  ) : (
                    health.map((check) => (
                      <div className="health-row" key={check.name}>
                        <div>
                          <span>{check.name}</span>
                          <small>{check.message}</small>
                        </div>
                        <strong className={statusClass(check.status)}>{statusLabel(check.status)}</strong>
                      </div>
                    ))
                  )}
                </div>
              </details>
            </section>
          </div>
        </section>

        <aside className="commander-panel">
          <div className="commander-head">
            <div>
              <span className="eyebrow">Commander Agent</span>
              <h2>선택 종목 검토</h2>
            </div>
            <div className="agent-avatar">
              <Bot size={20} />
            </div>
          </div>

          <div className="context-card">
            <div className="context-top">
              <div className="stock-logo large">{selectedHolding.name.slice(0, 1)}</div>
              <div>
                <strong>{selectedHolding.name}</strong>
                <span>
                  {selectedHolding.symbol} · 비중 {selectedHolding.weight}
                </span>
              </div>
            </div>
            <div className="context-grid">
              <div>
                <span>논리</span>
                <strong>{selectedHolding.thesis}</strong>
              </div>
              <div>
                <span>원칙</span>
                <strong>{guardLabels[selectedHolding.rule]}</strong>
              </div>
              <div>
                <span>데이터</span>
                <strong>샘플</strong>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <button type="button" onClick={() => askQuickQuestion(`${selectedHolding.name} 더 사도 돼?`)}>
              원칙 체크
            </button>
            <button type="button" onClick={() => askQuickQuestion(`${selectedHolding.name} 투자 논리 변화 봐줘`)}>
              논리 변화
            </button>
            <button type="button" onClick={() => askQuickQuestion(`${selectedHolding.name} 리서치 필요 항목 정리해줘`)}>
              리서치
            </button>
            <button type="button" onClick={() => askQuickQuestion(`${selectedHolding.name} 선택 구간 이후 왜 움직였는지 봐줘`)}>
              시나리오
            </button>
          </div>

          <div className="chat-log">
            {messages.map((message, index) => (
              <div className={`chat-bubble ${message.role}`} key={`${message.role}-${index}`}>
                {message.content}
              </div>
            ))}
            {apiError ? <div className="api-error">{apiError}</div> : null}
          </div>

          {currentRun ? <ReviewCard run={currentRun} selectedHolding={selectedHolding} /> : null}

          <div className="first-run-card">
            <Sparkles size={16} />
            <div>
              <strong>First-run</strong>
              <span>Toss 연결 전에는 샘플 계좌로 Guard 경험을 먼저 확인합니다.</span>
            </div>
          </div>

          <form className="composer" onSubmit={sendMessage}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isSending}
              placeholder={isSending ? "Commander가 검토 중입니다" : "Commander에게 물어보기"}
            />
            <button aria-label="send" disabled={isSending || !input.trim()} title="전송">
              {isSending ? <Search size={18} /> : <Send size={18} />}
            </button>
          </form>
        </aside>
      </main>
    </div>
  );
}
