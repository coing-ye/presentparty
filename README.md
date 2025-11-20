# 🎁 Secret Santa Matcher - 마니또 매칭 웹 서비스

Firebase + Node.js 기반의 실시간 마니또 매칭 서비스입니다.

## 📋 프로젝트 개요

연말/송년회 시즌을 타겟으로 한 마니또 매칭 웹 서비스입니다. 호스트가 모임을 생성하고, 참가자들은 링크나 QR코드로 쉽게 참가할 수 있습니다.

## 🎯 구현된 기능 (Phase 1)

### ✅ 호스트 기능
- [x] 회원가입 및 로그인 (비밀번호 해싱)
- [x] 모임 생성/수정/삭제 (CRUD)
- [x] 모임별 고유 코드 생성 (6자리)
- [x] 참가자 목록 및 방명록 확인
- [x] 대시보드에서 모임 관리
- [x] 참가 링크 복사 기능

### ✅ 참가자 기능
- [x] 모임 코드로 즉시 참가
- [x] 이름 중복 체크
- [x] 실시간 참가자 목록 확인
- [x] 방명록 작성
- [x] 세션 기반 참가 정보 저장

### ✅ 기타
- [x] 반응형 웹 디자인
- [x] 에러 처리 및 사용자 피드백
- [x] 모던한 UI/UX

## 🚧 예정된 기능 (Phase 2)

- [ ] 마니또 자동 매칭 알고리즘
- [ ] QR 코드 생성 및 표시
- [ ] 호스트의 전체 매칭 현황 조회
- [ ] 참가자의 마니또 조회 (본인 담당만)
- [ ] 실시간 업데이트 (WebSocket/Firestore 리스너)

## 🛠️ 기술 스택

- **Backend**: Node.js, Express.js
- **Database**: Firebase Firestore
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: bcrypt (비밀번호 해싱)
- **API**: RESTful API

## 📂 프로젝트 구조

```
presentparty/
├── public/                 # 정적 파일
│   ├── host/              # 호스트 페이지
│   │   ├── login.html    # 로그인/회원가입
│   │   └── dashboard.html # 대시보드
│   ├── participant/       # 참가자 페이지
│   │   └── join.html     # 참가 페이지
│   ├── assets/           # CSS, JS
│   │   └── css/
│   │       └── style.css
│   └── index.html        # 메인 페이지
├── src/
│   ├── config/           # 설정 파일
│   │   └── firebase.js   # Firebase 초기화
│   ├── routes/           # API 라우트
│   │   ├── hostRoutes.js
│   │   ├── meetingRoutes.js
│   │   └── participantRoutes.js
│   └── services/         # 비즈니스 로직
│       ├── hostService.js
│       ├── meetingService.js
│       └── participantService.js
├── firebase/             # Firebase 관련 파일
│   └── README.md        # Firebase 설정 가이드
├── server.js            # Express 서버 진입점
├── package.json
└── .env                 # 환경 변수 (생성 필요)
```

## 🚀 설치 및 실행

### 1. 사전 요구사항

- Node.js (v16 이상)
- Firebase 프로젝트
- npm 또는 yarn

### 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Firestore Database 생성 (프로덕션 모드, asia-northeast3)
3. 서비스 계정 키 생성:
   - 프로젝트 설정 → 서비스 계정
   - "새 비공개 키 생성" 클릭
   - JSON 파일 다운로드

자세한 내용은 `firebase/README.md`를 참고하세요.

### 3. 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email@project.iam.gserviceaccount.com

# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
```

### 4. 의존성 설치

```bash
npm install
```

### 5. 서버 실행

개발 모드 (nodemon):
```bash
npm run dev
```

프로덕션 모드:
```bash
npm start
```

### 6. 브라우저에서 접속

```
http://localhost:3000
```

## 📊 API 엔드포인트

### 호스트 관련
- `POST /api/host/register` - 호스트 회원가입
- `POST /api/host/login` - 호스트 로그인
- `GET /api/host/:hostId/meetings` - 호스트의 모임 목록

### 모임 관련
- `POST /api/meetings` - 모임 생성
- `GET /api/meetings/code/:code` - 모임 조회 (코드)
- `GET /api/meetings/:meetingId` - 모임 조회 (ID)
- `PUT /api/meetings/:meetingId` - 모임 수정
- `DELETE /api/meetings/:meetingId` - 모임 삭제
- `GET /api/meetings/:meetingId/participants` - 참가자 목록

### 참가자 관련
- `POST /api/participants/check-name` - 이름 중복 체크
- `POST /api/participants` - 참가자 추가
- `GET /api/participants/meeting/:meetingId` - 참가자 목록
- `PUT /api/participants/:participantId/message` - 방명록 수정
- `GET /api/participants/manitto/:meetingId/:participantName` - 마니또 조회

## 🧪 테스트 방법

### 호스트 테스트
1. http://localhost:3000/host 접속
2. 회원가입 (예: ID: test, PW: test123)
3. 로그인 후 모임 생성
4. 생성된 모임의 코드 확인

### 참가자 테스트
1. 메인 페이지에서 "참가자로 입장하기" 클릭
2. 모임 코드 입력
3. 이름 입력 후 참가
4. 참가자 목록에서 자신의 이름 확인

## 🔒 보안 고려사항

- 비밀번호는 bcrypt로 해싱하여 저장
- Firebase Admin SDK는 서버 사이드에서만 사용
- 환경 변수로 민감한 정보 관리
- `.gitignore`에 `.env` 및 서비스 계정 키 파일 포함

## 📝 다음 단계 (Phase 2)

1. **마니또 매칭 알고리즘 구현**
   - Fisher-Yates 셔플 알고리즘
   - 상호 매칭 방지 로직
   - 홀수 인원 처리

2. **QR 코드 생성**
   - qrcode 라이브러리 활용
   - 호스트 대시보드에서 QR 코드 표시

3. **실시간 업데이트**
   - Firestore 실시간 리스너 추가
   - 참가자 목록 자동 새로고침

4. **UI/UX 개선**
   - 로딩 애니메이션
   - 더 나은 에러 처리
   - 모바일 최적화

## 🐛 알려진 이슈

- [ ] QR 코드 생성 기능 미구현 (Phase 2 예정)
- [ ] 실시간 업데이트는 수동 새로고침 필요

## 📄 라이선스

ISC

## 👨‍💻 개발자

개발 문의 및 피드백 환영합니다!
