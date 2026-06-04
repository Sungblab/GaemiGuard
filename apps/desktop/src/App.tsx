import {
  Activity,
  AlertTriangle,
  Bot,
  Clock,
  Database,
  FileText,
  Heart,
  LineChart,
  Send,
  Settings,
  ShieldCheck,
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

const holdings = [
  { rank: 1, name: "삼성전자", symbol: "005930", price: "356,500원", change: "-1.10%", weight: "18.4%", risk: "외국인 순매도" },
  { rank: 2, name: "SK하이닉스", symbol: "000660", price: "2,296,000원", change: "-2.71%", weight: "9.2%", risk: "차익실현 매물" },
  { rank: 3, name: "NAVER", symbol: "035420", price: "274,000원", change: "-2.31%", weight: "6.8%", risk: "성장주 압박" },
  { rank: 4, name: "KODEX 200", symbol: "069500", price: "139,885원", change: "-1.19%", weight: "5.5%", risk: "시장 동조" }
];

function statusLabel(status: HealthCheck["status"]) {
  if (status === "ok") return "정상";
  if (status === "not_configured") return "미설정";
  if (status === "disabled") return "꺼짐";
  if (status === "warning") return "주의";
  return "오류";
}

function statusClass(status: HealthCheck["status"]) {
  return `status status-${status}`;
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

function ArtifactList({ artifacts }: { artifacts: ArtifactRecord[] }) {
  return (
    <div className="artifact-list">
      {artifacts.map((artifact) => (
        <div className="artifact-row" key={artifact.id}>
          <FileText size={15} />
          <div>
            <div className="artifact-title">{artifact.title}</div>
            <div className="artifact-kind">{artifact.kind}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function App() {
  const [health, setHealth] = useState<HealthCheck[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Today Guard 준비 완료. 계좌/차트 질문을 받으면 Commander가 Stage 1 런타임으로 검토합니다."
    }
  ]);
  const [input, setInput] = useState("삼성전자 지금 사도 되는지 내 계좌 기준으로 봐줘");
  const [currentRun, setCurrentRun] = useState<CommanderResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
            selectedSymbol: "005930",
            selectedRange: {
              from: "2026-03-01",
              to: "2026-06-04"
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const body = (await response.json()) as CommanderResponse;
      setCurrentRun(body);
      setMessages((items) => [...items, { role: "assistant", content: body.answer }]);
    } catch {
      setApiError("Commander 요청 처리에 실패했습니다.");
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
            <span>Stage 1 Foundation</span>
          </div>
        </div>
        <nav className="main-nav" aria-label="Primary">
          <a className="active">홈</a>
          <a>투자 논리</a>
          <a>내 계좌</a>
          <a>주문 가드</a>
          <a>메모리</a>
        </nav>
        <div className="top-actions">
          <div className="health-pill">
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
          <div className="market-strip">
            <div className="market-card primary">
              <div className="eyebrow">Today Guard</div>
              <h1>거래 전 한 번 더 점검</h1>
              <p>계좌, 원칙, 리서치, 시나리오, 주문 가드를 하나의 실행 기록으로 묶습니다.</p>
              <div className="guard-row">
                <span className="guard-chip safe">실주문 차단</span>
                <span className="guard-chip">dry-run 가능</span>
                <span className="guard-chip">artifact 기록</span>
              </div>
            </div>
            <div className="market-card">
              <div className="metric-head">
                <Wallet size={17} />
                <span>포트폴리오</span>
              </div>
              <strong>42,850,000원</strong>
              <small>현금 12.8% · 반도체 27.6%</small>
            </div>
            <div className="market-card">
              <div className="metric-head">
                <TrendingUp size={17} />
                <span>관심 리스크</span>
              </div>
              <strong>3건</strong>
              <small>집중도, 환율, thesis 누락</small>
            </div>
            <div className="market-card">
              <div className="metric-head">
                <Database size={17} />
                <span>저장소</span>
              </div>
              <strong>SQLite</strong>
              <small>run · audit · artifact index</small>
            </div>
          </div>

          <div className="content-grid">
            <section className="panel wide">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Holdings</span>
                  <h2>내 계좌 기준 샘플 뷰</h2>
                </div>
                <button className="compact-button">
                  <LineChart size={15} />
                  차트
                </button>
              </div>
              <table className="holdings-table">
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>종목</th>
                    <th>현재가</th>
                    <th>등락</th>
                    <th>비중</th>
                    <th>가드</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((item) => (
                    <tr key={item.symbol}>
                      <td>{item.rank}</td>
                      <td>
                        <div className="stock-cell">
                          <div className="stock-logo">{item.name.slice(0, 1)}</div>
                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.symbol}</span>
                          </div>
                        </div>
                      </td>
                      <td>{item.price}</td>
                      <td className="down">{item.change}</td>
                      <td>{item.weight}</td>
                      <td>{item.risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Order Guard</span>
                  <h2>주문 권한</h2>
                </div>
                <AlertTriangle size={18} />
              </div>
              <div className="rule-list">
                <div className="rule-row blocked">
                  <span>live submit</span>
                  <strong>blocked</strong>
                </div>
                <div className="rule-row">
                  <span>order draft</span>
                  <strong>allowed</strong>
                </div>
                <div className="rule-row">
                  <span>dry-run review</span>
                  <strong>audited</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Runtime Health</span>
                  <h2>로컬 상태</h2>
                </div>
                <Clock size={18} />
              </div>
              <div className="health-list">
                {health.length === 0 ? (
                  <div className="empty-state">{apiError ?? "상태 확인 중"}</div>
                ) : (
                  health.map((check) => (
                    <div className="health-row" key={check.name}>
                      <span>{check.name}</span>
                      <strong className={statusClass(check.status)}>{statusLabel(check.status)}</strong>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="panel wide">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Scenario Lab</span>
                  <h2>MiroFish 준비 artifact</h2>
                </div>
                <Bot size={18} />
              </div>
              <div className="scenario-band">
                <div>
                  <strong>Bull</strong>
                  <span>업황 회복, 수급 개선</span>
                </div>
                <div>
                  <strong>Base</strong>
                  <span>변동성 유지, 논리 재검토</span>
                </div>
                <div>
                  <strong>Bear</strong>
                  <span>환율, 실적, 매도 압력</span>
                </div>
              </div>
            </section>
          </div>
        </section>

        <aside className="commander-panel">
          <div className="commander-head">
            <div>
              <span className="eyebrow">Commander Agent</span>
              <h2>작업 지휘</h2>
            </div>
            <div className="agent-avatar">
              <Bot size={20} />
            </div>
          </div>

          <div className="chat-log">
            {messages.map((message, index) => (
              <div className={`chat-bubble ${message.role}`} key={`${message.role}-${index}`}>
                {message.content}
              </div>
            ))}
            {apiError ? <div className="api-error">{apiError}</div> : null}
          </div>

          {currentRun ? (
            <div className="run-card">
              <div className="run-title">
                <Heart size={15} />
                <span>{currentRun.run.id}</span>
              </div>
              <Timeline events={currentRun.timeline} />
              <ArtifactList artifacts={currentRun.artifacts} />
            </div>
          ) : null}

          <form className="composer" onSubmit={sendMessage}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Commander에게 물어보기"
            />
            <button aria-label="send" disabled={isSending || !input.trim()} title="전송">
              <Send size={18} />
            </button>
          </form>
        </aside>
      </main>
    </div>
  );
}

