import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";

// ────────────────────────────────────────────────────────────
// Firebase 콘솔 → 프로젝트 설정 → 내 앱 → SDK 설정에서 복사
// .env 파일에 넣고 절대 Git에 커밋하지 말 것
// ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ────────────────────────────────────────────────────────────
// 실시간 카페 데이터 구독
// cafes(정적) + occupancy(동적)를 merge해서 콜백으로 전달
// ────────────────────────────────────────────────────────────
export function subscribeCafes(onData) {
  // 1) 카페 기본 정보 (정적 — 한 번만 필요하지만 편의상 snapshot 사용)
  const cafesRef = collection(db, "cafes");
  const occupancyRef = collection(db, "occupancy");

  let cafesMap = {};
  let occupancyMap = {};

  function merge() {
    const merged = Object.keys(cafesMap).map((id) => ({
      id,
      ...cafesMap[id],
      ...(occupancyMap[id] || {}),
    }));
    onData(merged);
  }

  const unsubCafes = onSnapshot(cafesRef, (snap) => {
    cafesMap = {};
    snap.forEach((doc) => {
      cafesMap[doc.id] = doc.data();
    });
    merge();
  });

  const unsubOccupancy = onSnapshot(occupancyRef, (snap) => {
    occupancyMap = {};
    snap.forEach((doc) => {
      occupancyMap[doc.id] = doc.data();
    });
    merge();
  });

  // 구독 해제 함수 반환
  return () => {
    unsubCafes();
    unsubOccupancy();
  };
}

// ────────────────────────────────────────────────────────────
// 세션 기반 이벤트 트래킹
// ────────────────────────────────────────────────────────────

// 세션 문서 생성 (접속 시 1회)
export function createSession(sessionId, context) {
  try {
    setDoc(doc(db, "sessions", sessionId), {
      ...context,
      cafe_clicks: [],
      direction_clicks: [],
      filter_clicks: [],
      map_clicks: [],
      shared: false,
      created_at: serverTimestamp(),
    });
  } catch (e) {
    console.warn("createSession failed:", e);
  }
}

// 세션 문서 업데이트 (행동 누적)
export function updateSession(sessionId, updates) {
  try {
    updateDoc(doc(db, "sessions", sessionId), updates);
  } catch (e) {
    console.warn("updateSession failed:", e);
  }
}

// ────────────────────────────────────────────────────────────
// 피드백 저장
// ────────────────────────────────────────────────────────────
export function saveFeedback(feedbackData) {
  try {
    const feedbackId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setDoc(doc(db, "feedback", feedbackId), {
      ...feedbackData,
      created_at: serverTimestamp(),
    });
  } catch (e) {
    console.warn("saveFeedback failed:", e);
  }
}

// firebase.js 맨 아래, saveFeedback 뒤에 추가

export function logEvent(eventType, sessionCtx, extra = {}) {
  if (!sessionCtx?.session_id) return;
  try {
    const sid = sessionCtx.session_id;
    const col = sessionCtx.collection || "sessions";
    const payload = { event: eventType, timestamp: new Date().toISOString(), ...extra };

    // 이벤트 타입별로 세션 문서에 누적
    const fieldMap = {
      cafe_click:      "cafe_clicks",
      direction_click: "direction_clicks",
      filter_click:    "filter_clicks",
      map_marker_click:"map_clicks",
      share_click:     "share_clicks",
      feedback_submit: "feedback_events",
      search_query:    "search_queries",
      search_reopen:   "interactions",
      expand_click:    "interactions",
      enter_list:      "interactions",
    };

    const field = fieldMap[eventType];
    if (field) {
      updateDoc(doc(db, col, sid), {
        [field]: arrayUnion(payload),
      });
    } else if (eventType === "page_view") {
      // 세션 문서 생성
      setDoc(doc(db, col, sid), {
        ...sessionCtx,
        created_at: serverTimestamp(),
        cafe_clicks: [],
        direction_clicks: [],
        filter_clicks: [],
        map_clicks: [],
        share_clicks: [],
        feedback_events: [],
        search_queries: [],
        interactions: [],
      }, { merge: true });
    }
  } catch (e) {
    console.warn("logEvent failed:", e);
  }
}