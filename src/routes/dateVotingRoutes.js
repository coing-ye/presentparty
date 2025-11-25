const express = require('express');
const router = express.Router();
const {
  setupDateVoting,
  getDateVotingInfo,
  submitParticipantVote,
  getParticipantVote,
  getVotingResults,
} = require('../services/dateVotingService');
const { body, param, validationResult } = require('express-validator');
const { isHost } = require('../middleware/auth');
const {
  createLimiter,
  readLimiter,
} = require('../middleware/security');

/**
 * 검증 결과 확인 미들웨어
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '입력값이 올바르지 않습니다.',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * POST /api/date-voting/:meetingId/setup
 * 날짜 투표 설정 (호스트 전용)
 */
router.post(
  '/:meetingId/setup',
  createLimiter,
  [
    param('meetingId').notEmpty().withMessage('모임 ID가 필요합니다.'),
    body('hostId').notEmpty().withMessage('호스트 ID가 필요합니다.'),
    body('startDate')
      .isISO8601()
      .withMessage('올바른 시작 날짜를 입력해주세요.'),
    body('endDate')
      .isISO8601()
      .withMessage('올바른 종료 날짜를 입력해주세요.'),
    body('hostVote').optional().isObject(),
    validate,
  ],
  isHost,
  async (req, res) => {
    try {
      const { meetingId } = req.params;
      const { hostId, startDate, endDate, hostVote } = req.body;

      const result = await setupDateVoting(meetingId, hostId, {
        startDate,
        endDate,
        hostVote,
      });

      res.json(result);
    } catch (error) {
      console.error('Error in POST /api/date-voting/:meetingId/setup:', error);
      res.status(500).json({
        success: false,
        message: error.message || '날짜 투표 설정 중 오류가 발생했습니다.',
      });
    }
  }
);

/**
 * GET /api/date-voting/:meetingId
 * 날짜 투표 정보 조회
 */
router.get(
  '/:meetingId',
  readLimiter,
  [param('meetingId').notEmpty().withMessage('모임 ID가 필요합니다.'), validate],
  async (req, res) => {
    try {
      const { meetingId } = req.params;
      const result = await getDateVotingInfo(meetingId);
      res.json(result);
    } catch (error) {
      console.error('Error in GET /api/date-voting/:meetingId:', error);
      res.status(500).json({
        success: false,
        message: error.message || '날짜 투표 정보 조회 중 오류가 발생했습니다.',
      });
    }
  }
);

/**
 * POST /api/date-voting/:meetingId/vote
 * 참가자 투표
 */
router.post(
  '/:meetingId/vote',
  createLimiter,
  [
    param('meetingId').notEmpty().withMessage('모임 ID가 필요합니다.'),
    body('participantName')
      .trim()
      .notEmpty()
      .withMessage('참가자 이름이 필요합니다.'),
    body('impossible').optional().isArray(),
    body('notPreferred').optional().isArray(),
    body('preferred').optional().isArray(),
    validate,
  ],
  async (req, res) => {
    try {
      const { meetingId } = req.params;
      const { participantName, impossible, notPreferred, preferred } = req.body;

      const result = await submitParticipantVote(meetingId, participantName, {
        impossible,
        notPreferred,
        preferred,
      });

      res.json(result);
    } catch (error) {
      console.error('Error in POST /api/date-voting/:meetingId/vote:', error);
      res.status(500).json({
        success: false,
        message: error.message || '투표 중 오류가 발생했습니다.',
      });
    }
  }
);

/**
 * GET /api/date-voting/:meetingId/vote/:participantName
 * 참가자의 투표 조회
 */
router.get(
  '/:meetingId/vote/:participantName',
  readLimiter,
  [
    param('meetingId').notEmpty().withMessage('모임 ID가 필요합니다.'),
    param('participantName')
      .trim()
      .notEmpty()
      .withMessage('참가자 이름이 필요합니다.'),
    validate,
  ],
  async (req, res) => {
    try {
      const { meetingId, participantName } = req.params;
      const result = await getParticipantVote(meetingId, participantName);
      res.json(result);
    } catch (error) {
      console.error(
        'Error in GET /api/date-voting/:meetingId/vote/:participantName:',
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || '투표 조회 중 오류가 발생했습니다.',
      });
    }
  }
);

/**
 * GET /api/date-voting/:meetingId/results
 * 투표 결과 및 순위 조회
 */
router.get(
  '/:meetingId/results',
  readLimiter,
  [param('meetingId').notEmpty().withMessage('모임 ID가 필요합니다.'), validate],
  async (req, res) => {
    try {
      const { meetingId } = req.params;
      const result = await getVotingResults(meetingId);
      res.json(result);
    } catch (error) {
      console.error('Error in GET /api/date-voting/:meetingId/results:', error);
      res.status(500).json({
        success: false,
        message: error.message || '투표 결과 조회 중 오류가 발생했습니다.',
      });
    }
  }
);

module.exports = router;
