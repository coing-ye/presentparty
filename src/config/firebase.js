// Firebase Admin SDK (서버 사이드용)
const admin = require('firebase-admin');
require('dotenv').config();

// Firebase Admin SDK 초기화 (자동 실행)
try {
  // 환경 변수를 사용한 초기화 (추천)
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin SDK initialized with environment variables');
  }
  // 서비스 계정 키 파일을 사용한 초기화 (대안)
  else {
    const serviceAccount = require('../../firebase/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK initialized with service account key');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.error('Please check your Firebase configuration.');
}

// Firestore 데이터베이스 인스턴스
const db = admin.firestore();

module.exports = {
  admin,
  db,
};