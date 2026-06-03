import { useState, useEffect } from "react";
import { subscribeCafes } from "./firebase";

// ── 카페별 영업시간 (프론트에서 직접 관리) ─────────────────────────────────
// schedule: 요일별 { open: "HH:MM", close: "HH:MM" } or null(휴무)
// 요일: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
const CAFE_HOURS = {
  // 스타벅스 신촌명물거리점 — 매일 9시~21시
  starbucks_myeongmul: {
    mon: { open: 9, close: 21 },
    tue: { open: 9, close: 21 },
    wed: { open: 9, close: 21 },
    thu: { open: 9, close: 21 },
    fri: { open: 9, close: 21 },
    sat: { open: 9, close: 21 },
    sun: { open: 9, close: 21 },
  },
  // 스타벅스 신촌점 — 평일 : 7시~22시 주말 : 8시~22시
  starbucks_sinchon: {
    mon: { open: 7, close: 22 },
    tue: { open: 7, close: 22 },
    wed: { open: 7, close: 22 },
    thu: { open: 7, close: 22 },
    fri: { open: 7, close: 22 },
    sat: { open: 8, close: 22 },
    sun: { open: 8, close: 22 },
  },
  // 투썸플레이스 신촌기차역점 — 매일 10시30분~23시30분
  twosome_sinchon_station: {
    mon: { open: 10.5, close: 23.5 },
    tue: { open: 10.5, close: 23.5 },
    wed: { open: 10.5, close: 23.5 },
    thu: { open: 10.5, close: 23.5 },
    fri: { open: 10.5, close: 23.5 },
    sat: { open: 10.5, close: 23.5 },
    sun: { open: 10.5, close: 23.5 },
  },
  // 할리스 신촌역점 — 매일 10시~21시
  hollys_sinchon_station: {
    mon: { open: 10, close: 21 },
    tue: { open: 10, close: 21 },
    wed: { open: 10, close: 21 },
    thu: { open: 10, close: 21 },
    fri: { open: 10, close: 21 },
    sat: { open: 10, close: 21 },
    sun: { open: 10, close: 21 },
  },
  // 커피빈 신촌점 — 평일 : 7시~22시 주말 : 8시~22시
  coffeebean_sinchon: {
    mon: { open: 7, close: 22 },
    tue: { open: 7, close: 22 },
    wed: { open: 7, close: 22 },
    thu: { open: 7, close: 22 },
    fri: { open: 7, close: 22 },
    sat: { open: 8, close: 22 },
    sun: { open: 8, close: 22 },
  },
  // 포티드 — 매일 11시30분~22시30분
  fortyd: {
    mon: { open: 11.5, close: 22.5 },
    tue: { open: 11.5, close: 22.5 },
    wed: { open: 11.5, close: 22.5 },
    thu: { open: 11.5, close: 22.5 },
    fri: { open: 11.5, close: 22.5 },
    sat: { open: 11.5, close: 22.5 },
    sun: { open: 11.5, close: 22.5 },
  },
  // 플릭온커피 — 평일 9시~18시 주말 11시~18시
  flickon_coffee: {
    mon: { open: 9, close: 18 },
    tue: { open: 9, close: 18 },
    wed: { open: 9, close: 18 },
    thu: { open: 9, close: 18 },
    fri: { open: 9, close: 18 },
    sat: { open: 11, close: 18 },
    sun: { open: 11, close: 18 },
  },
  // 설빙 신촌점 — 매일 11시30분~23시30분
  sulbing_sinchon: {
    mon: { open: 11.5, close: 23.5 },
    tue: { open: 11.5, close: 23.5 },
    wed: { open: 11.5, close: 23.5 },
    thu: { open: 11.5, close: 23.5 },
    fri: { open: 11.5, close: 23.5 },
    sat: { open: 11.5, close: 23.5 },
    sun: { open: 11.5, close: 23.5 },
  },
  // 클로리스 신촌본점 — 월~토 : 11시~23시 일 : 13시~23시
  chloris_sinchon: {
    mon: { open: 11, close: 23 },
    tue: { open: 11, close: 23 },
    wed: { open: 11, close: 23 },
    thu: { open: 11, close: 23 },
    fri: { open: 11, close: 23 },
    sat: { open: 11, close: 23 },
    sun: { open: 13, close: 23 },
  },
  // 투썸플레이스 신촌연세로점 — 매일 8시~24시
  twosome_yonsei: {
    mon: { open: 8, close: 24 },
    tue: { open: 8, close: 24 },
    wed: { open: 8, close: 24 },
    thu: { open: 8, close: 24 },
    fri: { open: 8, close: 24 },
    sat: { open: 8, close: 24 },
    sun: { open: 8, close: 24 },
  },
  // 스타벅스 연대점 — 매일 9시~20시
  starbucks_yonsei: {
    mon: { open: 9, close: 20 },
    tue: { open: 9, close: 20 },
    wed: { open: 9, close: 20 },
    thu: { open: 9, close: 20 },
    fri: { open: 9, close: 20 },
    sat: { open: 9, close: 20 },
    sun: { open: 9, close: 20 },
  },
  // 할리스 신촌점 — 매일 9시~23시
  hollys_sinchon: {
    mon: { open: 9, close: 23 },
    tue: { open: 9, close: 23 },
    wed: { open: 9, close: 23 },
    thu: { open: 9, close: 23 },
    fri: { open: 9, close: 23 },
    sat: { open: 9, close: 23 },
    sun: { open: 9, close: 23 },
  },
  // 렛미얼론 — 매일 8시~23시
  letmealone: {
    mon: { open: 8, close: 23 },
    tue: { open: 8, close: 23 },
    wed: { open: 8, close: 23 },
    thu: { open: 8, close: 23 },
    fri: { open: 8, close: 23 },
    sat: { open: 8, close: 23 },
    sun: { open: 8, close: 23 },
  },
  // 앨피스카페 신촌점 — 월~목 11시~21시 금요일 10시~21시 공휴일,토요일 11시~21시 일요일 9시~18시
  elpis_sinchon: {
    mon: { open: 11, close: 21 },
    tue: { open: 11, close: 21 },
    wed: { open: 11, close: 21 },
    thu: { open: 11, close: 21 },
    fri: { open: 10, close: 21 },
    sat: { open: 11, close: 21 },
    sun: { open: 9, close: 18 },
  },
  // 카페앤 신촌점 — 24시
  cafe_ann: {
    mon: { open: 0, close: 24 },
    tue: { open: 0, close: 24 },
    wed: { open: 0, close: 24 },
    thu: { open: 0, close: 24 },
    fri: { open: 0, close: 24 },
    sat: { open: 0, close: 24 },
    sun: { open: 0, close: 24 },
  },
  // 독수리다방 — 매일 11시~23시30분
  eagle_dabang: {
    mon: { open: 11, close: 23.5 },
    tue: { open: 11, close: 23.5 },
    wed: { open: 11, close: 23.5 },
    thu: { open: 11, close: 23.5 },
    fri: { open: 11, close: 23.5 },
    sat: { open: 11, close: 23.5 },
    sun: { open: 11, close: 23.5 },
  },
  // 마호가니 연세대점 — 월~토 8시~20시 공휴일, 일요일 휴무
  mahogany_yonsei: {
    mon: { open: 8, close: 20 },
    tue: { open: 8, close: 20 },
    wed: { open: 8, close: 20 },
    thu: { open: 8, close: 20 },
    fri: { open: 8, close: 20 },
    sat: { open: 8, close: 20 },
    sun: null, // 휴무
  },
};

// CBTI 유형별 추천 카페 매핑
const CBTI_CAFE_MAP = {
  "카페 노마드": ["starbucks_myeongmul", "starbucks_sinchon", "starbucks_yonsei", "mahogany_yonsei"],
  "디저트 의존러": ["twosome_sinchon_station", "sulbing_sinchon", "twosome_yonsei"],
  "장기 체류러": ["hollys_sinchon_station", "hollys_sinchon", "elpis_sinchon", "cafe_ann"],
  "사교 공부러": ["coffeebean_sinchon", "eagle_dabang"],
  "감성 사냥꾼": ["fortyd", "flickon_coffee", "chloris_sinchon"],
  "커피 본질러": ["letmealone"],
};

// 현재 요일의 영업시간 반환 ({ open, close } or null=휴무)
function getTodayHours(cafeId) {
  const schedule = CAFE_HOURS[cafeId];
  if (!schedule) return null;
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const key = dayKeys[new Date().getDay()];
  return schedule[key] ?? null;
}

// 영업 상태 계산
// returns: "영업종료" | "마감임박" | "영업중"
function getBusinessStatus(cafeId) {
  const hours = getTodayHours(cafeId);
  if (!hours) return { type: "영업종료", closingMinutes: null };

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin  = Math.round(hours.open * 60);
  const closeMin = Math.round((hours.close >= 24 ? 23.99 : hours.close) * 60);

  if (nowMin < openMin || nowMin >= closeMin) {
    return { type: "영업종료", closingMinutes: null };
  }

  const remaining = closeMin - nowMin;
  if (remaining <= 60) {
    return { type: "마감임박", closingMinutes: remaining };
  }

  return { type: "영업중", closingMinutes: null };
}

// ── MOCK 데이터 ───────────────────────────────────────────────────────────
const MOCK_CAFES = [
  { id: "starbucks_myeongmul", name: "스타벅스 신촌명물거리점", totalSeats: 100, walkMin: 8,  naverUrl: "https://map.naver.com/p/entry/place/13570666", popularity: 40 },
  { id: "starbucks_sinchon",   name: "스타벅스 신촌점",        totalSeats: 120, walkMin: 7,  naverUrl: "https://map.naver.com/p/entry/place/11689850", popularity: 50 },
  { id: "twosome_sinchon_station", name: "투썸플레이스 신촌기차역점", totalSeats: 50, walkMin: 10, naverUrl: "https://map.naver.com/p/entry/place/18231613", popularity: 65 },
  { id: "hollys_sinchon_station", name: "할리스 신촌역점",     totalSeats: 100, walkMin: 9,  naverUrl: "https://map.naver.com/p/entry/place/1816577852", popularity: 35 },
  { id: "coffeebean_sinchon",  name: "커피빈 신촌점",          totalSeats: 120, walkMin: 8,  naverUrl: "https://map.naver.com/p/entry/place/20561789", popularity: 55 },
  { id: "fortyd",              name: "포티드",                  totalSeats: 30,  walkMin: 11, naverUrl: "https://map.naver.com/p/entry/place/1946991741", popularity: 45 },
  { id: "flickon_coffee",      name: "플릭온커피",              totalSeats: 10,  walkMin: 12, naverUrl: "https://map.naver.com/p/entry/place/1937057390", popularity: 30 },
  { id: "sulbing_sinchon",     name: "설빙 신촌점",             totalSeats: 70,  walkMin: 10, naverUrl: "https://map.naver.com/p/entry/place/35150556",  popularity: 50 },
  { id: "chloris_sinchon",     name: "클로리스 신촌본점",       totalSeats: 20,  walkMin: 11, naverUrl: "https://map.naver.com/p/entry/place/13073862",  popularity: 60 },
  { id: "twosome_yonsei",      name: "투썸플레이스 신촌연세로점", totalSeats: 120, walkMin: 10, naverUrl: "https://map.naver.com/p/entry/place/1935823121", popularity: 55 },
  { id: "starbucks_yonsei",    name: "스타벅스 연대점",          totalSeats: 120, walkMin: 9,  naverUrl: "https://map.naver.com/p/entry/place/11807591",  popularity: 45 },
  { id: "hollys_sinchon",      name: "할리스 신촌점",            totalSeats: 120, walkMin: 9,  naverUrl: "https://map.naver.com/p/entry/place/11593558",  popularity: 40 },
  { id: "letmealone",          name: "렛미얼론",                 totalSeats: 120, walkMin: 8,  naverUrl: "https://map.naver.com/p/entry/place/1618419604", popularity: 38 },
  { id: "elpis_sinchon",       name: "앨피스카페 신촌점",        totalSeats: 80,  walkMin: 10, naverUrl: "https://map.naver.com/p/entry/place/38275926",  popularity: 65 },
  { id: "cafe_ann",            name: "카페앤 신촌점",            totalSeats: 80,  walkMin: 12, naverUrl: "https://map.naver.com/p/entry/place/1975933458", popularity: 25 },
  { id: "eagle_dabang",        name: "독수리다방",               totalSeats: 80,  walkMin: 9,  naverUrl: "https://map.naver.com/p/entry/place/31608233",  popularity: 75 },
  { id: "mahogany_yonsei",     name: "마호가니 연세대점",        totalSeats: 50,  walkMin: 5,  naverUrl: "https://map.naver.com/p/entry/place/1432206951", popularity: 30 },
];

// ── 혼잡도 계산 ───────────────────────────────────────────────────────────
function getOccupancyStatus(popularity) {
  if (popularity <= 40) return "여유";
  if (popularity <= 70) return "보통";
  return "혼잡";
}

function getAvailableSeats(totalSeats, popularity) {
  return Math.max(Math.round(totalSeats * (1 - popularity / 100)), 0);
}

function enrichCafe(cafe) {
  const biz = getBusinessStatus(cafe.id);
  const isClosed  = biz.type === "영업종료";
  const isClosing = biz.type === "마감임박";

  const occStatus = isClosed ? "영업종료" : getOccupancyStatus(cafe.popularity);
  const available = isClosed ? 0 : getAvailableSeats(cafe.totalSeats, cafe.popularity);

  return { ...cafe, status: occStatus, available, isClosing, closingMinutes: biz.closingMinutes };
}

// ── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  여유:     { color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  보통:     { color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  혼잡:     { color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  영업종료: { color: "#9ca3af", bg: "rgba(156,163,175,0.10)" },
};

const OPEN_FILTERS = ["전체", "여유", "보통", "혼잡"];

function getDirectionUrl(cafe) {
  if (cafe.naverDirectionUrl) return cafe.naverDirectionUrl;
  return cafe.naverUrl || "#";
}

// ── OccupancyBar ──────────────────────────────────────────────────────────
function OccupancyBar({ popularity, status }) {
  if (status === "영업종료") return null;
  const cfg = STATUS_CONFIG[status];
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ height: 6, borderRadius: 99, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${popularity}%`,
          background: cfg.color, borderRadius: 99,
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  const isClosed = status === "영업종료";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 700, letterSpacing: "0.03em",
    }}>
      {!isClosed && (
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: cfg.color, display: "inline-block",
          boxShadow: status === "혼잡" ? `0 0 6px ${cfg.color}` : "none",
          animation: status === "혼잡" ? "pulse 1.4s infinite" : "none",
        }} />
      )}
      {status}
    </span>
  );
}

// ── ClosingBadge (마감임박 배지) ──────────────────────────────────────────
function ClosingBadge({ minutes }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 9px", borderRadius: 99,
      background: "rgba(249,115,22,0.12)",
      color: "#f97316",
      fontSize: 11, fontWeight: 700,
      marginLeft: 6,
    }}>
      🕐 {minutes}분 후 마감
    </span>
  );
}

// ── CafeCard ──────────────────────────────────────────────────────────────
function CafeCard({ cafe, index }) {
  const isClosed  = cafe.status === "영업종료";
  const isClosing = cafe.isClosing;
  const cfg = STATUS_CONFIG[cafe.status];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: "20px 22px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        border: "1.5px solid",
        borderColor: isClosing
          ? "rgba(249,115,22,0.25)"
          : !isClosed && cafe.status === "혼잡"
            ? "rgba(239,68,68,0.18)"
            : "rgba(0,0,0,0.06)",
        display: "flex", flexDirection: "column", gap: 0,
        opacity: isClosed ? 0.5 : 1,
        animation: `fadeUp 0.4s ease both`,
        animationDelay: `${index * 0.06}s`,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        cursor: "default",
      }}
      onMouseEnter={e => {
        if (isClosed) return;
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.11)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)";
      }}
    >
      {/* 상단: 카페명 + 배지들 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: isClosed ? "#aaa" : "#1a1a1a", lineHeight: 1.3 }}>
            {cafe.name}
          </div>
          <div style={{ fontSize: 12, color: "#bbb", marginTop: 2 }}>
            도보 {cafe.walkMin}분
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
          <StatusBadge status={cafe.status} />
          {isClosing && <ClosingBadge minutes={cafe.closingMinutes} />}
        </div>
      </div>

      {/* 좌석 정보 or 영업종료 안내 */}
      {isClosed ? (
        <div style={{
          marginTop: 16, padding: "14px", borderRadius: 12,
          background: "rgba(0,0,0,0.03)", textAlign: "center",
          color: "#bbb", fontSize: 13,
        }}>
          현재 영업 중이 아닙니다
        </div>
      ) : (
        <div style={{
          marginTop: 16, padding: "12px 14px", borderRadius: 12,
          background: isClosing ? "rgba(249,115,22,0.07)" : cfg.bg,
          display: "flex", alignItems: "center", justifyContent: "space-between",
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
      )}

      <OccupancyBar popularity={cafe.popularity} status={cafe.status} />

      {/* 길찾기 버튼 */}
      <a
        href={getDirectionUrl(cafe)}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: 14, display: "block", textAlign: "center",
          padding: "9px 0", borderRadius: 10,
          background: isClosed ? "transparent" : "#1a1a1a",
          border: isClosed ? "1.5px solid #ddd" : "none",
          color: isClosed ? "#bbb" : "#fff",
          fontSize: 13, fontWeight: 600, textDecoration: "none",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => { if (!isClosed) e.currentTarget.style.background = "#333"; }}
        onMouseLeave={e => { if (!isClosed) e.currentTarget.style.background = "#1a1a1a"; }}
      >
        길찾기 →
      </a>
    </div>
  );
}

// ── SummaryBar ────────────────────────────────────────────────────────────
function SummaryBar({ cafes, activeFilter, onFilter }) {
  const openCafes   = cafes.filter(c => c.status !== "영업종료");
  const closedCount = cafes.length - openCafes.length;
  const counts = { 여유: 0, 보통: 0, 혼잡: 0 };
  openCafes.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {Object.entries(counts).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status];
          const isActive = activeFilter === status;
          return (
            <div
              key={status}
              onClick={() => onFilter(isActive ? "전체" : status)}
              style={{
                flex: 1, minWidth: 80, padding: "10px 14px",
                borderRadius: 14,
                background: isActive ? cfg.color + "25" : cfg.bg,
                border: `1.5px solid ${isActive ? cfg.color : cfg.color + "30"}`,
                textAlign: "center", cursor: "pointer",
                transition: "all 0.15s",
                transform: isActive ? "scale(1.03)" : "scale(1)",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>{count}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                {status} / {cafes.length}개
              </div>
            </div>
          );
        })}
      </div>
      {closedCount > 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#bbb", textAlign: "right" }}>
          영업종료 {closedCount}곳 포함
        </div>
      )}
    </div>
  );
}

// ── 메인 앱 ───────────────────────────────────────────────────────────────
export default function App() {
  const [filter,      setFilter]      = useState("전체");
  const [cafes,       setCafes]       = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const unsub = subscribeCafes((rawCafes) => {
      const enriched = rawCafes
        .filter(c => c.name)
        .map(c => enrichCafe({
          id:                c.id,
          name:              c.name,
          totalSeats:        c.total_seats ?? 50,
          walkMin:           c.walkMin ?? 10,
          naverUrl:          c.naver_url ?? "",
          naverDirectionUrl: c.naver_direction_url ?? null,
          lat:               c.lat ?? 0,
          lng:               c.lng ?? 0,
          popularity:        c.current_popularity ?? 0,
        }));
      setCafes(enriched);
      setLastUpdated(new Date());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openCafes   = cafes.filter(c => c.status !== "영업종료");
  const closedCafes = cafes.filter(c => c.status === "영업종료");

  const filteredOpen = filter === "전체"
    ? openCafes
    : openCafes.filter(c => c.status === filter);

  const sortByName   = arr => [...arr].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const sortedOpen   = sortByName(filteredOpen);
  const sortedClosed = filter === "전체" ? sortByName(closedCafes) : [];
  const displayList  = [...sortedOpen, ...sortedClosed];

  const timeStr = lastUpdated.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

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
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f5f4f0" }}>

        {/* 헤더 */}
        <div style={{
          background: "#1a1a1a", padding: "20px 20px 0",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ fontSize: 11, color: "#666", letterSpacing: "0.1em", fontWeight: 600 }}>
              SINCHON · 연세대학교
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 2 }}>
              실패없는 카페 선택 ☕
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 8, paddingBottom: 12 }}>
              {timeStr} 기준 · 예측 데이터 (Popular Times 기반)
            </div>

            {/* 필터 탭 */}
            <div style={{ display: "flex", gap: 0 }}>
              {OPEN_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    flex: 1, padding: "10px 0",
                    background: "none", border: "none",
                    borderBottom: filter === f ? "2.5px solid #fff" : "2.5px solid transparent",
                    color: filter === f ? "#fff" : "#555",
                    fontSize: 13, fontWeight: filter === f ? 700 : 500,
                    cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                  }}
                >
                  {f}
                  {f !== "전체" && (
                    <span style={{
                      marginLeft: 4, fontSize: 10,
                      color: filter === f ? STATUS_CONFIG[f].color : "#444",
                      fontWeight: 700,
                    }}>
                      {openCafes.filter(c => c.status === f).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 40px" }}>

          {filter === "전체" && (
            <SummaryBar cafes={cafes} activeFilter={filter} onFilter={setFilter} />
          )}

          {displayList.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa", fontSize: 14 }}>
              해당 상태의 카페가 없어요
            </div>
          )}

          {/* 전체 탭: 영업중 → 구분선 → 영업종료 */}
          {filter === "전체" && sortedOpen.length > 0 && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {sortedOpen.map((cafe, i) => <CafeCard key={cafe.id} cafe={cafe} index={i} />)}
              </div>

              {sortedClosed.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 14px" }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
                    <span style={{ fontSize: 11, color: "#bbb" }}>영업종료</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {sortedClosed.map((cafe, i) => <CafeCard key={cafe.id} cafe={cafe} index={sortedOpen.length + i} />)}
                  </div>
                </>
              )}
            </>
          )}

          {/* 필터 탭 (여유/보통/혼잡) */}
          {filter !== "전체" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {displayList.map((cafe, i) => <CafeCard key={cafe.id} cafe={cafe} index={i} />)}
            </div>
          )}

          {/* 데이터 안내 */}
          <div style={{
            marginTop: 28, padding: "14px 16px", borderRadius: 12,
            background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 11, color: "#999", lineHeight: 1.6 }}>
              ⚠️ 이 서비스는 Google Maps Popular Times 기반의 <strong>예측 데이터</strong>를 제공합니다.
              실제 좌석 상황과 다를 수 있으며, 1시간 주기로 업데이트됩니다.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}