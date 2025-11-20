const { db } = require('../config/firebase');
const QRCode = require('qrcode');

/**
 * 고유한 6자리 모임 코드 생성
 */
function generateMeetingCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

/**
 * 모임 코드 중복 확인 및 생성
 */
async function generateUniqueMeetingCode() {
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = generateMeetingCode();
    const snapshot = await db.collection('meetings')
      .where('code', '==', code)
      .limit(1)
      .get();

    if (snapshot.empty) {
      isUnique = true;
    }
  }

  return code;
}

/**
 * 모임 생성
 */
async function createMeeting(hostId, meetingData) {
  try {
    const code = await generateUniqueMeetingCode();

    const newMeeting = {
      title: meetingData.title,
      hostId: hostId,
      code: code,
      status: 'waiting', // waiting, active, completed
      createdAt: new Date(),
      maxParticipants: meetingData.maxParticipants || 100,
      hostJoinsAsParticipant: meetingData.hostJoinsAsParticipant || false,
      recruitmentOpen: true, // 모집 상태 (기본값: 열림)
    };

    const docRef = await db.collection('meetings').add(newMeeting);

    // 호스트가 게스트로도 참여하는 경우 참가자로 등록
    if (meetingData.hostJoinsAsParticipant) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(meetingData.hostPassword, 10);

      await db.collection('meetings')
        .doc(docRef.id)
        .collection('participants')
        .add({
          name: meetingData.hostParticipantName,
          password: hashedPassword,
          message: meetingData.hostParticipantMessage || '',
          isHost: true,
          joinedAt: new Date(),
        });
    }

    // QR 코드 생성
    const meetingUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/join/${code}`;
    const qrCodeDataUrl = await QRCode.toDataURL(meetingUrl);

    return {
      id: docRef.id,
      ...newMeeting,
      qrCode: qrCodeDataUrl,
      url: meetingUrl,
    };
  } catch (error) {
    console.error('Create meeting error:', error);
    throw error;
  }
}

/**
 * 모임 조회 (코드로)
 */
async function getMeetingByCode(code) {
  try {
    const snapshot = await db.collection('meetings')
      .where('code', '==', code.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error('Get meeting by code error:', error);
    throw error;
  }
}

/**
 * 모임 조회 (ID로)
 */
async function getMeetingById(meetingId) {
  try {
    const doc = await db.collection('meetings').doc(meetingId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error('Get meeting by ID error:', error);
    throw error;
  }
}

/**
 * 모임 수정
 */
async function updateMeeting(meetingId, hostId, updateData) {
  try {
    // 호스트 권한 확인
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
      throw new Error('존재하지 않는 모임입니다.');
    }
    if (meeting.hostId !== hostId) {
      throw new Error('권한이 없습니다.');
    }

    // 수정 가능한 필드만 추출
    const allowedFields = ['title', 'maxParticipants', 'status', 'recruitmentOpen'];
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    await db.collection('meetings').doc(meetingId).update(filteredData);

    return { success: true };
  } catch (error) {
    console.error('Update meeting error:', error);
    throw error;
  }
}

/**
 * 모임 삭제
 */
async function deleteMeeting(meetingId, hostId) {
  try {
    // 호스트 권한 확인
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
      throw new Error('존재하지 않는 모임입니다.');
    }
    if (meeting.hostId !== hostId) {
      throw new Error('권한이 없습니다.');
    }

    // 참가자 및 매칭 데이터 삭제
    const participantsSnapshot = await db.collection('meetings')
      .doc(meetingId)
      .collection('participants')
      .get();

    const deletePromises = participantsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    const mappingsSnapshot = await db.collection('meetings')
      .doc(meetingId)
      .collection('manittoMappings')
      .get();

    const deleteMappingsPromises = mappingsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deleteMappingsPromises);

    // 모임 삭제
    await db.collection('meetings').doc(meetingId).delete();

    return { success: true };
  } catch (error) {
    console.error('Delete meeting error:', error);
    throw error;
  }
}

/**
 * 모임의 참가자 목록 조회
 */
async function getMeetingParticipants(meetingId) {
  try {
    const snapshot = await db.collection('meetings')
      .doc(meetingId)
      .collection('participants')
      .orderBy('joinedAt', 'asc')
      .get();

    const participants = snapshot.docs.map(doc => {
      const data = doc.data();
      // 비밀번호 필드 제외
      const { password, ...participantData } = data;
      return {
        id: doc.id,
        ...participantData,
      };
    });

    return participants;
  } catch (error) {
    console.error('Get meeting participants error:', error);
    throw error;
  }
}

module.exports = {
  createMeeting,
  getMeetingByCode,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  getMeetingParticipants,
};
