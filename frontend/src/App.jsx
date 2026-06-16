import { useState, useEffect, useCallback, useRef } from "react";
import { subscribeCafes, logEvent } from "./firebase";

// ── 영업시간 ───────────────────────────────────────────────────────────────
const CAFE_HOURS = {
  starbucks_myeongmul: { mon:{open:9,close:21},tue:{open:9,close:21},wed:{open:9,close:21},thu:{open:9,close:21},fri:{open:9,close:21},sat:{open:9,close:21},sun:{open:9,close:21} },
  starbucks_sinchon:   { mon:{open:7,close:22},tue:{open:7,close:22},wed:{open:7,close:22},thu:{open:7,close:22},fri:{open:7,close:22},sat:{open:8,close:22},sun:{open:8,close:22} },
  twosome_sinchon_station: { mon:{open:10.5,close:23.5},tue:{open:10.5,close:23.5},wed:{open:10.5,close:23.5},thu:{open:10.5,close:23.5},fri:{open:10.5,close:23.5},sat:{open:10.5,close:23.5},sun:{open:10.5,close:23.5} },
  hollys_sinchon_station:  { mon:{open:10,close:21},tue:{open:10,close:21},wed:{open:10,close:21},thu:{open:10,close:21},fri:{open:10,close:21},sat:{open:10,close:21},sun:{open:10,close:21} },
  coffeebean_sinchon:  { mon:{open:7,close:22},tue:{open:7,close:22},wed:{open:7,close:22},thu:{open:7,close:22},fri:{open:7,close:22},sat:{open:8,close:22},sun:{open:8,close:22} },
  fortyd:              { mon:{open:11.5,close:22.5},tue:{open:11.5,close:22.5},wed:{open:11.5,close:22.5},thu:{open:11.5,close:22.5},fri:{open:11.5,close:22.5},sat:{open:11.5,close:22.5},sun:{open:11.5,close:22.5} },
  flickon_coffee:      { mon:{open:9,close:18},tue:{open:9,close:18},wed:{open:9,close:18},thu:{open:9,close:18},fri:{open:9,close:18},sat:{open:11,close:18},sun:{open:11,close:18} },
  sulbing_sinchon:     { mon:{open:11.5,close:23.5},tue:{open:11.5,close:23.5},wed:{open:11.5,close:23.5},thu:{open:11.5,close:23.5},fri:{open:11.5,close:23.5},sat:{open:11.5,close:23.5},sun:{open:11.5,close:23.5} },
  chloris_sinchon:     { mon:{open:11,close:23},tue:{open:11,close:23},wed:{open:11,close:23},thu:{open:11,close:23},fri:{open:11,close:23},sat:{open:11,close:23},sun:{open:13,close:23} },
  twosome_yonsei:      { mon:{open:8,close:24},tue:{open:8,close:24},wed:{open:8,close:24},thu:{open:8,close:24},fri:{open:8,close:24},sat:{open:8,close:24},sun:{open:8,close:24} },
  starbucks_yonsei:    { mon:{open:9,close:20},tue:{open:9,close:20},wed:{open:9,close:20},thu:{open:9,close:20},fri:{open:9,close:20},sat:{open:9,close:20},sun:{open:9,close:20} },
  hollys_sinchon:      { mon:{open:9,close:23},tue:{open:9,close:23},wed:{open:9,close:23},thu:{open:9,close:23},fri:{open:9,close:23},sat:{open:9,close:23},sun:{open:9,close:23} },
  letmealone:          { mon:{open:8,close:23},tue:{open:8,close:23},wed:{open:8,close:23},thu:{open:8,close:23},fri:{open:8,close:23},sat:{open:8,close:23},sun:{open:8,close:23} },
  elpis_sinchon:       { mon:{open:11,close:21},tue:{open:11,close:21},wed:{open:11,close:21},thu:{open:11,close:21},fri:{open:10,close:21},sat:{open:11,close:21},sun:{open:9,close:18} },
  cafe_ann:            { mon:{open:0,close:24},tue:{open:0,close:24},wed:{open:0,close:24},thu:{open:0,close:24},fri:{open:0,close:24},sat:{open:0,close:24},sun:{open:0,close:24} },
  eagle_dabang:        { mon:{open:11,close:23.5},tue:{open:11,close:23.5},wed:{open:11,close:23.5},thu:{open:11,close:23.5},fri:{open:11,close:23.5},sat:{open:11,close:23.5},sun:{open:11,close:23.5} },
  mahogany_yonsei:     { mon:{open:8,close:20},tue:{open:8,close:20},wed:{open:8,close:20},thu:{open:8,close:20},fri:{open:8,close:20},sat:{open:8,close:20},sun:null },
};

// ── CBTI 유형별 매핑 ────────────────────────────────────────────────────────
const CBTI_CAFE_MAP = {
  "카페 노마드":   ["starbucks_myeongmul","starbucks_sinchon","starbucks_yonsei","mahogany_yonsei"],
  "디저트 의존러": ["twosome_sinchon_station","sulbing_sinchon","twosome_yonsei"],
  "장기 체류러":   ["hollys_sinchon_station","hollys_sinchon","elpis_sinchon","cafe_ann"],
  "사교 공부러":   ["coffeebean_sinchon","eagle_dabang"],
  "감성 사냥꾼":   ["fortyd","flickon_coffee","chloris_sinchon"],
  "커피 본질러":   ["letmealone"],
};

// ── 타입 색상 설정 ──────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  "카페 노마드":   { bg:"rgba(99,102,241,0.12)",  color:"#6366f1" },
  "디저트 의존러": { bg:"rgba(236,72,153,0.12)",  color:"#ec4899" },
  "장기 체류러":   { bg:"rgba(245,158,11,0.12)",  color:"#d97706" },
  "사교 공부러":   { bg:"rgba(34,197,94,0.12)",   color:"#16a34a" },
  "감성 사냥꾼":   { bg:"rgba(168,85,247,0.12)",  color:"#9333ea" },
  "커피 본질러":   { bg:"rgba(120,53,15,0.12)",   color:"#92400e" },
};

// ── Helpers ────────────────────────────────────────────────────────────────
const DAY_KEYS = ["sun","mon","tue","wed","thu","fri","sat"];

function getTodayHours(cafeId) {
  const schedule = CAFE_HOURS[cafeId];
  if (!schedule) return null;
  return schedule[DAY_KEYS[new Date().getDay()]] ?? null;
}

function getBusinessStatus(cafeId) {
  const hours = getTodayHours(cafeId);
  if (!hours) return { type:"영업종료", closingMinutes:null };
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes();
  const openMin  = Math.round(hours.open*60);
  const closeMin = Math.round((hours.close>=24 ? 23.99 : hours.close)*60);
  if (nowMin < openMin || nowMin >= closeMin) return { type:"영업종료", closingMinutes:null };
  const remaining = closeMin - nowMin;
  if (remaining <= 60) return { type:"마감임박", closingMinutes:remaining };
  return { type:"영업중", closingMinutes:null };
}

function getOccupancyStatus(popularity) {
  if (popularity <= 40) return "여유";
  if (popularity <= 70) return "보통";
  return "혼잡";
}

function getAvailableSeats(totalSeats, popularity) {
  return Math.max(Math.round(totalSeats*(1-popularity/100)), 0);
}

function enrichCafe(cafe) {
  const biz = getBusinessStatus(cafe.id);
  const isClosed  = biz.type === "영업종료";
  const isClosing = biz.type === "마감임박";
  const occStatus = isClosed ? "영업종료" : getOccupancyStatus(cafe.popularity);
  const available = isClosed ? 0 : getAvailableSeats(cafe.totalSeats, cafe.popularity);
  return { ...cafe, status:occStatus, available, isClosing, closingMinutes:biz.closingMinutes };
}

function formatHour(h) {
  const hh = Math.floor(h >= 24 ? 0 : h);
  const mm = h % 1 ? "30" : "00";
  return `${hh}:${mm}`;
}

function getDirectionUrl(cafe) {
  return cafe.naverDirectionUrl || cafe.naverUrl || "#";
}

// ── 상수 ────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  여유:     { color:"#22c55e", bg:"rgba(34,197,94,0.12)"   },
  보통:     { color:"#f59e0b", bg:"rgba(245,158,11,0.12)"  },
  혼잡:     { color:"#ef4444", bg:"rgba(239,68,68,0.12)"   },
  영업종료: { color:"#9ca3af", bg:"rgba(156,163,175,0.10)" },
};



const MOCK_CAFES = [
  { id:"starbucks_myeongmul", name:"스타벅스 신촌명물거리점", totalSeats:100, walkMin:8,  naverUrl:"https://map.naver.com/p/entry/place/13570666", popularity:40, type:"카페 노마드",   lat:0, lng:0, popular_times:{} },
  { id:"starbucks_sinchon",   name:"스타벅스 신촌점",        totalSeats:120, walkMin:7,  naverUrl:"https://map.naver.com/p/entry/place/11689850", popularity:50, type:"카페 노마드",   lat:0, lng:0, popular_times:{} },
  { id:"twosome_sinchon_station", name:"투썸플레이스 신촌기차역점", totalSeats:50, walkMin:10, naverUrl:"https://map.naver.com/p/entry/place/18231613", popularity:65, type:"디저트 의존러", lat:0, lng:0, popular_times:{} },
  { id:"hollys_sinchon_station",  name:"할리스 신촌역점",    totalSeats:100, walkMin:9,  naverUrl:"https://map.naver.com/p/entry/place/1816577852", popularity:35, type:"장기 체류러",   lat:0, lng:0, popular_times:{} },
  { id:"coffeebean_sinchon",  name:"커피빈 신촌점",          totalSeats:120, walkMin:8,  naverUrl:"https://map.naver.com/p/entry/place/20561789", popularity:55, type:"사교 공부러",   lat:0, lng:0, popular_times:{} },
  { id:"fortyd",              name:"포티드",                  totalSeats:30,  walkMin:11, naverUrl:"https://map.naver.com/p/entry/place/1946991741", popularity:45, type:"감성 사냥꾼",  lat:0, lng:0, popular_times:{} },
  { id:"flickon_coffee",      name:"플릭온커피",              totalSeats:10,  walkMin:12, naverUrl:"https://map.naver.com/p/entry/place/1937057390", popularity:30, type:"감성 사냥꾼",  lat:0, lng:0, popular_times:{} },
  { id:"sulbing_sinchon",     name:"설빙 신촌점",             totalSeats:70,  walkMin:10, naverUrl:"https://map.naver.com/p/entry/place/35150556",  popularity:50, type:"디저트 의존러", lat:0, lng:0, popular_times:{} },
  { id:"chloris_sinchon",     name:"클로리스 신촌본점",       totalSeats:20,  walkMin:11, naverUrl:"https://map.naver.com/p/entry/place/13073862",  popularity:60, type:"감성 사냥꾼",  lat:0, lng:0, popular_times:{} },
  { id:"twosome_yonsei",      name:"투썸플레이스 신촌연세로점", totalSeats:120, walkMin:10, naverUrl:"https://map.naver.com/p/entry/place/1935823121", popularity:55, type:"디저트 의존러", lat:0, lng:0, popular_times:{} },
  { id:"starbucks_yonsei",    name:"스타벅스 연대점",          totalSeats:120, walkMin:9,  naverUrl:"https://map.naver.com/p/entry/place/11807591",  popularity:45, type:"카페 노마드",   lat:0, lng:0, popular_times:{} },
  { id:"hollys_sinchon",      name:"할리스 신촌점",            totalSeats:120, walkMin:9,  naverUrl:"https://map.naver.com/p/entry/place/11593558",  popularity:40, type:"장기 체류러",   lat:0, lng:0, popular_times:{} },
  { id:"letmealone",          name:"렛미얼론",                 totalSeats:120, walkMin:8,  naverUrl:"https://map.naver.com/p/entry/place/1618419604", popularity:38, type:"커피 본질러",  lat:0, lng:0, popular_times:{} },
  { id:"elpis_sinchon",       name:"앨피스카페 신촌점",        totalSeats:80,  walkMin:10, naverUrl:"https://map.naver.com/p/entry/place/38275926",  popularity:65, type:"장기 체류러",   lat:0, lng:0, popular_times:{} },
  { id:"cafe_ann",            name:"카페앤 신촌점",            totalSeats:80,  walkMin:12, naverUrl:"https://map.naver.com/p/entry/place/1975933458", popularity:25, type:"장기 체류러",   lat:0, lng:0, popular_times:{} },
  { id:"eagle_dabang",        name:"독수리다방",               totalSeats:80,  walkMin:9,  naverUrl:"https://map.naver.com/p/entry/place/31608233",  popularity:75, type:"사교 공부러",   lat:0, lng:0, popular_times:{} },
  { id:"mahogany_yonsei",     name:"마호가니 연세대점",        totalSeats:50,  walkMin:5,  naverUrl:"https://map.naver.com/p/entry/place/1432206951", popularity:30, type:"카페 노마드",   lat:0, lng:0, popular_times:{} },
];

// ── TypeBadge ──────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  if (!type) return null;
  const cfg = TYPE_CONFIG[type] || { bg:"rgba(0,0,0,0.07)", color:"#666" };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center",
      padding:"2px 8px", borderRadius:99,
      background:cfg.bg, color:cfg.color,
      fontSize:10, fontWeight:700, letterSpacing:"0.02em",
    }}>
      {type}
    </span>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:99,
      background:cfg.bg, color:cfg.color,
      fontSize:12, fontWeight:700, letterSpacing:"0.03em",
    }}>
      {status !== "영업종료" && (
        <span style={{
          width:7, height:7, borderRadius:"50%", background:cfg.color, display:"inline-block",
          boxShadow:status==="혼잡"?`0 0 6px ${cfg.color}`:"none",
          animation:status==="혼잡"?"pulse 1.4s infinite":"none",
        }}/>
      )}
      {status}
    </span>
  );
}

// ── ClosingBadge ───────────────────────────────────────────────────────────
function ClosingBadge({ minutes }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"3px 9px", borderRadius:99,
      background:"rgba(249,115,22,0.12)", color:"#f97316",
      fontSize:11, fontWeight:700,
    }}>
      🕐 {minutes}분 후 마감
    </span>
  );
}

// ── HourlyChart ────────────────────────────────────────────────────────────
function HourlyChart({ popularTimes }) {
  const dayKey = DAY_KEYS[new Date().getDay()];
  const raw = popularTimes?.[dayKey] || [];
  const now = new Date().getHours();

  // 데이터가 있는 시간대만 추출
  const firstIdx = raw.findIndex(v => v > 0);
  const lastIdx  = raw.length - 1 - [...raw].reverse().findIndex(v => v > 0);
  if (firstIdx < 0) return <div style={{fontSize:11,color:"#ccc",textAlign:"center",padding:"8px 0"}}>시간대 데이터 없음</div>;

  const hours = raw.slice(firstIdx, lastIdx+1);
  const startHour = firstIdx;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:50 }}>
        {hours.map((val, i) => {
          const h = startHour + i;
          const isNow = h === now;
          const barH = val > 0 ? Math.max(Math.round((val/100)*46), 3) : 2;
          const color = val===0 ? "#e5e7eb" : val<=40 ? "#22c55e" : val<=70 ? "#f59e0b" : "#ef4444";
          return (
            <div key={h} style={{
              flex:1, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"flex-end", height:"100%",
            }}>
              <div style={{
                width:"100%", height:barH,
                background:color, borderRadius:"2px 2px 0 0",
                opacity: isNow ? 1 : 0.55,
                outline: isNow ? `2px solid ${color}` : "none",
                outlineOffset: isNow ? 1 : 0,
              }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:2, marginTop:3 }}>
        {hours.map((_, i) => {
          const h = startHour + i;
          const isNow = h === now;
          const showLabel = h % 3 === 0 || isNow;
          return (
            <div key={h} style={{
              flex:1, textAlign:"center",
              fontSize:8,
              color: isNow ? "#1a1a1a" : "#c4c4c4",
              fontWeight: isNow ? 800 : 400,
            }}>
              {showLabel ? h : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MiniCafeCard (검색 결과 대안 카드) ─────────────────────────────────────
function MiniCafeCard({ cafe }) {
  const cfg = STATUS_CONFIG[cafe.status] || STATUS_CONFIG["보통"];
  return (
    <div style={{
      background:"#fff", borderRadius:12, padding:"12px 14px",
      border:"1.5px solid rgba(0,0,0,0.07)",
      boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {cafe.name}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
            <StatusBadge status={cafe.status}/>
            <span style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{cafe.available}석</span>
          </div>
        </div>
        <a href={getDirectionUrl(cafe)} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            padding:"6px 12px", borderRadius:8, background:"#1a1a1a",
            color:"#fff", fontSize:11, fontWeight:600, textDecoration:"none", flexShrink:0,
          }}>
          길찾기
        </a>
      </div>
    </div>
  );
}

// ── SearchModal ────────────────────────────────────────────────────────────
function SearchModal({ cafes, onEnterList, loading, onTrack }) {
  const [query, setQuery]             = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [result, setResult]           = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);

  const openCafes = cafes.filter(c => c.status !== "영업종료");

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    setSuggestions(cafes.filter(c => c.name.includes(query.trim())).slice(0, 5));
  }, [query, cafes]);

  const doSearch = (name) => {
    const q = (name !== undefined ? name : query).trim();
    if (!q) return;
    setSuggestions([]);
    if (name !== undefined) setQuery(name);

    const found = cafes.find(c => c.name.includes(q));
    if (!found) {
      onTrack?.("search_query", { query:q, result_type:"not_found" });
      setResult({ type:"not_found", query:q }); return;
    }
    if (found.status === "영업종료") {
      onTrack?.("search_query", { query:q, result_type:"closed", cafe_id:found.id });
      setResult({ type:"closed", cafe:found }); return;
    }
    if (found.status === "혼잡") {
      onTrack?.("search_query", { query:q, result_type:"congested", cafe_id:found.id });
      const alts = openCafes
        .filter(c => c.id !== found.id && c.status !== "혼잡")
        .sort((a,b) => a.popularity-b.popularity)
        .slice(0, 3);
      setResult({ type:"congested", cafe:found, alternatives:alts });
      return;
    }
    onTrack?.("search_query", { query:q, result_type:"available", cafe_id:found.id });
    setResult({ type:"available", cafe:found });
  };

  const handleKakaoSave = (cafe) => {
    const url = "https://cafe-mvp.netlify.app/?utm=kakao_save";
    navigator.clipboard?.writeText(url)
      .then(() => alert(`☕ ${cafe.name} 링크 복사됨!\n카톡 나와의 채팅에 붙여넣기하세요 📋`))
      .catch(() => alert("링크: " + url));
  };

  const resetSearch = () => {
    setResult(null);
    setQuery("");
    setSuggestions([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const primaryBtn = (extra={}) => ({
    width:"100%", padding:"13px", borderRadius:12,
    background:"#1a1a1a", color:"#fff",
    fontSize:14, fontWeight:700, border:"none", cursor:"pointer",
    fontFamily:"inherit", ...extra,
  });
  const ghostBtn = (extra={}) => ({
    width:"100%", padding:"10px", borderRadius:12,
    background:"transparent", color:"#aaa",
    fontSize:12, fontWeight:500, border:"none", cursor:"pointer",
    fontFamily:"inherit", ...extra,
  });

  return (
    <div
      onClick={onEnterList}
      style={{
        position:"fixed", inset:0, zIndex:200,
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"24px 20px",
        background:"rgba(0,0,0,0.55)",
        backdropFilter:"blur(10px)",
        WebkitBackdropFilter:"blur(10px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"100%", maxWidth:420,
          background:"#fff", borderRadius:24,
          padding:"32px 24px 28px",
          boxShadow:"0 24px 60px rgba(0,0,0,0.25)",
          animation:"modalEnter 0.25s ease",
          transformOrigin:"center center",
        }}
      >

        {/* 헤더 */}
        <div style={{ textAlign:"center", marginBottom:22 }}>
          <div style={{ fontSize:30, marginBottom:8 }}>☕</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#1a1a1a" }}>실패없는 카페 선택</div>
          <div style={{ fontSize:12, color:"#999", marginTop:5, lineHeight:1.5 }}>
            가려던 카페, 지금 자리 있는지 먼저 확인해보세요
          </div>
        </div>

        {/* ── 검색창 (결과 없을 때) ── */}
        {!result && (
          <div>
            <div style={{
              display:"flex",
              border:"2px solid #e5e7eb", borderRadius:14, overflow:"hidden",
              transition:"border-color 0.15s",
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor="#1a1a1a"}
              onBlurCapture={e  => e.currentTarget.style.borderColor="#e5e7eb"}
            >
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter") doSearch(); }}
                placeholder={loading ? "카페 정보 불러오는 중..." : "카페 이름을 입력하세요"}
                disabled={loading}
                style={{
                  flex:1, border:"none", outline:"none",
                  padding:"13px 16px", fontSize:15,
                  fontFamily:"'Pretendard',-apple-system,sans-serif",
                  background:"transparent",
                }}
              />
              <button
                onClick={() => doSearch()}
                disabled={loading || !query.trim()}
                style={{
                  padding:"0 18px",
                  background:query.trim() ? "#1a1a1a" : "#f3f4f6",
                  border:"none",
                  cursor:query.trim() ? "pointer" : "default",
                  color:query.trim() ? "#fff" : "#bbb",
                  fontSize:16, transition:"all 0.15s", fontFamily:"inherit",
                }}
              >
                🔍
              </button>
            </div>

            {/* 자동완성 — inline으로 렌더링 (잘림 방지) */}
            {suggestions.length > 0 && (
              <div style={{
                marginTop:6, borderRadius:12, overflow:"hidden",
                boxShadow:"0 4px 16px rgba(0,0,0,0.1)",
                border:"1px solid rgba(0,0,0,0.07)",
              }}>
                {suggestions.map((cafe, i) => (
                  <div
                    key={cafe.id}
                    onClick={() => doSearch(cafe.name)}
                    style={{
                      padding:"12px 16px", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
                      borderBottom: i < suggestions.length-1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                      background:"#fff", transition:"background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background="#f9f9f9"}
                    onMouseLeave={e => e.currentTarget.style.background="#fff"}
                  >
                    <span style={{ fontSize:13, fontWeight:600, color:"#1a1a1a",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
                      {cafe.name}
                    </span>
                    <StatusBadge status={cafe.status}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 결과: NOT FOUND ── */}
        {result?.type === "not_found" && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🤔</div>
            <div style={{ fontSize:15, fontWeight:700, color:"#1a1a1a", marginBottom:6 }}>
              "{result.query}"는 아직 추적하지 않아요
            </div>
            <div style={{ fontSize:12, color:"#999", marginBottom:22, lineHeight:1.6 }}>
              더 많은 카페를 추가할 예정이에요.<br/>지금 여유로운 카페를 먼저 확인해볼까요?
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={onEnterList} style={primaryBtn()}>지금 여유로운 카페 보기 →</button>
              <button onClick={resetSearch} style={ghostBtn()}>다시 검색하기</button>
            </div>
          </div>
        )}

        {/* ── 결과: CLOSED ── */}
        {result?.type === "closed" && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>😴</div>
            <div style={{ fontSize:15, fontWeight:700, color:"#1a1a1a", marginBottom:6 }}>
              {result.cafe.name},<br/>지금은 영업을 안 해요
            </div>
            <div style={{ fontSize:12, color:"#999", marginBottom:22, lineHeight:1.6 }}>
              오늘 영업이 끝났거나 정기 휴무예요.<br/>지금 열려있는 카페를 찾아볼게요.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={onEnterList} style={primaryBtn()}>지금 열려있는 여유 카페 보기 →</button>
              <button onClick={resetSearch} style={ghostBtn()}>다시 검색하기</button>
            </div>
          </div>
        )}

        {/* ── 결과: CONGESTED ── */}
        {result?.type === "congested" && (
          <div>
            <div style={{
              background:"rgba(239,68,68,0.06)", borderRadius:14, padding:"16px",
              marginBottom:16, textAlign:"center",
              border:"1.5px solid rgba(239,68,68,0.15)",
            }}>
              <div style={{ fontSize:22, marginBottom:6 }}>🚨</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#1a1a1a", marginBottom:5 }}>
                {result.cafe.name},<br/>지금 꽉 찼을 확률이 높아요!
              </div>
              <div style={{ fontSize:11, color:"#ef4444", fontWeight:600 }}>
                혼잡 · 여유석 {result.cafe.available}석 추정
              </div>
            </div>
            {result.alternatives.length > 0 && (
              <>
                <div style={{ fontSize:12, fontWeight:700, color:"#555", marginBottom:10 }}>
                  💡 대신 지금 바로 앉을 수 있는 카페예요
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                  {result.alternatives.map(cafe => <MiniCafeCard key={cafe.id} cafe={cafe}/>)}
                </div>
              </>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={onEnterList} style={primaryBtn()}>지금 다른 카페는 어떨까요? →</button>
              <button onClick={resetSearch} style={ghostBtn()}>다시 검색하기</button>
            </div>
          </div>
        )}

        {/* ── 결과: AVAILABLE ── */}
        {result?.type === "available" && (
          <div>
            <div style={{
              background:"rgba(34,197,94,0.06)", borderRadius:14, padding:"18px",
              marginBottom:18, textAlign:"center",
              border:"1.5px solid rgba(34,197,94,0.2)",
            }}>
              <div style={{ fontSize:22, marginBottom:6 }}>🟢</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#1a1a1a", marginBottom:5 }}>
                {result.cafe.name},<br/>자리가 넉넉해요!
              </div>
              <div style={{ fontSize:13, fontWeight:800, color:"#22c55e" }}>
                여유석 {result.cafe.available}석
              </div>
              <div style={{ fontSize:11, color:"#999", marginTop:3 }}>
                ({result.cafe.status} · 총 {result.cafe.totalSeats}석)
              </div>
            </div>
            <div style={{ fontSize:12, color:"#666", textAlign:"center", marginBottom:14, lineHeight:1.6 }}>
              다음에도 헛걸음 방지하려면<br/>링크를 카톡에 저장해두세요 👇
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button
                onClick={() => handleKakaoSave(result.cafe)}
                style={{
                  width:"100%", padding:"13px", borderRadius:12,
                  background:"#1a1a1a", color:"#fff",
                  fontSize:14, fontWeight:700, border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  fontFamily:"inherit",
                }}
              >
                <span>🔗</span> 링크 복사하기
              </button>
              <button onClick={onEnterList} style={{ ...ghostBtn(), color:"#555", fontSize:13, background:"rgba(0,0,0,0.04)" }}>
                서비스 더보기 →
              </button>
              <button onClick={resetSearch} style={ghostBtn()}>다시 검색하기</button>
            </div>
          </div>
        )}

        {/* ── 목록 바로 보기 (결과 없을 때) ── */}
        {!result && (
          <button
            onClick={onEnterList}
            style={{
              width:"100%", marginTop:14, padding:"12px",
              borderRadius:12, background:"transparent",
              border:"1.5px solid #e5e7eb",
              color:"#666", fontSize:13, fontWeight:600,
              cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background="#f9f9f9"}
            onMouseLeave={e => e.currentTarget.style.background="transparent"}
          >
            카페 목록 바로 보기 →
          </button>
        )}
      </div>
    </div>
  );
}

// ── CafeMap ────────────────────────────────────────────────────────────────
// visibleCafes: 현재 화면에 표시 중인 카페만 전달받아 핀 표시
function CafeMap({ visibleCafes, selectedId, onSelect }) {
  const mapEl     = useRef(null);
  const mapObj    = useRef(null);
  const markersRef = useRef([]);
  const infoRef   = useRef(null);

  useEffect(() => {
    if (!window.naver?.maps || !mapEl.current || mapObj.current) return;
    mapObj.current = new naver.maps.Map(mapEl.current, {
      center: new naver.maps.LatLng(37.5580, 126.9362),
      zoom:16, minZoom:15, maxZoom:18,
      zoomControl:true,
      zoomControlOptions:{ position:naver.maps.Position.RIGHT_CENTER, style:naver.maps.ZoomControlStyle.SMALL },
      mapTypeControl:false, logoControl:true,
      logoControlOptions:{ position:naver.maps.Position.BOTTOM_LEFT },
      scaleControl:false, mapDataControl:false,
    });
  }, []);

  useEffect(() => {
    const map = mapObj.current;
    if (!map || !window.naver) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (infoRef.current) { infoRef.current.close(); infoRef.current = null; }

    visibleCafes.filter(c => c.lat && c.lng).forEach(cafe => {
      const cfg = STATUS_CONFIG[cafe.status] || STATUS_CONFIG["보통"];
      const isSel = cafe.id === selectedId;
      const size  = isSel ? 44 : 34;

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(cafe.lat, cafe.lng),
        map,
        icon:{
          content:`<div style="
            width:${size}px;height:${size}px;
            background:${cfg.color};border:3px solid #fff;border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-weight:800;font-size:${isSel?14:12}px;
            box-shadow:0 2px 8px ${cfg.color}88,0 1px 3px rgba(0,0,0,0.2);
            cursor:pointer;
            ${isSel?`transform:scale(1.15);z-index:100;box-shadow:0 0 0 6px ${cfg.color}33,0 2px 8px ${cfg.color}88;`:""}
            font-family:'Pretendard',-apple-system,sans-serif;
          ">${cafe.available}</div>`,
          anchor: new naver.maps.Point(size/2, size/2),
        },
        zIndex: isSel ? 100 : 10,
      });

      naver.maps.Event.addListener(marker, "click", () => {
        onSelect(cafe.id);
        if (infoRef.current) infoRef.current.close();
        const iw = new naver.maps.InfoWindow({
          content:`<div style="
            padding:10px 14px;min-width:140px;
            font-family:'Pretendard',-apple-system,sans-serif;
            border-radius:12px;background:#fff;
            box-shadow:0 4px 16px rgba(0,0,0,0.15);
          ">
            <div style="font-weight:700;font-size:14px;color:#1a1a1a;margin-bottom:4px;">${cafe.name}</div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:11px;font-weight:600;color:${cfg.color};
                background:${cfg.bg};padding:2px 8px;border-radius:20px;">● ${cafe.status}</span>
              <span style="font-size:13px;font-weight:800;color:${cfg.color};">${cafe.available}</span>
              <span style="font-size:11px;color:#999;">/ ${cafe.totalSeats}석</span>
            </div>
          </div>`,
          borderWidth:0, backgroundColor:"transparent", disableAnchor:true,
          pixelOffset: new naver.maps.Point(0, -size/2-8),
        });
        iw.open(map, marker);
        infoRef.current = iw;
      });

      markersRef.current.push(marker);
    });
  }, [visibleCafes, selectedId, onSelect]);

  useEffect(() => {
    const map = mapObj.current;
    if (!map || !selectedId || !window.naver) return;
    const cafe = visibleCafes.find(c => c.id === selectedId);
    if (cafe?.lat && cafe?.lng) map.panTo(new naver.maps.LatLng(cafe.lat, cafe.lng));
  }, [selectedId, visibleCafes]);

  return (
    <div style={{ margin:"0 0 0", borderBottom:"1px solid rgba(0,0,0,0.06)", position:"relative" }}>
      <div ref={mapEl} style={{ width:"100%", height:260 }}/>
      <div style={{
        position:"absolute", bottom:12, left:12,
        background:"rgba(255,255,255,0.95)", borderRadius:10,
        padding:"6px 12px", display:"flex", gap:10,
        fontSize:10, fontWeight:600, color:"#57534e",
        backdropFilter:"blur(4px)",
        boxShadow:"0 1px 4px rgba(0,0,0,0.1)",
      }}>
        <span><span style={{color:"#22c55e"}}>●</span> 여유</span>
        <span><span style={{color:"#f59e0b"}}>●</span> 보통</span>
        <span><span style={{color:"#ef4444"}}>●</span> 혼잡</span>
      </div>
    </div>
  );
}

// ── CafeCard ───────────────────────────────────────────────────────────────
function CafeCard({ cafe, index, isCbtiPick, isSelected, cardRef, onCardClick }) {
  const cfg = STATUS_CONFIG[cafe.status];
  return (
    <div
      ref={cardRef}
      onClick={onCardClick}
      style={{
        background:"#fff", borderRadius:14,
        padding:"16px 18px",
        boxShadow: isSelected
          ? `0 0 0 3px ${cfg.color}30, 0 4px 16px rgba(0,0,0,0.1)`
          : "0 1px 8px rgba(0,0,0,0.06)",
        border:"1.5px solid",
        borderColor: isSelected ? cfg.color
          : isCbtiPick ? "rgba(99,102,241,0.3)"
          : cafe.isClosing ? "rgba(249,115,22,0.25)"
          : cafe.status==="혼잡" ? "rgba(239,68,68,0.18)"
          : "rgba(0,0,0,0.06)",
        animation:"fadeUp 0.4s ease both",
        animationDelay:`${index*0.04}s`,
        transition:"transform 0.18s ease, box-shadow 0.18s ease",
        cursor:"pointer",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 1px 8px rgba(0,0,0,0.06)"; }}
    >
      {/* 1행: 카페명 + 배지 + 길찾기 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
            <span style={{ fontSize:14, fontWeight:700, color:"#1a1a1a" }}>{cafe.name}</span>
            {isCbtiPick && (
              <span style={{ fontSize:9, fontWeight:700, color:"#6366f1",
                background:"rgba(99,102,241,0.1)", padding:"1px 6px", borderRadius:99, flexShrink:0 }}>
                추천
              </span>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:5, flexWrap:"wrap" }}>
            <StatusBadge status={cafe.status}/>
            {cafe.isClosing && <ClosingBadge minutes={cafe.closingMinutes}/>}
            {cafe.type && <TypeBadge type={cafe.type}/>}
          </div>
        </div>
        <a
          href={getDirectionUrl(cafe)}
          target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            padding:"6px 12px", borderRadius:8, background:"#1a1a1a",
            color:"#fff", fontSize:11, fontWeight:600, textDecoration:"none",
            flexShrink:0, marginTop:2,
          }}
          onMouseEnter={e => e.currentTarget.style.background="#333"}
          onMouseLeave={e => e.currentTarget.style.background="#1a1a1a"}
        >
          길찾기
        </a>
      </div>

      {/* 2행: 좌석 + 바 */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:12 }}>
        <div style={{ flexShrink:0 }}>
          <span style={{ fontSize:22, fontWeight:800, color:cfg.color }}>{cafe.available}</span>
          <span style={{ fontSize:11, color:"#999", marginLeft:3 }}>/ {cafe.totalSeats}석</span>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ height:6, borderRadius:99, background:"rgba(0,0,0,0.06)", overflow:"hidden" }}>
            <div style={{
              height:"100%", width:`${cafe.popularity}%`,
              background:cfg.color, borderRadius:99,
              transition:"width 0.8s cubic-bezier(.4,0,.2,1)",
            }}/>
          </div>
        </div>
        <span style={{ fontSize:11, color:cfg.color, fontWeight:600, flexShrink:0 }}>
          {Math.round((1-cafe.popularity/100)*100)}%
        </span>
      </div>

      {/* 3행: 상세보기 힌트 */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center", gap:4,
        marginTop:10, paddingTop:10,
        borderTop:"1px solid rgba(0,0,0,0.05)",
      }}>
        <span style={{ fontSize:11, color:"#c4c4c4", fontWeight:500 }}>
          상세보기 (시간대 혼잡도)
        </span>
        <span style={{ fontSize:10, color:"#d1d5db" }}>∨</span>
      </div>
    </div>
  );
}

// ── BottomSheet ────────────────────────────────────────────────────────────
function BottomSheet({ cafe, onClose, onTrack }) {
  const [showKakaoPrompt, setShowKakaoPrompt] = useState(false);
  const cfg = STATUS_CONFIG[cafe.status] || STATUS_CONFIG["보통"];
  const hours = getTodayHours(cafe.id);
  const hourStr = hours
    ? `${formatHour(hours.open)} ~ ${formatHour(hours.close)}`
    : "오늘 휴무";

  const handleDepart = () => {
    onTrack?.("direction_click", { cafe_id:cafe.id, cafe_status:cafe.status });
    const alreadyShown = sessionStorage.getItem("kakao_prompt_shown");
    if (!alreadyShown) {
      setShowKakaoPrompt(true);
    } else {
      window.open(getDirectionUrl(cafe), "_blank");
      onClose();
    }
  };

  const handleKakaoAndDepart = () => {
    sessionStorage.setItem("kakao_prompt_shown", "1");
    onTrack?.("share_click", { share_type:"kakao_depart", cafe_id:cafe.id });
    const url = "https://cafe-mvp.netlify.app/?utm=kakao_share";
    navigator.clipboard?.writeText(url).catch(() => {});
    window.open(getDirectionUrl(cafe), "_blank");
    onClose();
  };

  const handleJustDepart = () => {
    sessionStorage.setItem("kakao_prompt_shown", "1");
    window.open(getDirectionUrl(cafe), "_blank");
    onClose();
  };

  const hasPopularTimes = cafe.popular_times && Object.keys(cafe.popular_times).length > 0;

  return (
    <>
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:300,
        background:"rgba(0,0,0,0.4)", backdropFilter:"blur(2px)",
      }}/>
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, margin:"0 auto",
        width:"100%", maxWidth:480, zIndex:301,
        background:"#fff", borderRadius:"20px 20px 0 0",
        animation:"slideUp 0.25s ease-out",
        maxHeight:"80vh", overflowY:"auto",
      }}>
        {/* 핸들 */}
        <div style={{ padding:"12px 0 4px", display:"flex", justifyContent:"center" }}>
          <div style={{ width:36, height:4, borderRadius:2, background:"#d1d5db" }}/>
        </div>

        <div style={{ padding:"8px 20px 32px" }}>
          {/* 카페명 + 닫기 */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:12 }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#1a1a1a", flex:1, lineHeight:1.3 }}>
              {cafe.name}
            </div>
            <button onClick={onClose} style={{
              background:"rgba(0,0,0,0.06)", border:"none", borderRadius:99,
              width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", fontSize:13, color:"#888", flexShrink:0,
            }}>✕</button>
          </div>

          {/* 배지들 */}
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:16 }}>
            <StatusBadge status={cafe.status}/>
            {cafe.isClosing && <ClosingBadge minutes={cafe.closingMinutes}/>}
            {cafe.type && <TypeBadge type={cafe.type}/>}
          </div>

          {/* 좌석 현황 */}
          <div style={{
            background:cfg.bg, borderRadius:14, padding:"14px 16px", marginBottom:14,
            border:`1.5px solid ${cfg.color}22`,
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:12, color:"#666", fontWeight:600 }}>현재 좌석 현황</span>
              <span style={{ fontSize:11, color:"#aaa" }}>총 {cafe.totalSeats}석</span>
            </div>
            <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:10 }}>
              <span style={{ fontSize:30, fontWeight:800, color:cfg.color }}>{cafe.available}</span>
              <span style={{ fontSize:12, color:"#999" }}>석 여유 추정</span>
            </div>
            <div style={{ height:8, borderRadius:99, background:"rgba(0,0,0,0.06)", overflow:"hidden" }}>
              <div style={{
                height:"100%", width:`${cafe.popularity}%`,
                background:cfg.color, borderRadius:99,
                transition:"width 0.8s cubic-bezier(.4,0,.2,1)",
              }}/>
            </div>
          </div>

          {/* 영업시간 */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 0", borderBottom:"1px solid rgba(0,0,0,0.06)", marginBottom:16,
          }}>
            <span style={{ fontSize:12, color:"#888", fontWeight:600 }}>오늘 영업시간</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>{hourStr}</span>
          </div>

          {/* 시간대별 혼잡도 차트 */}
          {hasPopularTimes && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#555", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                시간대별 혼잡도
                <span style={{ fontSize:10, color:"#bbb", fontWeight:400 }}>현재 시간 강조</span>
              </div>
              <HourlyChart popularTimes={cafe.popular_times}/>
            </div>
          )}

          {/* 출발 버튼 영역 */}
          {!showKakaoPrompt ? (
            <button onClick={handleDepart} style={{
              width:"100%", padding:"15px", borderRadius:14,
              background:"#1a1a1a", color:"#fff",
              fontSize:15, fontWeight:700, border:"none", cursor:"pointer",
              fontFamily:"inherit",
            }}>
              이 카페로 출발하기 →
            </button>
          ) : (
            <div style={{
              background:"rgba(0,0,0,0.03)", borderRadius:14, padding:"18px",
              border:"1.5px solid rgba(0,0,0,0.07)",
            }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#1a1a1a", marginBottom:4, textAlign:"center" }}>
                다음에도 편하게 사용하려면?
              </div>
              <div style={{ fontSize:11, color:"#999", marginBottom:16, textAlign:"center" }}>
                카톡 저장하면 다음에 바로 열 수 있어요
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button onClick={handleKakaoAndDepart} style={{
                  padding:"13px", borderRadius:12, background:"#FEE500",
                  color:"#191919", fontSize:13, fontWeight:700, border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  fontFamily:"inherit",
                }}>
                  <span>🔗</span> 링크 복사하고 출발
                </button>
                <button onClick={handleJustDepart} style={{
                  padding:"11px", borderRadius:12, background:"transparent",
                  color:"#aaa", fontSize:12, fontWeight:500, border:"none", cursor:"pointer",
                  fontFamily:"inherit",
                }}>
                  그냥 출발
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── FeedbackSection ───────────────────────────────────────────────────────
function FeedbackSection({ onTrack }) {
  const [state, setState]   = useState("idle"); // idle | bad_input | done
  const [reason, setReason] = useState("");

  const submit = (type) => {
    onTrack("feedback_submit", { type, reason: type === "bad" ? reason.trim() : "" });
    setState("done");
  };

  if (state === "done") {
    return (
      <div style={{
        marginTop:16, padding:"16px", borderRadius:14,
        background:"rgba(34,197,94,0.06)", border:"1.5px solid rgba(34,197,94,0.15)",
        textAlign:"center",
      }}>
        <div style={{ fontSize:18, marginBottom:4 }}>🙏</div>
        <div style={{ fontSize:13, fontWeight:700, color:"#16a34a" }}>감사합니다!</div>
        <div style={{ fontSize:11, color:"#999", marginTop:2 }}>소중한 의견이 서비스 개선에 반영돼요</div>
      </div>
    );
  }

  return (
    <div style={{
      marginTop:16, padding:"16px 18px", borderRadius:14,
      background:"#fff", border:"1.5px solid rgba(0,0,0,0.07)",
    }}>
      <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a", marginBottom:12 }}>
        이 서비스 어떠셨나요?
      </div>

      {state === "idle" && (
        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={() => submit("good")}
            style={{
              flex:1, padding:"10px", borderRadius:10,
              background:"rgba(34,197,94,0.08)", border:"1.5px solid rgba(34,197,94,0.2)",
              color:"#16a34a", fontSize:13, fontWeight:700,
              cursor:"pointer", fontFamily:"inherit",
            }}
          >
            👍 좋아요
          </button>
          <button
            onClick={() => setState("bad_input")}
            style={{
              flex:1, padding:"10px", borderRadius:10,
              background:"rgba(239,68,68,0.06)", border:"1.5px solid rgba(239,68,68,0.15)",
              color:"#ef4444", fontSize:13, fontWeight:700,
              cursor:"pointer", fontFamily:"inherit",
            }}
          >
            😢 아쉬워요
          </button>
        </div>
      )}

      {state === "bad_input" && (
        <div>
          <div style={{ fontSize:12, color:"#666", marginBottom:8 }}>
            어떤 점이 아쉬우셨나요? (선택)
          </div>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="예) 실제 자리가 달랐어요 / 찾는 카페가 없었어요"
            rows={3}
            style={{
              width:"100%", padding:"10px 12px",
              borderRadius:10, border:"1.5px solid #e5e7eb",
              fontSize:13, fontFamily:"'Pretendard',-apple-system,sans-serif",
              resize:"none", outline:"none", color:"#1a1a1a",
              boxSizing:"border-box",
            }}
            onFocus={e => e.target.style.borderColor="#1a1a1a"}
            onBlur={e  => e.target.style.borderColor="#e5e7eb"}
          />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <button
              onClick={() => setState("idle")}
              style={{
                flex:1, padding:"10px", borderRadius:10,
                background:"rgba(0,0,0,0.04)", border:"none",
                color:"#999", fontSize:12, fontWeight:500,
                cursor:"pointer", fontFamily:"inherit",
              }}
            >
              취소
            </button>
            <button
              onClick={() => submit("bad")}
              style={{
                flex:2, padding:"10px", borderRadius:10,
                background:"#1a1a1a", border:"none",
                color:"#fff", fontSize:13, fontWeight:700,
                cursor:"pointer", fontFamily:"inherit",
              }}
            >
              제출하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SummaryBar ─────────────────────────────────────────────────────────────
function SummaryBar({ allOpenCafes }) {
  const counts = { 여유:0, 보통:0, 혼잡:0 };
  allOpenCafes.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });
  return (
    <div style={{ display:"flex", gap:10, marginBottom:20 }}>
      {Object.entries(counts).map(([status, count]) => {
        const cfg = STATUS_CONFIG[status];
        return (
          <div key={status} style={{
            flex:1, padding:"10px 14px", borderRadius:14,
            background:cfg.bg, border:`1.5px solid ${cfg.color}30`,
            textAlign:"center",
          }}>
            <div style={{ fontSize:22, fontWeight:800, color:cfg.color }}>{count}</div>
            <div style={{ fontSize:10, color:"#888", marginTop:1 }}>{status}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── CBTI 배너 (일반 리스트 중간 삽입) ──────────────────────────────────────
function CbtiBanner() {
  return (
    <div
      onClick={() => window.location.href = "https://cafe-mvp.netlify.app/cafe-quiz.html"}
      style={{
        padding:"14px 16px", borderRadius:14, cursor:"pointer",
        background:"linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))",
        border:"1.5px solid rgba(99,102,241,0.2)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        transition:"transform 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.transform="translateY(-1px)"}
      onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}
    >
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:"#6366f1" }}>
          🤔 나에게 딱 맞는 카페 성향은?
        </div>
        <div style={{ fontSize:11, color:"#888", marginTop:3 }}>
          CBTI 검사 30초 · 내 유형 카페만 모아보기
        </div>
      </div>
      <span style={{ fontSize:18, color:"#a5b4fc" }}>→</span>
    </div>
  );
}

// ── 메인 앱 ────────────────────────────────────────────────────────────────
export default function App() {
  const params    = new URLSearchParams(window.location.search);
  const cbtiType  = params.get("type") || null;
  const cbtiCafeIds = cbtiType ? (CBTI_CAFE_MAP[cbtiType] || []) : [];
  const isCbtiEntry = !!cbtiType;

  const [showSearchModal, setShowSearchModal] = useState(!isCbtiEntry);
  const [cafes,       setCafes]       = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading,     setLoading]     = useState(true);
  const [selectedId,  setSelectedId]  = useState(null); // 지도 핀 선택 + BottomSheet
  const [expanded,    setExpanded]    = useState(false);
  const cardRefs = useRef({});

  // ── 세션 트래킹 ──────────────────────────────────────────────────────────
  const sessionCtx = useRef(null);
  if (!sessionCtx.current) {
    sessionCtx.current = {
      session_id:  crypto.randomUUID(),
      source:      params.get("from") || (cbtiType ? "cbti" : "direct"),
      cbti_type:   cbtiType,
      utm:         params.get("utm") || null,
      referer:     document.referrer || null,
      device:      window.innerWidth <= 768 ? "mobile" : "desktop",
      landing_url: window.location.href,
    };
  }
  const track = useCallback((eventType, extra={}) => {
    logEvent(eventType, { ...sessionCtx.current, app_version:"v2", collection:"sessions_v2" }, extra);
  }, []);

  // ── Firebase 구독 ─────────────────────────────────────────────────────────
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
          popularity:        c.popularity ?? 0,
          type:              c.type ?? "",
          popular_times:     c.popular_times ?? {},
        }));
      setCafes(enriched);
      setLastUpdated(new Date());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (typeof window.Kakao !== "undefined" && !window.Kakao.isInitialized()) {
      window.Kakao.init("6064e1045ddfe7edf97edd266f75a283");
    }
  }, []);

  useEffect(() => { track("page_view"); }, [track]);

  // 선택된 카드로 스크롤
  useEffect(() => {
    if (selectedId && cardRefs.current[selectedId]) {
      cardRefs.current[selectedId].scrollIntoView({ behavior:"smooth", block:"nearest" });
    }
  }, [selectedId]);

  // ── 공유 핸들러 ───────────────────────────────────────────────────────────
  const handleShareGeneral = useCallback(() => {
    track("share_click", { share_type:"general" });
    const url = "https://cafe-mvp.netlify.app/?utm=general_share";
    if (navigator.share) {
      navigator.share({ title:"실패없는 카페 선택 ☕", url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => alert("링크가 복사되었습니다!"));
    }
  }, [track]);

  // ── 리스트 계산 ───────────────────────────────────────────────────────────
  const openCafes  = cafes.filter(c => c.status !== "영업종료");
  const sortedOpen = [...openCafes].sort((a,b) => a.popularity-b.popularity);

  let primaryList, secondaryList;
  if (cbtiType) {
    // CBTI 모드: 매핑된 카페 전체 / 나머지
    primaryList   = sortedOpen.filter(c =>  cbtiCafeIds.includes(c.id));
    secondaryList = sortedOpen.filter(c => !cbtiCafeIds.includes(c.id));
  } else {
    // 일반 모드: TOP 5 / 나머지
    primaryList   = sortedOpen.slice(0, 5);
    secondaryList = sortedOpen.slice(5);
  }

  // 더보기 여부에 따라 실제 표시 목록 결정
  const visibleList  = expanded ? [...primaryList, ...secondaryList] : primaryList;
  const selectedCafe = cafes.find(c => c.id === selectedId) || null;

  const timeStr = lastUpdated.toLocaleTimeString("ko-KR", { hour:"2-digit", minute:"2-digit" });
  const moreCount = secondaryList.length;

  if (loading) {
    return (
      <div style={{
        minHeight:"100vh", background:"#f5f4f0",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:12,
      }}>
        <div style={{ fontSize:32 }}>☕</div>
        <div style={{ fontSize:14, color:"#888" }}>카페 정보 불러오는 중...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Pretendard',-apple-system,sans-serif; background:#f5f4f0; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes modalEnter {
          from { opacity:0; transform:scale(0.97) translateY(6px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(1.3); }
        }
        @keyframes slideUp {
          from { transform:translateY(100%); }
          to   { transform:translateY(0); }
        }
        ::-webkit-scrollbar { width:0; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#f5f4f0" }}>

        {/* ── 헤더 ── */}
        <div style={{
          background:"#1a1a1a", padding:"20px 20px 0",
          position:"sticky", top:0, zIndex:100,
        }}>
          <div style={{ maxWidth:480, margin:"0 auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, color:"#aaa", letterSpacing:"0.1em", fontWeight:600 }}>
                  SINCHON · 연세대학교
                </div>
                <div style={{ fontSize:20, fontWeight:800, color:"#fff", marginTop:2 }}>
                  실패없는 카페 선택 ☕
                </div>
                <div style={{ fontSize:11, color:"#888", marginTop:8, paddingBottom:16 }}>
                  {timeStr} 기준 · 예측 데이터 (Popular Times 기반)
                </div>
              </div>
              <div style={{ display:"flex", gap:6, marginTop:4, alignItems:"center" }}>
                {/* 카페 검색 */}
                <button
                  onClick={() => { setShowSearchModal(true); track("search_reopen"); }}
                  style={{
                    padding:"7px 11px", borderRadius:8,
                    background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.18)",
                    color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer",
                    fontFamily:"inherit", transition:"background 0.15s", whiteSpace:"nowrap",
                    display:"flex", alignItems:"center", gap:4,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.22)"}
                  onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.12)"}
                >
                  🔍 카페 검색
                </button>
                {/* 공유하기 */}
                <button
                  onClick={handleShareGeneral}
                  style={{
                    padding:"7px 11px", borderRadius:8,
                    background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.18)",
                    color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer",
                    fontFamily:"inherit", transition:"background 0.15s", whiteSpace:"nowrap",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.22)"}
                  onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.12)"}
                >
                  공유하기
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ── 지도 (visibleList 기준 핀 표시) ── */}
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <CafeMap
            visibleCafes={visibleList}
            selectedId={selectedId}
            onSelect={id => {
              setSelectedId(id);
              track("map_marker_click", { cafe_id:id });
            }}
          />
        </div>

        {/* ── 본문 ── */}
        <div style={{ maxWidth:480, margin:"0 auto", padding:"20px 16px 40px" }}>

          {/* 요약 바 (전체 영업중 기준) */}
          
          {/* CBTI 진입 배너 */}
          {cbtiType && (
            <div style={{
              marginBottom:16, padding:"12px 16px", borderRadius:14,
              background:"linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.1))",
              border:"1.5px solid rgba(99,102,241,0.2)",
            }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#6366f1" }}>
                ☕ {cbtiType} 추천 카페
              </div>
              <div style={{ fontSize:11, color:"#888", marginTop:3 }}>
                내 유형에 맞는 카페를 여유로운 순으로 보여드려요
              </div>
            </div>
          )}

          {/* 카드 리스트 */}
          {visibleList.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"#aaa", fontSize:14 }}>
              해당 상태의 카페가 없어요
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {visibleList.map((cafe, i) => (
                <>
                  <CafeCard
                    key={cafe.id}
                    cafe={cafe}
                    index={i}
                    isCbtiPick={cbtiCafeIds.includes(cafe.id)}
                    isSelected={selectedId === cafe.id}
                    cardRef={el => { cardRefs.current[cafe.id] = el; }}
                    onCardClick={() => {
                      setSelectedId(cafe.id);
                      track("cafe_click", { cafe_id:cafe.id, cafe_status:cafe.status });
                    }}
                  />
                  {/* CBTI 배너: 일반 모드에서 2번째 카드 뒤 삽입 */}
                  {!cbtiType && i === 1 && <CbtiBanner key="cbti-banner"/>}
                  {/* CBTI 모드에서 primary→secondary 경계 구분선 */}
                  {cbtiType && expanded && i === primaryList.length-1 && secondaryList.length > 0 && (
                    <div key="divider" style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0" }}>
                      <div style={{ flex:1, height:1, background:"rgba(0,0,0,0.08)" }}/>
                      <span style={{ fontSize:11, color:"#bbb" }}>다른 유형의 카페</span>
                      <div style={{ flex:1, height:1, background:"rgba(0,0,0,0.08)" }}/>
                    </div>
                  )}
                </>
              ))}
            </div>
          )}

          {/* 더보기 / 접기 토글 */}
          {moreCount > 0 && (
            <button
              onClick={() => {
                setExpanded(v => !v);
                track("expand_click", { is_cbti:!!cbtiType, expanded:!expanded });
              }}
              style={{
                width:"100%", marginTop:16, padding:"13px",
                borderRadius:14, background:"#fff",
                border:"1.5px solid rgba(0,0,0,0.1)",
                color:"#555", fontSize:13, fontWeight:600,
                cursor:"pointer", fontFamily:"inherit",
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                transition:"all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background="#f9f9f9"}
              onMouseLeave={e => e.currentTarget.style.background="#fff"}
            >
              <span style={{ fontSize:16 }}>{expanded ? "⬆️" : "⬇️"}</span>
              {expanded
                ? "접기"
                : cbtiType
                  ? `다른 유형의 카페 보기 (${moreCount}곳)`
                  : `카페 더보기 (${moreCount}곳)`
              }
            </button>
          )}

          {/* 데이터 안내 */}
          <div style={{
            marginTop:28, padding:"14px 16px", borderRadius:12,
            background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize:11, color:"#999", lineHeight:1.6 }}>
              ⚠️ Google Maps Popular Times 기반 <strong>예측 데이터</strong>입니다.
              실제 좌석 상황과 다를 수 있으며, 1시간 주기로 업데이트됩니다.
            </div>
          </div>

          <FeedbackSection onTrack={track} />
        </div>
      </div>

      {/* ── SearchModal ── */}
      {showSearchModal && (
        <SearchModal
          cafes={cafes}
          loading={loading}
          onTrack={track}
          onEnterList={() => {
            setShowSearchModal(false);
            track("enter_list");
          }}
        />
      )}

      {/* ── BottomSheet ── */}
      {selectedCafe && (
        <BottomSheet
          cafe={selectedCafe}
          onClose={() => setSelectedId(null)}
          onTrack={track}
        />
      )}
    </>
  );
}