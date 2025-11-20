# 🧪 서버 테스트 가이드

## 1. Firebase Admin SDK 설정 확인

### Option A: JSON 파일 사용 (가장 간단) ⭐ 추천

1. Firebase Console에서 서비스 계정 키 JSON 다운로드
2. 파일을 `firebase/serviceAccountKey.json`에 저장
3. 완료! (`.env` 설정 불필요)

### Option B: .env 파일 사용

JSON 파일을 열어서 다음 내용을 `.env`에 복사:

```bash
FIREBASE_PROJECT_ID=presentparty-d687f
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n실제_키_내용\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@presentparty-d687f.iam.gserviceaccount.com
```

## 2. 서버 실행

```bash
npm run dev
```

### 성공 시 출력:
```
Firebase Admin SDK initialized successfully
Server is running on http://localhost:3000
Environment: development
```

### 실패 시 출력:
```
Firebase initialization error: ...
```
→ `firebase/serviceAccountKey.json` 파일이 있는지 확인
→ 또는 `.env` 파일의 설정 확인

## 3. 기능 테스트

### 테스트 1: 메인 페이지 접속
```
http://localhost:3000
```
✅ "Secret Santa Matcher" 화면이 나오면 성공

### 테스트 2: 호스트 회원가입
```
http://localhost:3000/host
```
1. "처음이신가요? 회원가입하기" 클릭
2. ID: `testhost`, PW: `test123` 입력
3. "회원가입" 버튼 클릭
4. ✅ "회원가입 성공!" 메시지가 나오면 성공

### 테스트 3: 호스트 로그인
1. ID: `testhost`, PW: `test123` 입력
2. "로그인" 버튼 클릭
3. ✅ 대시보드로 이동하면 성공

### 테스트 4: 모임 생성
대시보드에서:
1. 모임 제목: "테스트 모임" 입력
2. "모임 생성하기" 버튼 클릭
3. ✅ 모임이 목록에 표시되면 성공
4. **6자리 코드**를 메모하세요 (예: ABC123)

### 테스트 5: 참가자로 참가
1. 새 브라우저 탭 열기
2. `http://localhost:3000` 접속
3. "참가자로 입장하기" 클릭
4. 메모한 6자리 코드 입력
5. 이름: "참가자1" 입력
6. ✅ "참가 완료!" 메시지가 나오면 성공

### 테스트 6: 참가자 목록 확인
호스트 대시보드로 돌아가서:
1. 생성한 모임의 "상세 보기" 클릭
2. ✅ "참가자1"이 목록에 있으면 성공!

## 4. 문제 해결

### 문제: "Firebase initialization error"
**원인**: Admin SDK 설정 오류

**해결**:
```bash
# firebase 폴더에 serviceAccountKey.json이 있는지 확인
dir firebase
```

파일이 없다면:
1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. 다운로드한 JSON을 `firebase/serviceAccountKey.json`에 저장

### 문제: "존재하지 않는 호스트 ID입니다"
**원인**: 회원가입이 안 됨 (Firestore 연결 문제)

**해결**:
1. Firebase Console → Firestore Database
2. `hosts` 컬렉션이 생성되었는지 확인
3. 없다면 보안 규칙 확인

### 문제: "이미 사용 중인 이름입니다" (참가자 페이지)
**원인**: 같은 이름으로 이미 참가함

**해결**:
- 다른 이름 사용
- 또는 호스트 대시보드에서 모임 삭제 후 재생성

## 5. Firebase Console에서 데이터 확인

```
https://console.firebase.google.com/project/presentparty-d687f/firestore
```

다음 컬렉션이 생성되어야 합니다:
- `hosts`: 호스트 계정 정보
- `meetings`: 모임 정보
  - `participants`: 참가자 정보 (서브컬렉션)

## 6. 모든 테스트 통과 시 ✅

축하합니다! 기본 구조가 정상적으로 작동합니다.

다음 단계:
- [ ] Phase 2: 마니또 매칭 알고리즘 구현
- [ ] QR 코드 생성 기능
- [ ] 실시간 업데이트
