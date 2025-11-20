# 🔥 Firebase 설정 가이드

## 중요: Firebase Admin SDK vs Web SDK

이 프로젝트는 두 가지 Firebase SDK를 사용합니다:

### 1. Firebase Admin SDK (서버 사이드)
- **위치**: `src/config/firebase.js`
- **용도**: Node.js 서버에서 Firestore 데이터베이스 접근
- **권한**: 전체 관리자 권한 (읽기/쓰기 모두 가능)
- **인증**: 서비스 계정 키 (비공개 키)

### 2. Firebase Web SDK (클라이언트 사이드)
- **위치**: `public/assets/js/firebase-client.js`
- **용도**: 브라우저에서 실시간 업데이트 (Phase 2)
- **권한**: Firestore 보안 규칙에 따름
- **인증**: API 키 (공개 가능)

---

## 📝 Firebase Admin SDK 설정 (서버용)

### 1단계: Firebase Console에서 서비스 계정 키 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택: **presentparty-d687f**
3. 좌측 메뉴에서 **프로젝트 설정** (톱니바퀴 아이콘) 클릭
4. **서비스 계정** 탭 클릭
5. **새 비공개 키 생성** 버튼 클릭
6. JSON 파일 다운로드 (예: `presentparty-d687f-firebase-adminsdk-xxxxx.json`)

### 2단계: .env 파일 수정

다운로드한 JSON 파일을 열어서 다음 정보를 복사:

```json
{
  "type": "service_account",
  "project_id": "presentparty-d687f",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@presentparty-d687f.iam.gserviceaccount.com",
  ...
}
```

`.env` 파일에 다음과 같이 입력:

```bash
FIREBASE_PROJECT_ID=presentparty-d687f
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n실제_키_내용\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@presentparty-d687f.iam.gserviceaccount.com
```

**주의사항:**
- `FIREBASE_PRIVATE_KEY`는 반드시 **큰따옴표**로 감싸야 합니다
- `\n` (줄바꿈 문자)을 그대로 유지해야 합니다
- 비공개 키는 절대 Git에 커밋하지 마세요!

### 3단계 (대안): 서비스 계정 키 파일 직접 사용

`.env` 설정이 복잡하다면, JSON 파일을 직접 사용할 수 있습니다:

1. 다운로드한 JSON 파일을 `firebase/serviceAccountKey.json`으로 저장
2. `.env` 파일에서 Firebase 관련 항목을 비워두기
3. 서버가 자동으로 JSON 파일을 읽습니다

---

## 🗄️ Firestore 데이터베이스 설정

### 1단계: Firestore Database 생성

1. Firebase Console → **Firestore Database**
2. **데이터베이스 만들기** 클릭
3. **프로덕션 모드**로 시작 선택
4. 위치: **asia-northeast3 (서울)** 선택
5. **사용 설정** 클릭

### 2단계: 보안 규칙 설정

Firestore Database → **규칙** 탭에서 다음 규칙 적용:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // hosts 컬렉션: 서버에서만 접근 (Admin SDK)
    match /hosts/{hostId} {
      allow read, write: if false;
    }

    // meetings 컬렉션: 읽기는 허용, 쓰기는 서버만
    match /meetings/{meetingId} {
      allow read: if true;
      allow write: if false;

      // participants 서브컬렉션
      match /participants/{participantId} {
        allow read: if true;
        allow create: if true;  // 참가자 추가는 허용
        allow update, delete: if false;
      }

      // manittoMappings 서브컬렉션 (민감한 데이터)
      match /manittoMappings/{mappingId} {
        allow read, write: if false;  // 서버에서만 접근
      }
    }
  }
}
```

**규칙 설명:**
- 호스트 정보는 서버에서만 접근 가능
- 모임 정보는 누구나 읽을 수 있지만, 수정은 서버만 가능
- 참가자는 자신을 추가할 수 있음
- 마니또 매칭 결과는 서버를 통해서만 접근

---

## ✅ 설정 확인

### 1. .env 파일 확인

```bash
# 필수 항목이 모두 채워졌는지 확인
cat .env
```

### 2. 서버 실행 테스트

```bash
npm run dev
```

다음 메시지가 표시되어야 합니다:
```
Firebase Admin SDK initialized successfully
Server is running on http://localhost:3000
```

### 3. Firestore 연결 테스트

브라우저에서:
1. `http://localhost:3000/host` 접속
2. 회원가입 시도
3. 에러 없이 완료되면 성공!

Firebase Console → Firestore Database에서 `hosts` 컬렉션이 생성되었는지 확인

---

## 🔧 문제 해결

### 오류: "Firebase initialization error"

**원인**: `.env` 파일의 설정이 잘못됨

**해결**:
1. FIREBASE_PRIVATE_KEY가 큰따옴표로 감싸져 있는지 확인
2. 비공개 키에 `-----BEGIN PRIVATE KEY-----`와 `-----END PRIVATE KEY-----`가 포함되어 있는지 확인
3. 또는 JSON 파일을 `firebase/serviceAccountKey.json`에 저장하고 .env의 Firebase 설정 제거

### 오류: "Permission denied"

**원인**: Firestore 보안 규칙 문제

**해결**:
1. Firestore Database → 규칙에서 위의 보안 규칙 적용
2. 규칙 게시 버튼 클릭

### 오류: "CORS error" (브라우저)

**원인**: 클라이언트에서 Firestore 직접 접근 시도

**해결**:
- 현재는 REST API를 통해서만 접근하도록 구현됨
- 실시간 업데이트는 Phase 2에서 구현 예정

---

## 📚 참고 자료

- [Firebase Admin SDK 문서](https://firebase.google.com/docs/admin/setup)
- [Firestore 보안 규칙](https://firebase.google.com/docs/firestore/security/get-started)
- [Node.js에서 Firebase 사용하기](https://firebase.google.com/docs/firestore/quickstart)

---

## 🔒 보안 주의사항

1. **.env 파일은 절대 Git에 커밋하지 마세요**
   - `.gitignore`에 포함되어 있는지 확인

2. **서비스 계정 키는 비밀로 유지하세요**
   - 공개 저장소에 업로드 금지
   - 타인과 공유 금지

3. **프로덕션 환경에서는 환경 변수 사용**
   - Heroku, Vercel 등에서는 대시보드에서 환경 변수 설정

4. **Firebase Web SDK API 키는 공개 가능**
   - `public/assets/js/firebase-client.js`의 apiKey는 공개되어도 안전
   - Firestore 보안 규칙으로 접근 제어됨
