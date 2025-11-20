const express = require('express');
const router = express.Router();
const hostService = require('../services/hostService');

/**
 * POST /api/host/register
 * 호스트 회원가입
 */
router.post('/register', async (req, res) => {
  try {
    const { hostId, password } = req.body;

    if (!hostId || !password) {
      return res.status(400).json({
        success: false,
        message: '호스트 ID와 비밀번호를 입력해주세요.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 6자 이상이어야 합니다.'
      });
    }

    const result = await hostService.createHost(hostId, password);
    res.status(201).json(result);
  } catch (error) {
    console.error('Host register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '호스트 생성 중 오류가 발생했습니다.'
    });
  }
});

/**
 * POST /api/host/login
 * 호스트 로그인
 */
router.post('/login', async (req, res) => {
  try {
    const { hostId, password } = req.body;

    if (!hostId || !password) {
      return res.status(400).json({
        success: false,
        message: '호스트 ID와 비밀번호를 입력해주세요.'
      });
    }

    const result = await hostService.authenticateHost(hostId, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Host login error:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/host/:hostId/meetings
 * 호스트의 모든 모임 조회
 */
router.get('/:hostId/meetings', async (req, res) => {
  try {
    const { hostId } = req.params;

    const meetings = await hostService.getHostMeetings(hostId);
    res.json({
      success: true,
      meetings
    });
  } catch (error) {
    console.error('Get host meetings error:', error);
    res.status(500).json({
      success: false,
      message: '모임 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
