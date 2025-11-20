const express = require('express');
const router = express.Router();
const meetingService = require('../services/meetingService');

/**
 * POST /api/meetings
 * 모임 생성
 */
router.post('/', async (req, res) => {
  try {
    const {
      hostId,
      title,
      maxParticipants,
      hostJoinsAsParticipant,
      hostParticipantName,
      hostPassword,
      hostParticipantMessage
    } = req.body;

    if (!hostId || !title) {
      return res.status(400).json({
        success: false,
        message: '호스트 ID와 모임 제목을 입력해주세요.'
      });
    }

    const meetingData = {
      title,
      maxParticipants: maxParticipants || 100,
      hostJoinsAsParticipant: hostJoinsAsParticipant || false
    };

    // 호스트가 게스트로 참여하는 경우 추가 정보 전달
    if (hostJoinsAsParticipant) {
      meetingData.hostParticipantName = hostParticipantName;
      meetingData.hostPassword = hostPassword;
      meetingData.hostParticipantMessage = hostParticipantMessage;
    }

    const meeting = await meetingService.createMeeting(hostId, meetingData);

    res.status(201).json({
      success: true,
      meeting
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      success: false,
      message: '모임 생성 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/meetings/code/:code
 * 모임 코드로 조회
 */
router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const meeting = await meetingService.getMeetingByCode(code);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: '존재하지 않는 모임 코드입니다.'
      });
    }

    res.json({
      success: true,
      meeting
    });
  } catch (error) {
    console.error('Get meeting by code error:', error);
    res.status(500).json({
      success: false,
      message: '모임 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/meetings/:meetingId
 * 모임 ID로 조회
 */
router.get('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await meetingService.getMeetingById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: '존재하지 않는 모임입니다.'
      });
    }

    res.json({
      success: true,
      meeting
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({
      success: false,
      message: '모임 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * PUT /api/meetings/:meetingId
 * 모임 수정
 */
router.put('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { hostId, ...updateData } = req.body;

    if (!hostId) {
      return res.status(400).json({
        success: false,
        message: '호스트 ID가 필요합니다.'
      });
    }

    await meetingService.updateMeeting(meetingId, hostId, updateData);

    res.json({
      success: true,
      message: '모임이 수정되었습니다.'
    });
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '모임 수정 중 오류가 발생했습니다.'
    });
  }
});

/**
 * DELETE /api/meetings/:meetingId
 * 모임 삭제
 */
router.delete('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { hostId } = req.body;

    if (!hostId) {
      return res.status(400).json({
        success: false,
        message: '호스트 ID가 필요합니다.'
      });
    }

    await meetingService.deleteMeeting(meetingId, hostId);

    res.json({
      success: true,
      message: '모임이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '모임 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/meetings/:meetingId/participants
 * 모임의 참가자 목록 조회
 */
router.get('/:meetingId/participants', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const participants = await meetingService.getMeetingParticipants(meetingId);

    res.json({
      success: true,
      participants
    });
  } catch (error) {
    console.error('Get meeting participants error:', error);
    res.status(500).json({
      success: false,
      message: '참가자 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
