// Firebase Web SDK (클라이언트 사이드용)
// 실시간 업데이트를 위한 Firestore 클라이언트

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBEpUo7Yx0H1QO8sGp2xKjGcx4WQ0RLBNg",
  authDomain: "presentparty-d687f.firebaseapp.com",
  projectId: "presentparty-d687f",
  storageBucket: "presentparty-d687f.firebasestorage.app",
  messagingSenderId: "746123973186",
  appId: "1:746123973186:web:25ad732912c118164913db"
};

// Note: 이 파일은 향후 Phase 2에서 실시간 업데이트 기능 구현 시 사용됩니다
// 현재는 REST API를 통해 데이터를 가져옵니다

// Firebase Web SDK를 사용하려면 HTML에서 다음을 추가해야 합니다:
// <script type="module">
//   import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
//   import { getFirestore, collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
//
//   const app = initializeApp(firebaseConfig);
//   const db = getFirestore(app);
//
//   // 실시간 리스너 예제
//   onSnapshot(collection(db, 'meetings'), (snapshot) => {
//     snapshot.docChanges().forEach((change) => {
//       console.log('Document changed:', change.doc.data());
//     });
//   });
// </script>
