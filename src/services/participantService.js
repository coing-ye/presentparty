const { db } = require('../config/firebase');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * 참가자 이름 중복 체크
 */
async function checkNameDuplicate(meetingId, name) {
  try {
    const snapshot = await db.collection('meetings')
      .doc(meetingId)
      .collection('participants')
      .where('name', '==', name)
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch (error) {
    console.error('Check name duplicate error:', error);
    throw error;
  }
}

/**
 * 참가자 추가
 */
async function addParticipant(meetingId, participantData) {
  try {
    // 모임 정보 조회
    const meetingDoc = await db.collection('meetings').doc(meetingId).get();
    if (!meetingDoc.exists) {
      throw new Error('존재하지 않는 모임입니다.');
    }
    const meeting = meetingDoc.data();

    // 모집 상태 확인
    if (meeting.recruitmentOpen === false) {
      throw new Error('모집이 마감된 모임입니다.');
    }

    // 현재 참가자 수 확인
    const participantsSnapshot = await db.collection('meetings')
      .doc(meetingId)
      .collection('participants')
      .get();

    const currentCount = participantsSnapshot.size;
    const maxParticipants = meeting.maxParticipants || 100;

    // 최대 인원 초과 체크
    if (currentCount >= maxParticipants) {
      throw new Error('최대 참가 인원이 초과되었습니다.');
    }

    // 이름 중복 체크
    const isDuplicate = await checkNameDuplicate(meetingId, participantData.name);
    if (isDuplicate) {
      throw new Error('이미 사용 중인 이름입니다.');
    }

    // 비밀번호 필수 체크
    if (!participantData.password) {
      throw new Error('비밀번호는 필수입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(participantData.password, SALT_ROUNDS);

    // 참가자 추가
    const participant = {
      name: participantData.name,
      password: hashedPassword,
      message: participantData.message || '',
      isHost: false,
      joinedAt: new Date(),
    };

    const docRef = await db.collection('meetings')
      .doc(meetingId)
      .collection('participants')
      .add(participant);

    return {
      id: docRef.id,
      name: participant.name,
      message: participant.message,
      isHost: participant.isHost,
      joinedAt: participant.joinedAt,
    };
  } catch (error) {
    console.error('Add participant error:', error);
    throw error;
  }
}

/**
 * 참가자 목록 조회
 */
async function getParticipants(meetingId) {
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
    console.error('Get participants error:', error);
    throw error;
  }
}

/**
 * 참가자 방명록 수정
 */
async function updateParticipantMessage(meetingId, participantId, message) {
  try {
    await db.collection('meetings')
      .doc(meetingId)
      .collection('participants')
      .doc(participantId)
      .update({ message });

    return { success: true };
  } catch (error) {
    console.error('Update participant message error:', error);
    throw error;
  }
}

/**
 * 참가자 삭제
 */
async function deleteParticipant(meetingId, participantId) {
  try {
    // 호스트 참가자인지 확인
    const participantDoc = await db.collection('meetings')
      .doc(meetingId)
      .collection('participants')
      .doc(participantId)
      .get();

    if (!participantDoc.exists) {
      throw new Error('참가자를 찾을 수 없습니다.');
    }

    const participant = participantDoc.data();

    if (participant.isHost) {
      throw new Error('호스트 참가자는 삭제할 수 없습니다.');
    }

    await db.collection('meetings')
      .doc(meetingId)
      .collection('participants')
      .doc(participantId)
      .delete();

    return { success: true };
  } catch (error) {
    console.error('Delete participant error:', error);
    throw error;
  }
}

/**
 * 이름으로 참가자 조회
 */
async function getParticipantByName(meetingId, name) {
  try {
    const snapshot = await db.collection('meetings')
      .doc(meetingId)
      .collection('participants')
      .where('name', '==', name)
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
    console.error('Get participant by name error:', error);
    throw error;
  }
}

/**
 * 참가자의 마니또 조회 (참가자는 자신이 담당하는 마니또만 확인)
 */
async function getMyManitto(meetingId, participantName) {
  try {
    const snapshot = await db.collection('meetings')
      .doc(meetingId)
      .collection('manittoMappings')
      .where('giver', '==', participantName)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const mapping = snapshot.docs[0].data();
    return {
      myName: mapping.giver,
      manittoName: mapping.receiver,
    };
  } catch (error) {
    console.error('Get my manitto error:', error);
    throw error;
  }
}

/**
 * 참가자 로그인 (이름 + 비밀번호 인증)
 */
async function authenticateParticipant(meetingId, name, password) {
  try {
    const snapshot = await db.collection('meetings')
      .doc(meetingId)
      .collection('participants')
      .where('name', '==', name)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, message: '존재하지 않는 참가자입니다.' };
    }

    const doc = snapshot.docs[0];
    const participant = doc.data();

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, participant.password);

    if (!isPasswordValid) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    return {
      success: true,
      participant: {
        id: doc.id,
        name: participant.name,
        message: participant.message,
        isHost: participant.isHost,
        joinedAt: participant.joinedAt,
      },
    };
  } catch (error) {
    console.error('Authenticate participant error:', error);
    throw error;
  }
}

module.exports = {
  checkNameDuplicate,
  addParticipant,
  getParticipants,
  updateParticipantMessage,
  deleteParticipant,
  getParticipantByName,
  getMyManitto,
  authenticateParticipant,
};
