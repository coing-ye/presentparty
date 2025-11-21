const express = require('express');
const router = express.Router();
const manittoService = require('../services/manittoService');
const { matchingLimiter, readLimiter, deleteLimiter } = require('../middleware/security');
const { isHost } = require('../middleware/auth');

/**
 * POST /api/manitto/execute/:meetingId
 * 마니또 매칭 실행
 */
router.post('/execute/:meetingId', matchingLimiter, isHost, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const result = await manittoService.executeMatching(meetingId);

    res.json({
      success: true,
      message: '마니또 매칭이 완료되었습니다!',
      participantCount: result.participantCount,
    });
  } catch (error) {
    console.error('Execute matching error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '매칭 실행 중 오류가 발생했습니다.',
    });
  }
});

/**
 * GET /api/manitto/mappings/:meetingId
 * 전체 매칭 결과 조회 (호스트용)
 */
router.get('/mappings/:meetingId', readLimiter, isHost, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const mappings = await manittoService.getAllMappings(meetingId);

    res.json({
      success: true,
      mappings,
    });
  } catch (error) {
    console.error('Get mappings error:', error);
    res.status(500).json({
      success: false,
      message: '매칭 결과 조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * DELETE /api/manitto/reset/:meetingId
 * 매칭 초기화
 */
router.delete('/reset/:meetingId', deleteLimiter, isHost, async (req, res) => {
  try {
    const { meetingId } = req.params;
    await manittoService.resetMatching(meetingId);

    res.json({
      success: true,
      message: '매칭이 초기화되었습니다.',
    });
  } catch (error) {
    console.error('Reset matching error:', error);
    res.status(500).json({
      success: false,
      message: '매칭 초기화 중 오류가 발생했습니다.',
    });
  }
});

module.exports = router;

