import { useState, useEffect } from "react";
import { subscribeCafes } from "./firebase";

// ── 실제 현장 조사 데이터 (2026.05) ──────────────────────────────────────
// Firebase 연동 후에는 이 배열 대신 Firestore 실시간 구독으로 대체됨
const MOCK_CAFES = [
  {
    id: "starbucks_dongmun",
    name: "스타벅스 연대동문점",
    totalSeats: 50,
    walkMin: 2,
    naverUrl: "https://map.naver.com/v5/search/스타벅스 연대동문점",
    popularity: 72,
  },
  {
    id: "letmealone",
    name: "렛미얼론",
    totalSeats: 80,
    walkMin: 8,
    naverUrl: "https://map.naver.com/v5/search/렛미얼론",
    popularity: 38,
  },
  {
    id: "eagle_dabang",
    name: "독수리다방",
    totalSeats: 70,
    walkMin: 9,
    naverUrl: "https://map.naver.com/v5/search/독수리다방",
    popularity: 55,
  },
  {
    id: "twosome_yonsei",
    name: "투썸플레이스 신촌연세로점",
    totalSeats: 50,
    walkMin: 10,
    naverUrl: "https://map.naver.com/v5/search/투썸플레이스 신촌연세로점",
    popularity: 81,
  },
  {
    id: "starbucks_yonsei",
    name: "스타벅스 연대점",
    totalSeats: 60,
    walkMin: 9,
    naverUrl: "https://map.naver.com/v5/search/스타벅스 연대점",
    popularity: 20,
  },
  {
    id: "hollys_sinchon",
    name: "할리스커피 신촌점",
    totalSeats: 50,
    walkMin: 9,
    naverUrl: "https://map.naver.com/v5/search/할리스커피 신촌점",
    popularity: 63,
  },
  {
    id: "cafe_place",
    name: "카페 플레이스",
    totalSeats: 60,
    walkMin: 11,
    naverUrl: "https://map.naver.com/v5/search/카페 플레이스",
    popularity: 45,
  },
  {
    id: "mahogany_yonsei",
    name: "마호가니 연세대 공학관점",
    totalSeats: 40,
    walkMin: 5,
    naverUrl: "https://map.naver.com/v5/search/마호가니 연세대 공학관점",
    popularity: 30,
  },
  {
    id: "cafe_ann",
    name: "카페앤",
    totalSeats: 70,
    walkMin: 12,
    naverUrl: "https://map.naver.com/v5/search/카페앤",
    popularity: 75,
  },
];

// ── 혼잡도 계산 유틸 ──────────────────────────────────────────────────────
function getStatus(popularity) {
  if (popularity <= 40) return "여유";
  if (popularity <= 70) return "보통";
  return "혼잡";
}

function getAvailableSeats(totalSeats, popularity) {
  return Math.max(Math.round(totalSeats * (1 - popularity / 100)), 0);
}

function enrichCafe(cafe) {
  const status = getStatus(cafe.popularity);
  const available = getAvailableSeats(cafe.totalSeats, cafe.popularity);
  return { ...cafe, status, available };
}

// ── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  여유: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "🟢 여유", dot: "#22c55e" },
  보통: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "🟡 보통", dot: "#f59e0b" },
  혼잡: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "🔴 혼잡", dot: "#ef4444" },
};

const FILTERS = ["전체", "여유", "보통", "혼잡"];

// ── 컴포넌트들 ──────────────────────────────────────────────────────────────

function OccupancyBar({ popularity, status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        height: 6, borderRadius: 99,
        background: "rgba(0,0,0,0.07)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${popularity}%`,
          background: cfg.color,
          borderRadius: 99,
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99,
      background: cfg.bg,
      color: cfg.color,
      fontSize: 12, fontWeight: 700,
      letterSpacing: "0.03em",
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: cfg.color,
        display: "inline-block",
        boxShadow: `0 0 6px ${cfg.color}`,
        animation: status === "혼잡" ? "pulse 1.4s infinite" : "none",
      }} />
      {status}
    </span>
  );
}

function CafeCard({ cafe, index }) {
  const cfg = STATUS_CONFIG[cafe.status];
  const seatRatio = cafe.available / cafe.totalSeats;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: "20px 22px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        border: "1.5px solid",
        borderColor: cafe.status === "혼잡" ? "rgba(239,68,68,0.18)" : "rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        animation: `fadeUp 0.4s ease both`,
        animationDelay: `${index * 0.06}s`,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        cursor: "default",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.11)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)";
      }}
    >
      {/* 상단: 카페명 + 배지 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>
            {cafe.name}
          </div>
          <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
            도보 {cafe.walkMin}분 · {cafe.address}
          </div>
        </div>
        <StatusBadge status={cafe.status} />
      </div>

      {/* 좌석 정보 */}
      <div style={{
        marginTop: 16,
        padding: "12px 14px",
        borderRadius: 12,
        background: cfg.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <span style={{ fontSize: 26, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>
            {cafe.available}
          </span>
          <span style={{ fontSize: 13, color: "#888", marginLeft: 4 }}>
            / {cafe.totalSeats}석
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#aaa", textAlign: "right" }}>
          <div>가용 좌석</div>
          <div style={{ color: cfg.color, fontWeight: 600 }}>
            {Math.round((1 - cafe.popularity / 100) * 100)}% 비어있음
          </div>
        </div>
      </div>

      {/* 점유율 바 */}
      <OccupancyBar popularity={cafe.popularity} status={cafe.status} />

      {/* 하단 버튼 */}
      <a
        href={cafe.naverUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: 14,
          display: "block",
          textAlign: "center",
          padding: "9px 0",
          borderRadius: 10,
          background: "#1a1a1a",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#333"}
        onMouseLeave={e => e.currentTarget.style.background = "#1a1a1a"}
      >
        네이버 지도에서 보기 →
      </a>
    </div>
  );
}

function SummaryBar({ cafes }) {
  const counts = { 여유: 0, 보통: 0, 혼잡: 0 };
  cafes.forEach(c => counts[c.status]++);
  const total = cafes.length;

  return (
    <div style={{
      display: "flex",
      gap: 10,
      marginBottom: 20,
      flexWrap: "wrap",
    }}>
      {Object.entries(counts).map(([status, count]) => {
        const cfg = STATUS_CONFIG[status];
        return (
          <div key={status} style={{
            flex: 1, minWidth: 80,
            padding: "10px 14px",
            borderRadius: 14,
            background: cfg.bg,
            border: `1px solid ${cfg.color}30`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>{count}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{status} / {total}개</div>
          </div>
        );
      })}
    </div>
  );
}

// ── 메인 앱 ───────────────────────────────────────────────────────────────
export default function App() {
  const [filter, setFilter] = useState("전체");
  const [cafes, setCafes] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Firebase 실시간 구독
  useEffect(() => {
    const unsub = subscribeCafes((rawCafes) => {
      const enriched = rawCafes
        .filter(c => c.name)
        .map(c => {
          const pop = c.current_popularity ?? 50;
          return enrichCafe({
            id:         c.id,
            name:       c.name,
            totalSeats: c.total_seats ?? 50,
            walkMin:    c.walkMin ?? 10,
            naverUrl:   c.naver_url ?? "",
            popularity: pop,
          });
        });
      setCafes(enriched);
      setLastUpdated(new Date());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }

  const filtered = filter === "전체"
    ? cafes
    : cafes.filter(c => c.status === filter);

  const sortedCafes = [...filtered].sort((a, b) => a.walkMin - b.walkMin);

  const timeStr = lastUpdated.toLocaleTimeString("ko-KR", {
    hour: "2-digit", minute: "2-digit",
  });

  // 로딩 중
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#f5f4f0",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
      }}>
        <div style={{ fontSize: 32 }}>☕</div>
        <div style={{ fontSize: 14, color: "#888" }}>카페 정보 불러오는 중...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Pretendard', -apple-system, sans-serif; background: #f5f4f0; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f5f4f0" }}>

        {/* 헤더 */}
        <div style={{
          background: "#1a1a1a",
          padding: "20px 20px 0",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: "#666", letterSpacing: "0.1em", fontWeight: 600 }}>
                  SINCHON · 연세대학교
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 2 }}>
                  실패없는 카페 선택 ☕
                </div>
              </div>
              <button
                onClick={handleRefresh}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  padding: "7px 12px",
                  color: "#fff",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <span style={{ animation: refreshing ? "spin 0.7s linear infinite" : "none", display: "inline-block" }}>↻</span>
                새로고침
              </button>
            </div>

            {/* 업데이트 시간 */}
            <div style={{ fontSize: 11, color: "#555", marginTop: 8, paddingBottom: 12 }}>
              {timeStr} 기준 · 예측 데이터 (Popular Times 기반)
            </div>

            {/* 필터 탭 */}
            <div style={{
              display: "flex", gap: 0,
              borderBottom: "none",
              marginTop: 4,
            }}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    background: "none",
                    border: "none",
                    borderBottom: filter === f ? "2.5px solid #fff" : "2.5px solid transparent",
                    color: filter === f ? "#fff" : "#555",
                    fontSize: 13,
                    fontWeight: filter === f ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}
                >
                  {f}
                  {f !== "전체" && (
                    <span style={{
                      marginLeft: 4,
                      fontSize: 10,
                      color: filter === f ? STATUS_CONFIG[f].color : "#444",
                      fontWeight: 700,
                    }}>
                      {cafes.filter(c => c.status === f).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 40px" }}>

          {/* 요약 바 */}
          {filter === "전체" && <SummaryBar cafes={cafes} />}

          {/* 결과 없음 */}
          {sortedCafes.length === 0 && (
            <div style={{
              textAlign: "center", padding: "60px 0",
              color: "#aaa", fontSize: 14,
            }}>
              해당 상태의 카페가 없어요
            </div>
          )}

          {/* 카드 그리드 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {sortedCafes.map((cafe, i) => (
              <CafeCard key={cafe.id} cafe={cafe} index={i} />
            ))}
          </div>

          {/* 데이터 안내 */}
          <div style={{
            marginTop: 28,
            padding: "14px 16px",
            borderRadius: 12,
            background: "rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 11, color: "#999", lineHeight: 1.6 }}>
              ⚠️ 이 서비스는 Google Maps Popular Times 기반의 <strong>예측 데이터</strong>를 제공합니다.
              실제 좌석 상황과 다를 수 있으며, 30분 주기로 업데이트됩니다.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}