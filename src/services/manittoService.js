const { db } = require('../config/firebase');

/**
 * Fisher-Yates 셔플 알고리즘
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 마니또 매칭 실행
 * - 호스트 포함 모든 참가자를 원형으로 연결
 * - manittoMappings 컬렉션에 저장
 */
async function executeMatching(meetingId) {
  const batch = db.batch();
  const meetingRef = db.collection('meetings').doc(meetingId);

  try {
    // 1. 모임 정보 조회
    const meetingDoc = await meetingRef.get();
    if (!meetingDoc.exists) {
      throw new Error('모임을 찾을 수 없습니다.');
    }
    const meeting = meetingDoc.data();

    // 2. 참가자 목록 조회
    const participantsSnapshot = await meetingRef.collection('participants').get();
    const participants = participantsSnapshot.docs.map(doc => doc.data().name);

    // 3. 호스트 참여 방식에 따라 참가자 목록 구성
    let allParticipants;
    if (meeting.hostJoinsAsParticipant) {
      allParticipants = participants;
    } else {
      allParticipants = [meeting.hostId, ...participants];
    }

    // 4. 최소 인원 확인
    if (allParticipants.length < 3) {
      throw new Error('상호 매칭 방지를 위해 최소 3명 이상의 참가자가 필요합니다. (현재: ' + allParticipants.length + '명)');
    }

    // 5. 참가자 순서 섞기
    const shuffled = shuffleArray(allParticipants);

    // 6. 기존 매칭 결과 삭제 (배치에 추가)
    const existingMappings = await meetingRef.collection('manittoMappings').get();
    existingMappings.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 7. 원형으로 연결하여 매칭 생성 (배치에 추가)
    const mappings = [];
    for (let i = 0; i < shuffled.length; i++) {
      const giver = shuffled[i];
      const receiver = shuffled[(i + 1) % shuffled.length];

      const mapping = { giver, receiver, createdAt: new Date() };
      mappings.push(mapping);

      const newMappingRef = meetingRef.collection('manittoMappings').doc();
      batch.set(newMappingRef, mapping);
    }

    // 8. 모임 상태를 'active'로 변경 (배치에 추가)
    batch.update(meetingRef, {
      status: 'active',
      matchedAt: new Date(),
    });

    // 9. 배치 커밋
    await batch.commit();

    return {
      success: true,
      participantCount: allParticipants.length,
      mappings,
    };
  } catch (error) {
    console.error('Execute matching error:', error);
    throw error;
  }
}

/**
 * 전체 매칭 결과 조회 (호스트용)
 */
async function getAllMappings(meetingId) {
  try {
    const snapshot = await db.collection('meetings')
      .doc(meetingId)
      .collection('manittoMappings')
      .get();

    if (snapshot.empty) {
      return [];
    }

    const mappings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return mappings;
  } catch (error) {
    console.error('Get all mappings error:', error);
    throw error;
  }
}

/**
 * 매칭 초기화 (다시 매칭할 수 있도록)
 */
async function resetMatching(meetingId) {
  const batch = db.batch();
  const meetingRef = db.collection('meetings').doc(meetingId);

  try {
    // 모든 매칭 결과 삭제 (배치에 추가)
    const mappingsSnapshot = await meetingRef.collection('manittoMappings').get();
    mappingsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 모임 상태를 'waiting'으로 변경 (배치에 추가)
    batch.update(meetingRef, {
      status: 'waiting',
      matchedAt: null,
    });

    // 배치 커밋
    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Reset matching error:', error);
    throw error;
  }
}

module.exports = {
  executeMatching,
  getAllMappings,
  resetMatching,
};
