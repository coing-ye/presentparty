const express = require('express');
const router = express.Router();
const participantService = require('../services/participantService');

/**
 * POST /api/participants/check-name
 * 참가자 이름 중복 체크
 */
router.post('/check-name', async (req, res) => {
  try {
    const { meetingId, name } = req.body;

    if (!meetingId || !name) {
      return res.status(400).json({
        success: false,
        message: '모임 ID와 이름을 입력해주세요.'
      });
    }

    const isDuplicate = await participantService.checkNameDuplicate(meetingId, name);

    res.json({
      success: true,
      isDuplicate
    });
  } catch (error) {
    console.error('Check name duplicate error:', error);
    res.status(500).json({
      success: false,
      message: '이름 중복 체크 중 오류가 발생했습니다.'
    });
  }
});

/**
 * POST /api/participants
 * 참가자 추가
 */
router.post('/', async (req, res) => {
  try {
    const { meetingId, name, password, message } = req.body;

    if (!meetingId || !name || !password) {
      return res.status(400).json({
        success: false,
        message: '모임 ID, 이름, 비밀번호를 입력해주세요.'
      });
    }

    const participant = await participantService.addParticipant(meetingId, {
      name,
      password,
      message: message || ''
    });

    res.status(201).json({
      success: true,
      participant
    });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '참가자 추가 중 오류가 발생했습니다.'
    });
  }
});

/**
 * POST /api/participants/login
 * 참가자 로그인
 */
router.post('/login', async (req, res) => {
  try {
    const { meetingId, name, password } = req.body;

    if (!meetingId || !name || !password) {
      return res.status(400).json({
        success: false,
        message: '모임 ID, 이름, 비밀번호를 입력해주세요.'
      });
    }

    const result = await participantService.authenticateParticipant(meetingId, name, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Login participant error:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/participants/meeting/:meetingId
 * 모임의 참가자 목록 조회
 */
router.get('/meeting/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const participants = await participantService.getParticipants(meetingId);

    res.json({
      success: true,
      participants
    });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({
      success: false,
      message: '참가자 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * PUT /api/participants/:participantId/message
 * 참가자 방명록 수정
 */
router.put('/:participantId/message', async (req, res) => {
  try {
    const { participantId } = req.params;
    const { meetingId, message } = req.body;

    if (!meetingId || !message) {
      return res.status(400).json({
        success: false,
        message: '모임 ID와 메시지를 입력해주세요.'
      });
    }

    await participantService.updateParticipantMessage(meetingId, participantId, message);

    res.json({
      success: true,
      message: '방명록이 수정되었습니다.'
    });
  } catch (error) {
    console.error('Update participant message error:', error);
    res.status(500).json({
      success: false,
      message: '방명록 수정 중 오류가 발생했습니다.'
    });
  }
});

/**
 * DELETE /api/participants/:meetingId/:participantId
 * 참가자 삭제
 */
router.delete('/:meetingId/:participantId', async (req, res) => {
  try {
    const { meetingId, participantId } = req.params;

    await participantService.deleteParticipant(meetingId, participantId);

    res.json({
      success: true,
      message: '참가자가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete participant error:', error);
    res.status(500).json({
      success: false,
      message: '참가자 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/participants/:meetingId/name/:participantName
 * 이름으로 참가자 조회
 */
router.get('/:meetingId/name/:participantName', async (req, res) => {
  try {
    const { meetingId, participantName } = req.params;

    const participant = await participantService.getParticipantByName(meetingId, participantName);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: '참가자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      participant
    });
  } catch (error) {
    console.error('Get participant by name error:', error);
    res.status(500).json({
      success: false,
      message: '참가자 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/participants/manitto/:meetingId/:participantName
 * 참가자의 마니또 조회 (자신이 담당하는 마니또만)
 */
router.get('/manitto/:meetingId/:participantName', async (req, res) => {
  try {
    const { meetingId, participantName } = req.params;

    const manitto = await participantService.getMyManitto(meetingId, participantName);

    if (!manitto) {
      return res.status(404).json({
        success: false,
        message: '아직 매칭이 진행되지 않았습니다.'
      });
    }

    res.json({
      success: true,
      manitto
    });
  } catch (error) {
    console.error('Get my manitto error:', error);
    res.status(500).json({
      success: false,
      message: '마니또 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
