const { db } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * 날짜 투표 설정 (호스트)
 */
async function setupDateVoting(meetingId, hostId, votingData) {
  try {
    const { startDate, endDate, hostVote } = votingData;

    // 모임 존재 및 호스트 권한 확인
    const meetingRef = db.collection('meetings').doc(meetingId);
    const meetingDoc = await meetingRef.get();

    if (!meetingDoc.exists) {
      throw new Error('모임을 찾을 수 없습니다.');
    }

    if (meetingDoc.data().hostId !== hostId) {
      throw new Error('호스트 권한이 없습니다.');
    }

    // 날짜 범위 검증 (로컬 타임존으로 파싱)
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    if (start > end) {
      throw new Error('종료 날짜는 시작 날짜보다 이후여야 합니다.');
    }

    // 날짜 투표 설정 업데이트
    await meetingRef.update({
      dateVoting: {
        enabled: true,
        startDate: admin.firestore.Timestamp.fromDate(start),
        endDate: admin.firestore.Timestamp.fromDate(end),
        hostVote: {
          impossible: hostVote?.impossible || [],
          notPreferred: hostVote?.notPreferred || [],
          preferred: hostVote?.preferred || [],
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    return {
      success: true,
      message: '날짜 투표가 설정되었습니다.',
    };
  } catch (error) {
    console.error('Error in setupDateVoting:', error);
    throw error;
  }
}

/**
 * 날짜 투표 정보 조회
 */
async function getDateVotingInfo(meetingId) {
  try {
    const meetingRef = db.collection('meetings').doc(meetingId);
    const meetingDoc = await meetingRef.get();

    if (!meetingDoc.exists) {
      throw new Error('모임을 찾을 수 없습니다.');
    }

    const data = meetingDoc.data();

    if (!data.dateVoting || !data.dateVoting.enabled) {
      return {
        enabled: false,
      };
    }

    return {
      enabled: true,
      startDate: data.dateVoting.startDate.toDate().toISOString(),
      endDate: data.dateVoting.endDate.toDate().toISOString(),
      hostVote: data.dateVoting.hostVote,
    };
  } catch (error) {
    console.error('Error in getDateVotingInfo:', error);
    throw error;
  }
}

/**
 * 참가자 투표
 */
async function submitParticipantVote(meetingId, participantName, voteData) {
  try {
    const { impossible, notPreferred, preferred } = voteData;

    // 모임 및 날짜 투표 설정 확인
    const meetingRef = db.collection('meetings').doc(meetingId);
    const meetingDoc = await meetingRef.get();

    if (!meetingDoc.exists) {
      throw new Error('모임을 찾을 수 없습니다.');
    }

    const meetingData = meetingDoc.data();

    if (!meetingData.dateVoting || !meetingData.dateVoting.enabled) {
      throw new Error('날짜 투표가 활성화되지 않았습니다.');
    }

    // 참가자 존재 확인
    const participantSnapshot = await db
      .collection('meetings')
      .doc(meetingId)
      .collection('participants')
      .where('name', '==', participantName)
      .get();

    if (participantSnapshot.empty) {
      // 호스트가 게스트로 참여한 경우 확인
      if (
        meetingData.hostJoinsAsParticipant &&
        meetingData.hostId === participantName
      ) {
        // 호스트는 허용
      } else {
        throw new Error('참가자를 찾을 수 없습니다.');
      }
    }

    // 투표 저장
    const voteRef = db
      .collection('meetings')
      .doc(meetingId)
      .collection('participantDateVotes')
      .doc(participantName);

    await voteRef.set({
      participantName,
      impossible: impossible || [],
      notPreferred: notPreferred || [],
      preferred: preferred || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: '투표가 완료되었습니다.',
    };
  } catch (error) {
    console.error('Error in submitParticipantVote:', error);
    throw error;
  }
}

/**
 * 참가자의 투표 조회
 */
async function getParticipantVote(meetingId, participantName) {
  try {
    const voteRef = db
      .collection('meetings')
      .doc(meetingId)
      .collection('participantDateVotes')
      .doc(participantName);

    const voteDoc = await voteRef.get();

    if (!voteDoc.exists) {
      return {
        impossible: [],
        notPreferred: [],
        preferred: [],
      };
    }

    const data = voteDoc.data();
    return {
      impossible: data.impossible || [],
      notPreferred: data.notPreferred || [],
      preferred: data.preferred || [],
    };
  } catch (error) {
    console.error('Error in getParticipantVote:', error);
    throw error;
  }
}

/**
 * 날짜별 참가자 투표 계산
 */
function calculateDateScore(date, allVotes) {
  let availableCount = 0;
  let totalScore = 0;
  const unavailableParticipants = [];

  // 날짜 문자열을 루프 밖에서 선언
  const dateStr = date.toISOString().split('T')[0];

  allVotes.forEach((vote) => {
    // 불가능한 날인지 확인
    if (vote.impossible.includes(dateStr)) {
      unavailableParticipants.push(vote.participantName);
      return;
    }

    // 참가 가능
    availableCount++;

    // 점수 계산
    if (vote.preferred.includes(dateStr)) {
      totalScore += 3; // 선호
    } else if (vote.notPreferred.includes(dateStr)) {
      totalScore += 1; // 비선호
    } else {
      totalScore += 2; // 일반 (선택 안함)
    }
  });

  return {
    date: dateStr,
    availableCount,
    totalScore,
    unavailableParticipants,
  };
}

/**
 * 투표 결과 및 순위 조회
 */
async function getVotingResults(meetingId) {
  try {
    // 모임 정보 조회
    const meetingRef = db.collection('meetings').doc(meetingId);
    const meetingDoc = await meetingRef.get();

    if (!meetingDoc.exists) {
      throw new Error('모임을 찾을 수 없습니다.');
    }

    const meetingData = meetingDoc.data();

    if (!meetingData.dateVoting || !meetingData.dateVoting.enabled) {
      throw new Error('날짜 투표가 활성화되지 않았습니다.');
    }

    // 모든 참가자 조회
    const participantsSnapshot = await db
      .collection('meetings')
      .doc(meetingId)
      .collection('participants')
      .get();

    const participants = [];
    participantsSnapshot.forEach((doc) => {
      participants.push(doc.data().name);
    });

    // 호스트를 참가자로 포함
    const allParticipants = [...participants];
    if (!meetingData.hostJoinsAsParticipant) {
      allParticipants.push('HOST'); // 호스트 투표도 포함
    }

    // 모든 투표 조회
    const votesSnapshot = await db
      .collection('meetings')
      .doc(meetingId)
      .collection('participantDateVotes')
      .get();

    const votes = [];
    votesSnapshot.forEach((doc) => {
      votes.push(doc.data());
    });

    // 호스트 투표 추가
    if (meetingData.dateVoting.hostVote) {
      votes.push({
        participantName: 'HOST',
        impossible: meetingData.dateVoting.hostVote.impossible || [],
        notPreferred: meetingData.dateVoting.hostVote.notPreferred || [],
        preferred: meetingData.dateVoting.hostVote.preferred || [],
      });
    }

    // 날짜 범위 내의 모든 날짜 생성
    const startDate = meetingData.dateVoting.startDate.toDate();
    const endDate = meetingData.dateVoting.endDate.toDate();
    const dateResults = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const result = calculateDateScore(new Date(currentDate), votes);
      dateResults.push(result);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 순위 정렬: 1) 참가 가능 인원 수 내림차순, 2) 총점 내림차순
    dateResults.sort((a, b) => {
      if (b.availableCount !== a.availableCount) {
        return b.availableCount - a.availableCount;
      }
      return b.totalScore - a.totalScore;
    });

    return {
      totalParticipants: allParticipants.length,
      votedParticipants: votes.length,
      results: dateResults,
    };
  } catch (error) {
    console.error('Error in getVotingResults:', error);
    throw error;
  }
}

module.exports = {
  setupDateVoting,
  getDateVotingInfo,
  submitParticipantVote,
  getParticipantVote,
  getVotingResults,
};
 
