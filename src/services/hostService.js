const bcrypt = require('bcrypt');
const { db } = require('../config/firebase');

const SALT_ROUNDS = 10;

/**
 * 호스트 생성
 */
async function createHost(hostId, password) {
  try {
    // 이미 존재하는 호스트인지 확인
    const hostDoc = await db.collection('hosts').doc(hostId).get();
    if (hostDoc.exists) {
      throw new Error('이미 존재하는 호스트 ID입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Firestore에 저장
    await db.collection('hosts').doc(hostId).set({
      id: hostId,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return { success: true, hostId };
  } catch (error) {
    console.error('Create host error:', error);
    throw error;
  }
}

/**
 * 호스트 로그인 인증
 */
async function authenticateHost(hostId, password) {
  try {
    // 호스트 조회
    const hostDoc = await db.collection('hosts').doc(hostId).get();

    if (!hostDoc.exists) {
      return { success: false, message: '존재하지 않는 호스트 ID입니다.' };
    }

    const hostData = hostDoc.data();

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, hostData.password);

    if (!isPasswordValid) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    return {
      success: true,
      hostId: hostData.id,
      message: '로그인 성공'
    };
  } catch (error) {
    console.error('Authenticate host error:', error);
    throw error;
  }
}

/**
 * 호스트의 모든 모임 조회
 */
async function getHostMeetings(hostId) {
  try {
    const meetingsSnapshot = await db.collection('meetings')
      .where('hostId', '==', hostId)
      // .orderBy('createdAt', 'desc')  // 인덱스 생성 전까지 임시 비활성화
      .get();

    const meetings = [];
    for (const doc of meetingsSnapshot.docs) {
      const meetingData = doc.data();

      // 참가자 수 조회 (호스트는 카운팅에서 제외)
      const participantsSnapshot = await db.collection('meetings')
        .doc(doc.id)
        .collection('participants')
        .get();

      meetings.push({
        id: doc.id,
        ...meetingData,
        participantCount: participantsSnapshot.size,
      });
    }

    return meetings;
  } catch (error) {
    console.error('Get host meetings error:', error);
    throw error;
  }
}

module.exports = {
  createHost,
  authenticateHost,
  getHostMeetings,
};
