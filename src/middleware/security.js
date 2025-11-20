const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');

/**
 * 기본 보안 헤더 설정 (Helmet)
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/**
 * 전역 요청 제한 (Rate Limiting)
 * - 모든 IP에 대해 15분당 최대 100개 요청
 * - DDoS 및 무차별 대입 공격 방지
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 100개 요청
  message: {
    success: false,
    message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 인증 관련 엔드포인트 제한 (더 엄격)
 * - 15분당 최대 5회 시도
 * - 무차별 대입 공격 방지
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // IP당 최대 5회 시도
  message: {
    success: false,
    message: '로그인 시도 횟수가 초과되었습니다. 15분 후 다시 시도해주세요.',
  },
  skipSuccessfulRequests: true, // 성공한 요청은 카운트하지 않음
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 생성 작업 제한 (모임, 참가자 등)
 * - 15분당 최대 10회 생성
 */
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10, // IP당 최대 10회 생성
  message: {
    success: false,
    message: '생성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API 조회 제한
 * - 1분당 최대 30회 조회
 */
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 30, // IP당 최대 30회 조회
  message: {
    success: false,
    message: '조회 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 속도 제한 (Speed Limiter)
 * - 과도한 요청 시 응답 속도를 점진적으로 늦춤
 * - 1분에 10회 이상 요청 시 지연 시작
 */
const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1분
  delayAfter: 10, // 10회 요청 후부터 지연 시작
  delayMs: (hits) => hits * 100, // 요청마다 100ms씩 지연 증가
  maxDelayMs: 3000, // 최대 3초 지연
});

/**
 * 매칭 실행 제한 (중요 작업)
 * - 5분당 최대 3회 매칭 실행
 */
const matchingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5분
  max: 3, // IP당 최대 3회 매칭
  message: {
    success: false,
    message: '매칭 실행 요청이 너무 많습니다. 5분 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 삭제 작업 제한
 * - 5분당 최대 5회 삭제
 */
const deleteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5분
  max: 5, // IP당 최대 5회 삭제
  message: {
    success: false,
    message: '삭제 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  securityHeaders,
  globalLimiter,
  authLimiter,
  createLimiter,
  readLimiter,
  speedLimiter,
  matchingLimiter,
  deleteLimiter,
};
