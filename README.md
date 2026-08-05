# ☕ 실패없는 카페 선택

> 신촌 주변 카페의 현재 혼잡도를 확인하고, 자리가 있는 카페를 미리 찾아주는 서비스

**SW·AI 비즈니스 응용설계 | 이득모**

> ## 📌 프로젝트 상태
>
> 한 학기 수업 과제로 MVP를 제작하고 **기말 발표에서 성과 분석까지 마친 뒤 개발을 중단했습니다.**
> 다만 서버 운영 비용이 들지 않는 구조(GitHub Actions + Firestore 무료 한도)라
> **서비스와 시간별 자동 갱신은 계속 살아 있습니다.**
>
> 성과 분석은 아래 [가설 검정](#가설-검정-xyz) 참고.

## 배포 URL

| 서비스 | URL |
|---|---|
| 메인 서비스 | https://cafe-seat-mvp.vercel.app/ |
| CBTI 퀴즈 (카공 빌런 유형 테스트) | https://cafe-seat-mvp.vercel.app/cafe-quiz.html |

> 이미 배포되어 있으므로 위 링크에서 바로 확인 가능합니다.

---

## 프로젝트 구조

```
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # 메인 앱 (카페 리스트, 지도, 검색, 바텀시트)
│   │   ├── firebase.js      # Firebase 연동 (실시간 구독, 세션 로깅)
│   │   └── main.jsx         # React 엔트리포인트
│   ├── public/
│   │   ├── cafe-quiz.html   # CBTI 퀴즈 (standalone HTML)
│   │   ├── og-image.png     # 메인 OG 이미지
│   │   └── og-cbti.png      # CBTI OG 이미지
│   ├── index.html           # HTML 템플릿 (Naver Maps 로드)
│   ├── package.json
│   ├── vite.config.js
│   └── .env                 # Firebase 환경변수 (gitignore 대상)
├── scripts/
│   ├── seed_cafes.py        # 카페 기본 정보 최초 등록 (1회성)
│   └── seed_popular_times.py # 혼잡도 업데이트 (GitHub Actions에서 매시간 실행)
├── .github/workflows/
│   └── collect.yml          # GitHub Actions 크론 설정 (KST 07:00~00:30, 1시간 주기)
├── firebase_credentials.json # 서비스 계정 키 (gitignore 대상)
├── firebase_schema.md       # Firestore 컬렉션 구조 정의
├── requirements.txt         # Python 의존성
└── README.md
```

---

## 기술 스택

| 구성 요소 | 기술 | 역할 |
|---|---|---|
| Frontend | React + Vite | 카페 카드 UI, 검색 모달, 바텀시트 상세보기 |
| Database | Firebase Firestore | 카페 정보, 혼잡도, 세션 로그 실시간 저장 |
| 자동화 | GitHub Actions | 1시간 주기 크론으로 혼잡도 자동 업데이트 |
| 데이터 | Google Maps Popular Times | 요일·시간대별 혼잡도 패턴 (수동 수집) |
| 지도 | 네이버맵 API | 혼잡도 색상 핀으로 카페 위치 시각화 |
| 배포 | Vercel | GitHub push → 자동 빌드·배포 (CI/CD) |

---

## 로컬 실행 방법

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 환경변수 설정

`frontend/.env` 파일을 생성하고 아래 값을 입력합니다.

```
VITE_FIREBASE_API_KEY=<Firebase 콘솔 → 프로젝트 설정 → 내 앱에서 확인>
VITE_FIREBASE_AUTH_DOMAIN=<같은 위치>
VITE_FIREBASE_PROJECT_ID=<같은 위치>
VITE_FIREBASE_STORAGE_BUCKET=<같은 위치>
VITE_FIREBASE_MESSAGING_SENDER_ID=<같은 위치>
VITE_FIREBASE_APP_ID=<같은 위치>
```

> Firebase Web API Key는 클라이언트 사이드 식별용이며, 보안은 Firestore Security Rules로 강제됩니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:5173`에서 확인 가능합니다.

---

## 데이터 파이프라인

### 두 데이터의 결합

사전 수집한 **좌석 데이터**와 **혼잡도 데이터**를 결합해 현재 가용 좌석 수를 추정한다.

| 구분 | 데이터 | 수집 방식 |
|---|---|---|
| 정적 | 카페별 총 좌석 수 | 신촌 주변 **17개 카페를 직접 현장 조사**해 Firebase에 등록 |
| 동적 | 요일·시간대별 혼잡도 (0~100%) | Google Maps Popular Times를 DevTools 콘솔에서 수동 수집 |

### 혼잡도 수집 흐름

```
Google Maps (수동 수집)
  → DevTools Console에서 Popular Times 데이터 추출
  → Firebase cafes 컬렉션의 popular_times 필드에 저장

GitHub Actions (자동, 매 1시간)
  → seed_popular_times.py 실행
  → cafes 컬렉션에서 popular_times 읽기
  → 현재 요일·시간에 해당하는 혼잡도 계산
  → occupancy 컬렉션에 업데이트

React 앱 (실시간)
  → Firestore onSnapshot으로 cafes + occupancy 구독
  → 혼잡도 기반 여유/보통/혼잡 상태 표시
```

### 가용 좌석 추정 로직

```
혼잡도 지수 (0~100) → 점유율 = 혼잡도 / 100
가용 좌석 ≈ 총 좌석 수 × (1 - 점유율)

0~40%  → 🟢 여유
40~70% → 🟡 보통
70~100% → 🔴 혼잡
```

### 이 방식의 한계 — 예측값이지 실시간 관측이 아니다

Google Maps Popular Times는 실시간 센서가 아니라 **구글 사용자들의 과거 방문 패턴을
통계적으로 집계한 예측값**이다. 입출구 센서나 POS 연동이 이상적이지만 MVP 단계에서는
현실적 제약이 있어, 통계 기반 예측을 활용하되 **서비스 안에서 예측 기반임을 명시**해
신뢰도를 보완하는 쪽을 택했다.

---

## 성과 분석

기말 발표에서 수행한 가설 검정이다. 세션 로그는 Firestore에서 추출해 Google Sheets로 공개했다.

### 가설 (XyZ)

> 서비스에 접속한 연세대 학생 중 **30%** 는 특정 카페를 선택하여 자리 여부를 확인할 것이다.

### 가설 검정 (XyZ)

**Exact Binomial Test**

| 항목 | 값 |
|---|---|
| H₀ | p ≥ 0.30 (30% 이상이 카페를 선택해 자리를 확인한다) |
| H₁ | p < 0.30 |
| 표본 | n = 82 세션 (admin 제외) |
| 관측 | 카드 클릭 세션 k = 21 |
| 관측 비율 | p̂ = **25.6%** |
| 검정 통계 | P(X ≤ 21 \| n=82, p=0.30) = **0.2298** |
| 유의수준 | α = 0.05 |
| 결론 | p-value(0.2298) > α(0.05) → **H₀를 기각할 수 없다** |

실측 25.6%는 30%에 수치적으로 미달하지만, 이 표본 크기에서 그 차이는 통계적으로
유의하지 않아 가설은 기각되지 않았다.

**미달 원인 해석** — 검색 모달 자동완성에 이미 혼잡도 상태 뱃지가 표시되어,
카드를 클릭하지 않고도 정보를 얻는 사용자가 존재한다. 즉 "카드 클릭"이 "자리 확인"의
완전한 대리 지표가 아니다.

> ⚠️ 저장소에 커밋된 `sessions.json`은 **중간 시점 부분 추출본**(65세션)이라
> 위 최종 수치(82세션)와 다르다. 최종 검정은 Firestore 전체 추출본 기준이다.

---

## 분석 트래킹

### Firestore 컬렉션

| 컬렉션 | 용도 |
|---|---|
| `cafes` | 카페 기본 정보 (name, total_seats, lat, lng, popular_times 등) |
| `occupancy` | 시간대별 혼잡도 (popularity, status, updated_at) |
| `sessions` / `sessions_v2` | 메인 서비스 세션 로그 |
| `cbti_sessions` | CBTI 퀴즈 세션 로그 |

### 세션 기반 추적 항목

세션 단위로 아래 행동을 `arrayUnion`으로 누적 기록합니다.

- `cafe_clicks` — 카페 카드 클릭 (상세 혼잡도 확인)
- `direction_clicks` — 길찾기 클릭 (실제 방문 의도)
- `map_clicks` — 지도 핀 클릭
- `filter_clicks` — 혼잡도 필터 사용

채널 구분은 UTM 파라미터(`?utm=everytime/kakaotalk/admin`)로 처리합니다.

---

## 주의사항

- `seed_cafes.py`는 **최초 1회만 실행**하는 초기화 스크립트입니다. 이후 카페 정보 수정은 Firebase Console에서 직접 수행합니다.
- `firebase_credentials.json`은 절대 Git에 커밋하지 않습니다. GitHub Actions에서는 base64 인코딩된 `FIREBASE_CREDENTIALS` Secret을 사용합니다.
- 새 카페 추가 시 `lat`, `lng` 필드를 반드시 포함해야 합니다. 없으면 지도에 핀이 표시되지 않습니다.
