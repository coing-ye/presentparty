const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Firebase 자동 초기화 (firebase.js에서 처리)
require('./src/config/firebase');

const hostRoutes = require('./src/routes/hostRoutes');
const meetingRoutes = require('./src/routes/meetingRoutes');
const participantRoutes = require('./src/routes/participantRoutes');
const manittoRoutes = require('./src/routes/manittoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// API 라우트
app.use('/api/host', hostRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/manitto', manittoRoutes);

// 루트 경로
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 호스트 페이지
app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'host', 'login.html'));
});

// 호스트 대시보드
app.get('/host/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'host', 'dashboard.html'));
});

// 참가자 페이지
app.get('/join/:meetingCode', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'participant', 'join.html'));
});

// 404 에러 핸들링
app.use((req, res) => {
  res.status(404).send('페이지를 찾을 수 없습니다.');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
