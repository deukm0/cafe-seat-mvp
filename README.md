# 실패없는 카페 선택 — MVP

신촌 주변 카페의 실시간 혼잡도를 제공하는 연세대 학생용 서비스

---

## 📁 프로젝트 구조

```
cafe-mvp/
├── .github/workflows/
│   └── collect.yml          # GitHub Actions 크론 잡 (30분 주기)
├── scripts/
│   └── collect_populartimes.py  # 혼잡도 수집 스크립트
├── docs/
│   └── firebase_schema.md   # Firestore 스키마 설계
├── requirements.txt          # Python 패키지
└── README.md
```

---

## 🚀 시작하기

### 1. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com) → 새 프로젝트 생성
2. Firestore Database 활성화 (프로덕션 모드)
3. 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 (JSON 다운로드)

### 2. 카페 데이터 등록 (Phase 1 현장 조사 후)

현장 조사 완료 후 Firestore `cafes` 컬렉션에 수동 등록:

```json
{
  "name": "할리스 신촌점",
  "address": "서울 서대문구 신촌로 25",
  "total_seats": 60,
  "place_id": "ChIJ...",
  "lat": 37.5551,
  "lng": 126.9368
}
```

Google Place ID 확인 방법:
- Google Maps에서 카페 검색 → URL에서 `place/ChIJ...` 부분 추출
- 또는 [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder) 활용

### 3. 로컬 실행

```bash
pip install -r requirements.txt

# 서비스 계정 JSON을 프로젝트 루트에 위치
cp ~/Downloads/firebase-credentials.json ./firebase_credentials.json

python scripts/collect_populartimes.py
```

### 4. GitHub Actions 설정

Repository → Settings → Secrets and variables → Actions에 추가:

| Secret 이름 | 값 |
|-------------|-----|
| `FIREBASE_CREDENTIALS` | 서비스 계정 JSON을 base64 인코딩한 값 |
| `GOOGLE_MAPS_API_KEY` | Google Maps API 키 |

base64 인코딩:
```bash
base64 -i firebase_credentials.json | tr -d '\n'
```

---

## ⚠️ 주의사항

- `populartimes`는 비공식 라이브러리로, Google Maps ToS 그레이존
- MVP 검증 단계에서만 사용하며 상업화 시 공식 API로 전환 예정
- `firebase_credentials.json`은 절대 Git에 커밋하지 말 것 (`.gitignore`에 추가)
