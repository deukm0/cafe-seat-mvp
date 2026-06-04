import { useState, useEffect, useCallback, useRef } from "react";
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

// ── CafeMap (네이버 지도) ─────────────────────────────────────────────────
function CafeMap({ cafes, selectedId, onSelect, filter }) {
  const mapEl = useRef(null);
  const mapObj = useRef(null);
  const markersRef = useRef([]);
  const infoRef = useRef(null);

  // 지도 초기화 (1회)
  useEffect(() => {
    if (!window.naver || !window.naver.maps || !mapEl.current) return;
    if (mapObj.current) return; // 이미 생성됨

    const map = new naver.maps.Map(mapEl.current, {
      center: new naver.maps.LatLng(37.5580, 126.9362),
      zoom: 16,
      minZoom: 15,
      maxZoom: 18,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.RIGHT_CENTER,
        style: naver.maps.ZoomControlStyle.SMALL,
      },
      mapTypeControl: false,
      logoControl: true,
      logoControlOptions: { position: naver.maps.Position.BOTTOM_LEFT },
      scaleControl: false,
      mapDataControl: false,
    });

    mapObj.current = map;
  }, []);

  // 마커 업데이트
  useEffect(() => {
    const map = mapObj.current;
    if (!map || !window.naver) return;

    // 기존 마커 제거
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (infoRef.current) { infoRef.current.close(); infoRef.current = null; }

    const visible = cafes.filter(c => {
      if (!c.lat || !c.lng) return false;
      if (c.status === "영업종료") return false;
      if (filter !== "전체" && c.status !== filter) return false;
      return true;
    });

    visible.forEach(cafe => {
      const cfg = STATUS_CONFIG[cafe.status] || STATUS_CONFIG["보통"];
      const isSelected = cafe.id === selectedId;
      const size = isSelected ? 44 : 34;

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(cafe.lat, cafe.lng),
        map,
        icon: {
          content: `
            <div style="
              position:relative;
              width:${size}px; height:${size}px;
              background:${cfg.color};
              border:3px solid #fff;
              border-radius:50%;
              display:flex; align-items:center; justify-content:center;
              color:#fff; font-weight:800; font-size:${isSelected ? 14 : 12}px;
              box-shadow:0 2px 8px ${cfg.color}88, 0 1px 3px rgba(0,0,0,0.2);
              cursor:pointer;
              transition: all 0.2s;
              ${isSelected ? `transform:scale(1.15); z-index:100; box-shadow:0 0 0 6px ${cfg.color}33, 0 2px 8px ${cfg.color}88;` : ""}
              font-family:'Pretendard',-apple-system,sans-serif;
            ">${cafe.available}</div>
          `,
          anchor: new naver.maps.Point(size / 2, size / 2),
        },
        zIndex: isSelected ? 100 : 10,
      });

      naver.maps.Event.addListener(marker, "click", () => {
        onSelect(cafe.id);
        // 인포윈도우 표시
        if (infoRef.current) infoRef.current.close();
        const iw = new naver.maps.InfoWindow({
          content: `
            <div style="
              padding:10px 14px; min-width:140px;
              font-family:'Pretendard',-apple-system,sans-serif;
              border-radius:12px; background:#fff;
              box-shadow:0 4px 16px rgba(0,0,0,0.15);
              border:none;
            ">
              <div style="font-weight:700; font-size:14px; color:#1a1a1a; margin-bottom:4px;">
                ${cafe.name}
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="
                  font-size:11px; font-weight:600; color:${cfg.color};
                  background:${cfg.bg}; padding:2px 8px; border-radius:20px;
                ">● ${cafe.status}</span>
                <span style="font-size:13px; font-weight:800; color:${cfg.color};">
                  ${cafe.available}
                </span>
                <span style="font-size:11px; color:#999;">/ ${cafe.totalSeats}석</span>
              </div>
            </div>
          `,
          borderWidth: 0,
          backgroundColor: "transparent",
          disableAnchor: true,
          pixelOffset: new naver.maps.Point(0, -size / 2 - 8),
        });
        iw.open(map, marker);
        infoRef.current = iw;
      });

      markersRef.current.push(marker);
    });

    // 영업종료 카페는 회색 작은 마커로
    cafes.filter(c => c.lat && c.lng && c.status === "영업종료" && filter === "전체").forEach(cafe => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(cafe.lat, cafe.lng),
        map,
        icon: {
          content: `
            <div style="
              width:20px; height:20px;
              background:#d1d5db;
              border:2px solid #fff;
              border-radius:50%;
              opacity:0.5;
              box-shadow:0 1px 2px rgba(0,0,0,0.1);
            "></div>
          `,
          anchor: new naver.maps.Point(10, 10),
        },
        zIndex: 1,
      });
      markersRef.current.push(marker);
    });
  }, [cafes, selectedId, filter, onSelect]);

  // 선택된 카페로 지도 이동
  useEffect(() => {
    const map = mapObj.current;
    if (!map || !selectedId || !window.naver) return;
    const cafe = cafes.find(c => c.id === selectedId);
    if (cafe && cafe.lat && cafe.lng) {
      map.panTo(new naver.maps.LatLng(cafe.lat, cafe.lng));
    }
  }, [selectedId, cafes]);

  return (
    <div style={{
      margin: "0 0 0", borderBottom: "1px solid rgba(0,0,0,0.06)",
      position: "relative",
    }}>
      <div ref={mapEl} style={{ width: "100%", height: 260 }} />
      {/* 범례 */}
      <div style={{
        position: "absolute", bottom: 12, left: 12,
        background: "rgba(255,255,255,0.95)", borderRadius: 10,
        padding: "6px 12px", display: "flex", gap: 10,
        fontSize: 10, fontWeight: 600, color: "#57534e",
        backdropFilter: "blur(4px)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
      }}>
        <span><span style={{ color: "#22c55e" }}>●</span> 여유</span>
        <span><span style={{ color: "#f59e0b" }}>●</span> 보통</span>
        <span><span style={{ color: "#ef4444" }}>●</span> 혼잡</span>
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
function CafeCard({ cafe, index, isCbtiPick, isMapSelected, cardRef, onCardClick }) {
  const isClosed  = cafe.status === "영업종료";
  const isClosing = cafe.isClosing;
  const cfg = STATUS_CONFIG[cafe.status];

  return (
    <div
      ref={cardRef}
      onClick={onCardClick}
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: isClosed ? "14px 18px" : "16px 18px",
        boxShadow: isMapSelected
          ? `0 0 0 3px ${cfg.color}30, 0 4px 16px rgba(0,0,0,0.1)`
          : "0 1px 8px rgba(0,0,0,0.06)",
        border: "1.5px solid",
        borderColor: isMapSelected
          ? cfg.color
          : isCbtiPick
            ? "rgba(99,102,241,0.3)"
            : isClosing
              ? "rgba(249,115,22,0.25)"
              : !isClosed && cafe.status === "혼잡"
                ? "rgba(239,68,68,0.18)"
                : "rgba(0,0,0,0.06)",
        opacity: isClosed ? 0.5 : 1,
        animation: `fadeUp 0.4s ease both`,
        animationDelay: `${index * 0.04}s`,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        cursor: isClosed ? "default" : "pointer",
      }}
      onMouseEnter={e => {
        if (isClosed) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.06)";
      }}
    >
      {/* 1행: 카페명 + 상태 + 길찾기 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              fontSize: 14, fontWeight: 700,
              color: isClosed ? "#aaa" : "#1a1a1a",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {cafe.name}
            </span>
            {isCbtiPick && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: "#6366f1",
                background: "rgba(99,102,241,0.1)", padding: "1px 6px",
                borderRadius: 99, flexShrink: 0,
              }}>추천</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 10 }}>
          <StatusBadge status={cafe.status} />
          {isClosing && <ClosingBadge minutes={cafe.closingMinutes} />}
          <a
            href={getDirectionUrl(cafe)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "5px 12px", borderRadius: 8,
              background: isClosed ? "transparent" : "#1a1a1a",
              border: isClosed ? "1px solid #ddd" : "none",
              color: isClosed ? "#bbb" : "#fff",
              fontSize: 11, fontWeight: 600, textDecoration: "none",
              transition: "background 0.15s", whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { if (!isClosed) e.currentTarget.style.background = "#333"; }}
            onMouseLeave={e => { if (!isClosed) e.currentTarget.style.background = "#1a1a1a"; }}
          >
            길찾기
          </a>
        </div>
      </div>

      {/* 2행: 좌석 + 점유율 바 (영업중일 때만) */}
      {!isClosed && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
          <div style={{ flexShrink: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: cfg.color }}>
              {cafe.available}
            </span>
            <span style={{ fontSize: 11, color: "#999", marginLeft: 3 }}>
              / {cafe.totalSeats}석
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ height: 6, borderRadius: 99, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${cafe.popularity}%`,
                background: cfg.color, borderRadius: 99,
                transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
              }} />
            </div>
          </div>
          <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600, flexShrink: 0 }}>
            {Math.round((1 - cafe.popularity / 100) * 100)}%
          </span>
        </div>
      )}
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
  const [showShare,   setShowShare]   = useState(false);
  const [selectedCafeId, setSelectedCafeId] = useState(null);
  const cardRefs = useRef({});

  // 카카오톡 공유
  const handleKakaoShare = useCallback(() => {
    const url = "https://cafe-seat-mpv.netlify.app";
    const openCount = cafes.filter(c => c.status !== "영업종료");
    const yeoyu = openCount.filter(c => c.status === "여유").length;
    const botong = openCount.filter(c => c.status === "보통").length;
    const honjab = openCount.filter(c => c.status === "혼잡").length;
    const desc = `지금 여유 ${yeoyu}곳 · 보통 ${botong}곳 · 혼잡 ${honjab}곳`;

    if (typeof window.Kakao !== "undefined" && window.Kakao.isInitialized()) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: "feed",
          content: {
            title: "실패없는 카페 선택 ☕",
            description: `신촌 카페 ${desc}`,
            imageUrl: "https://cafe-seat-mpv.netlify.app/og-image.png",
            link: { mobileWebUrl: url, webUrl: url },
          },
          buttons: [{ title: "지금 확인하기", link: { mobileWebUrl: url, webUrl: url } }],
        });
        setShowShare(false);
        return;
      } catch (e) { console.log("Kakao share failed", e); }
    }
    // fallback: 네이티브 공유 → 클립보드
    const text = `실패없는 카페 선택 ☕ 신촌 카페 ${desc}`;
    if (navigator.share) {
      navigator.share({ title: "실패없는 카페 선택", text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} 👉 ${url}`).then(() => alert("링크가 복사되었습니다!"));
    }
    setShowShare(false);
  }, [cafes]);

  const handleLinkCopy = useCallback(() => {
    navigator.clipboard.writeText("https://cafe-seat-mpv.netlify.app")
      .then(() => alert("링크가 복사되었습니다!"));
    setShowShare(false);
  }, []);

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
        }));
      setCafes(enriched);
      setLastUpdated(new Date());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 카카오 SDK 초기화
  useEffect(() => {
    if (typeof window.Kakao !== "undefined" && !window.Kakao.isInitialized()) {
      window.Kakao.init("6064e1045ddfe7edf97edd266f75a283");
    }
  }, []);

  // 지도에서 선택 시 카드로 스크롤
  useEffect(() => {
    if (selectedCafeId && cardRefs.current[selectedCafeId]) {
      cardRefs.current[selectedCafeId].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedCafeId]);

  // CBTI 추천 타입 (URL ?type=감성 사냥꾼 등)
  const [cbtiType] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("type") || null;
  });
  const cbtiCafeIds = cbtiType ? (CBTI_CAFE_MAP[cbtiType] || []) : [];

  const openCafes   = cafes.filter(c => c.status !== "영업종료");
  const closedCafes = cafes.filter(c => c.status === "영업종료");

  const filteredOpen = filter === "전체"
    ? openCafes
    : openCafes.filter(c => c.status === filter);

  // 여유로운 순 정렬 (popularity 낮은 순), CBTI 추천 카페는 최상단
  const sortByAvailability = arr => [...arr].sort((a, b) => {
    // CBTI 추천 카페 우선
    if (cbtiCafeIds.length > 0) {
      const aMatch = cbtiCafeIds.includes(a.id) ? 0 : 1;
      const bMatch = cbtiCafeIds.includes(b.id) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    }
    // 여유로운 순 (popularity 낮은 순)
    return a.popularity - b.popularity;
  });
  const sortedOpen   = sortByAvailability(filteredOpen);
  const sortedClosed = filter === "전체" ? [...closedCafes].sort((a, b) => a.name.localeCompare(b.name, "ko")) : [];
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
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "#666", letterSpacing: "0.1em", fontWeight: 600 }}>
                  SINCHON · 연세대학교
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 2 }}>
                  실패없는 카페 선택 ☕
                </div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 8, paddingBottom: 12 }}>
                  {timeStr} 기준 · 예측 데이터 (Popular Times 기반)
                </div>
              </div>
              <button
                onClick={() => setShowShare(true)}
                style={{
                  background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10, width: 36, height: 36, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, color: "#fff", marginTop: 2,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                title="공유하기"
              >
                ↗
              </button>
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

        {/* 지도 */}
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <CafeMap
            cafes={cafes}
            selectedId={selectedCafeId}
            onSelect={setSelectedCafeId}
            filter={filter}
          />
        </div>

        {/* 본문 */}
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 40px" }}>

          {filter === "전체" && (
            <SummaryBar cafes={cafes} activeFilter={filter} onFilter={setFilter} />
          )}

          {cbtiType && (
            <div style={{
              marginBottom: 16, padding: "12px 16px", borderRadius: 14,
              background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))",
              border: "1.5px solid rgba(99,102,241,0.2)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#6366f1" }}>
                ☕ {cbtiType} 추천 카페
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
                CBTI 결과에 맞는 카페가 상단에 표시됩니다
              </div>
            </div>
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
                {sortedOpen.map((cafe, i) => <CafeCard key={cafe.id} cafe={cafe} index={i} isCbtiPick={cbtiCafeIds.includes(cafe.id)} isMapSelected={selectedCafeId === cafe.id} cardRef={el => { cardRefs.current[cafe.id] = el; }} onCardClick={() => setSelectedCafeId(selectedCafeId === cafe.id ? null : cafe.id)} />)}
              </div>

              {sortedClosed.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 14px" }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
                    <span style={{ fontSize: 11, color: "#bbb" }}>영업종료</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {sortedClosed.map((cafe, i) => <CafeCard key={cafe.id} cafe={cafe} index={sortedOpen.length + i} isCbtiPick={false} isMapSelected={false} cardRef={el => { cardRefs.current[cafe.id] = el; }} onCardClick={() => {}} />)}
                  </div>
                </>
              )}
            </>
          )}

          {/* 필터 탭 (여유/보통/혼잡) */}
          {filter !== "전체" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {displayList.map((cafe, i) => <CafeCard key={cafe.id} cafe={cafe} index={i} isCbtiPick={cbtiCafeIds.includes(cafe.id)} isMapSelected={selectedCafeId === cafe.id} cardRef={el => { cardRefs.current[cafe.id] = el; }} onCardClick={() => setSelectedCafeId(selectedCafeId === cafe.id ? null : cafe.id)} />)}
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

      {/* 공유 팝업 */}
      {showShare && (
        <div
          onClick={() => setShowShare(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480, background: "#fff",
              borderRadius: "20px 20px 0 0", padding: "20px 24px 32px",
              animation: "slideUp 0.25s ease-out",
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#d1d5db", margin: "0 auto 16px" }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 4 }}>
              공유하기
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
              신촌 카페 좌석 현황을 친구에게 공유하세요
            </div>
            <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
              {[
                { name: "카카오톡", icon: "💬", bg: "#FEE500", action: handleKakaoShare },
                { name: "링크 복사", icon: "🔗", bg: "#e5e7eb", action: handleLinkCopy },
              ].map(opt => (
                <button key={opt.name} onClick={opt.action} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16, background: opt.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}>{opt.icon}</div>
                  <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{opt.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}