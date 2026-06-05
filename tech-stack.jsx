import { useState } from "react";

const MVT_STACK = [
  { layer: "Frontend", tech: "HTML 랜딩페이지", icon: "🌐", detail: "Fake-door 방식 관심도 검증" },
  { layer: "Backend", tech: "Google Apps Script", icon: "⚙️", detail: "폼 제출 → 시트 자동 기록" },
  { layer: "Database", tech: "Google Sheets", icon: "📊", detail: "피드백 & 이메일 수집 저장" },
  { layer: "API Test", tech: "Postman", icon: "📮", detail: "Apps Script 엔드포인트 검증" },
  { layer: "Deploy", tech: "Netlify", icon: "🚀", detail: "정적 호스팅 + 자동 배포" },
];

const MVP_STACK = [
  { layer: "Frontend", tech: "React + Vite", icon: "⚛️", detail: "카페 카드 UI + 네이버 지도" },
  { layer: "Backend", tech: "GitHub Actions", icon: "🔄", detail: "1시간 크론 → 혼잡도 자동 수집" },
  { layer: "Database", tech: "Firebase Firestore", icon: "🔥", detail: "실시간 좌석 & 혼잡도 DB" },
  { layer: "Data", tech: "Popular Times 수동수집", icon: "📈", detail: "Google Maps 콘솔 스크래핑" },
  { layer: "Deploy", tech: "Vercel", icon: "🚀", detail: "GitHub → 자동 CI/CD 배포" },
];

function StackColumn({ title, subtitle, items, color, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 280 }}>
      <div style={{
        textAlign: "center", marginBottom: 24,
        padding: "16px 0 12px",
        borderBottom: `3px solid ${color}`,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.15em",
          color: accent, textTransform: "uppercase", marginBottom: 4,
        }}>{subtitle}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>{title}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {items.map((item, i) => (
          <div key={i} style={{ position: "relative" }}>
            {i < items.length - 1 && (
              <div style={{
                position: "absolute", left: 28, top: 56, bottom: -8,
                width: 2, background: `${color}30`,
              }} />
            )}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 16,
              padding: "12px 16px",
              borderRadius: 12,
              transition: "background 0.15s",
              cursor: "default",
            }}
              onMouseEnter={e => e.currentTarget.style.background = `${color}08`}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${color}15`,
                border: `1.5px solid ${color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
                position: "relative", zIndex: 1,
              }}>{item.icon}</div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: accent,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  marginBottom: 2,
                }}>{item.layer}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>
                  {item.tech}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2, lineHeight: 1.4 }}>
                  {item.detail}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "60px 8px 0",
      flexShrink: 0,
    }}>
      <div style={{
        writingMode: "vertical-lr", textOrientation: "mixed",
        fontSize: 11, fontWeight: 700, color: "#bbb",
        letterSpacing: "0.1em", marginBottom: 8,
      }}>EVOLVE</div>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M8 16H24M24 16L18 10M24 16L18 22" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

export default function TechStackDiagram() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAFAF8",
      fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "40px 24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap');
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 720, margin: "0 auto 32px", textAlign: "center" }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "#999",
          letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8,
        }}>실패없는 카페 선택</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.3 }}>
          기술 스택 아키텍처
        </div>
        <div style={{ fontSize: 13, color: "#999", marginTop: 8 }}>
          MVT 가설검증 → MVP 코어기능 전환 과정
        </div>
      </div>

      {/* Stack Comparison */}
      <div style={{
        maxWidth: 720, margin: "0 auto",
        display: "flex", gap: 0, alignItems: "flex-start",
        flexWrap: "wrap", justifyContent: "center",
      }}>
        <StackColumn
          title="MVT"
          subtitle="가설 검증 단계"
          items={MVT_STACK}
          color="#f59e0b"
          accent="#d97706"
        />
        <FlowArrow />
        <StackColumn
          title="MVP"
          subtitle="코어 기능 구현"
          items={MVP_STACK}
          color="#22c55e"
          accent="#16a34a"
        />
      </div>

      {/* Key Insight */}
      <div style={{
        maxWidth: 720, margin: "36px auto 0",
        padding: "16px 20px", borderRadius: 12,
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>
          <span style={{ fontWeight: 700, color: "#1a1a1a" }}>전환 포인트</span>{" "}
          — MVT에서 Google Sheets + Apps Script로 빠르게 관심도를 검증한 뒤,
          실시간 데이터 파이프라인이 필요한 MVP 단계에서 Firebase + GitHub Actions 기반으로 전환.
          Netlify 배포 레이어는 양쪽 모두 유지하여 무료 운영 구조를 그대로 활용.
        </div>
      </div>
    </div>
  );
}
