import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";

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
