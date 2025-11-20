# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: secret-santa-matcher)
4. Google Analytics 설정 (선택사항)

## 2. Firestore Database 생성

1. Firebase Console에서 "Firestore Database" 선택
2. "데이터베이스 만들기" 클릭
3. 프로덕션 모드 시작
4. 위치 선택 (asia-northeast3 - 서울 권장)

## 3. 서비스 계정 키 생성

### 방법 1: 환경 변수 사용 (권장)
1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드
4. `.env` 파일에 다음 정보 입력:
   ```
   FIREBASE_PROJECT_ID=프로젝트ID
   FIREBASE_PRIVATE_KEY="비공개키"
   FIREBASE_CLIENT_EMAIL=서비스계정이메일
   ```

### 방법 2: 서비스 계정 키 파일 사용
1. 다운로드한 JSON 파일을 `firebase/serviceAccountKey.json`으로 저장
2. **주의**: 이 파일은 절대 Git에 커밋하지 마세요!

## 4. Firestore 보안 규칙 설정

Firebase Console → Firestore Database → 규칙에서 다음 규칙 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // hosts 컬렉션: 읽기/쓰기 모두 허용 (서버에서만 접근)
    match /hosts/{hostId} {
      allow read, write: if false;
    }

    // meetings 컬렉션: 읽기는 허용, 쓰기는 제한
    match /meetings/{meetingId} {
      allow read: if true;
      allow write: if false;

      // participants 서브컬렉션
      match /participants/{participantId} {
        allow read: if true;
        allow create: if true;
        allow update, delete: if false;
      }

      // manittoMappings 서브컬렉션 (민감한 데이터)
      match /manittoMappings/{mappingId} {
        allow read, write: if false;
      }
    }
  }
}
```

## 5. Firebase Hosting 설정 (배포 시)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

## 주의사항

- `serviceAccountKey.json` 파일은 절대 공개하지 마세요
- `.gitignore`에 포함되어 있는지 확인하세요
- 프로덕션 환경에서는 환경 변수 사용을 권장합니다
