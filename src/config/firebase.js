// Firebase Admin SDK (서버 사이드용)
const admin = require('firebase-admin');
require('dotenv').config();

// Firebase Admin SDK 초기화 (자동 실행)
try {
  // Base64로 인코딩된 서비스 계정 사용 (프로덕션 - 추천)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const serviceAccountJson = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      'base64'
    ).toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK initialized with Base64 service account');
  }
  // 개별 환경 변수를 사용한 초기화 (대안)
  else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin SDK initialized with environment variables');
  }
  // 서비스 계정 키 파일을 사용한 초기화 (로컬 개발)
  else {
    const serviceAccount = require('../../firebase/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK initialized with service account key file');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.error('Please check your Firebase configuration.');
  process.exit(1);
}

// Firestore 데이터베이스 인스턴스
const db = admin.firestore();

module.exports = {
  admin,
  db,
};