cafe-mvp/                 ← GitHub에 올라가는 프로젝트 전체
│
│  .gitignore             ← Git한테 "이 파일들은 올리지 마" 목록
│                            (비밀번호, API 키 같은 민감한 파일 보호)
│
│  requirements.txt       ← Python 패키지 목록
│                            (pip install -r requirements.txt 하면 자동 설치)
│
│  netlify.toml           ← Netlify한테 배포 방법 알려주는 설정
│                            ("frontend 폴더 빌드해서 올려라")
│
│  README.md              ← 프로젝트 설명서 (GitHub에서 첫 화면에 보임)
│  firebase_schema.md     ← Firestore 구조 설계 메모
│
├─.github/workflows/
│      collect.yml        ← GitHub Actions 자동화 설정
│                            "30분마다 Python 스크립트 실행해라"
│                            (별도 서버 없이 GitHub이 대신 실행해줌)
│
├─frontend/               ← React 웹앱 코드 전체
│  │
│  │  package.json        ← npm 패키지 목록 + 실행 명령어 정의
│  │                         (npm install 하면 여기 보고 설치함)
│  │
│  │  vite.config.js      ← Vite 빌드 도구 설정
│  │                         (React 코드를 브라우저가 읽을 수 있게 변환)
│  │
│  │  index.html          ← 앱의 HTML 껍데기 (내용은 React가 채움)
│  │
│  │  .env.example        ← 환경변수 템플릿
│  │                         (실제 API 키는 .env에 넣고 Git엔 안 올림)
│  │
│  └─src/                 ← 실제 React 소스 코드
│         main.jsx        ← 앱 시작점. "index.html의 root에 App 꽂아라"
│         App.jsx         ← 메인 UI (카드, 필터, 헤더 전부 여기)
│         firebase.js     ← Firebase 연결 설정 + 실시간 데이터 구독
│
└─scripts/
       collect_populartimes.py  ← 혼잡도 수집 Python 스크립트
                                   GitHub Actions가 30분마다 이걸 실행
                                   → Firebase에 데이터 저장