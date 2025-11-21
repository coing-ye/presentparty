const { db } = require('../config/firebase');

/**
 * 호스트 권한 확인 미들웨어
 */
async function isHost(req, res, next) {
  try {
    const { meetingId } = req.params;
    // req.body와 req.query 양쪽에서 hostId를 확인
    const hostId = req.body.hostId || req.query.hostId;

    if (!hostId) {
      return res.status(400).json({
        success: false,
        message: '호스트 인증이 필요합니다.',
      });
    }

    const meetingDoc = await db.collection('meetings').doc(meetingId).get();

    if (!meetingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: '모임을 찾을 수 없습니다.',
      });
    }

    if (meetingDoc.data().hostId !== hostId) {
      return res.status(403).json({
        success: false,
        message: '해당 모임에 대한 호스트 권한이 없습니다.',
      });
    }

    // 다음 미들웨어 또는 라우트 핸들러로 진행
    next();
  } catch (error) {
    console.error('Authorization middleware error:', error);
    res.status(500).json({
      success: false,
      message: '인증 중 서버 오류가 발생했습니다.',
    });
  }
}

module.exports = {
  isHost,
};
