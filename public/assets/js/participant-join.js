let currentMeetingId = null;
let currentMeetingCode = null;
let myParticipantName = null;
let currentParticipantId = null;
let currentMeeting = null;

// --- 유틸리티 함수 ---

function showMessage(text, type = 'error') {
  const messageEl = document.getElementById('message');
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = `message message-${type}`;
  messageEl.classList.remove('hidden');

  setTimeout(() => {
    messageEl.classList.add('hidden');
  }, 3000);
}

// --- API 호출 함수 ---

async function loadMeetingInfo() {
  try {
    const response = await fetch(`/api/meetings/code/${currentMeetingCode}`);
    const data = await response.json();

    if (data.success) {
      currentMeetingId = data.meeting.id;
      currentMeeting = data.meeting;
      document.getElementById('meetingTitle').textContent = data.meeting.title;
      document.getElementById('loadingState').classList.add('hidden');
      document.getElementById('meetingInfo').classList.remove('hidden');
      document.getElementById('authForm').classList.remove('hidden');
      await loadParticipants();
    } else {
      showMessage(data.message);
      document.getElementById('loadingState').innerHTML = '<p style="color: #c33; text-align: center;">모임을 찾을 수 없습니다.</p>';
    }
  } catch (error) {
    console.error('Load meeting info error:', error);
    showMessage('모임 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

async function loadParticipants() {
  try {
    const response = await fetch(`/api/participants/meeting/${currentMeetingId}`);
    const data = await response.json();

    if (data.success) {
      const participantListEl = document.getElementById('participantList');
      const participantCount = data.participants.length;
      document.getElementById('participantCount').textContent = participantCount;

      if (participantCount > 0) {
        participantListEl.innerHTML = data.participants.map(p => `
          <li class="participant-item">
            <span class="participant-name">${p.isHost ? '👑 ' : ''}${p.name}</span>
            <span class="participant-time">${new Date(p.joinedAt._seconds * 1000).toLocaleTimeString()}</span>
          </li>
        `).join('');
      } else {
        participantListEl.innerHTML = '<li style="text-align: center; color: #888;">아직 참가자가 없습니다.</li>';
      }
      checkRecruitmentStatus(participantCount);
    }
  } catch (error) {
    console.error('Load participants error:', error);
  }
}

async function checkName() {
  const name = document.getElementById('participantName').value.trim();
  if (!name) {
    showMessage('이름을 입력해주세요.');
    return;
  }
  myParticipantName = name;
  document.getElementById('selectedName').textContent = name;

  try {
    showLoading('이름 확인 중...', '');
    const response = await fetch('/api/participants/check-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId: currentMeetingId, name }),
    });
    const data = await response.json();
    hideLoading();

    if (data.isDuplicate) {
      document.getElementById('nameStep').classList.add('hidden');
      document.getElementById('passwordStep').classList.remove('hidden');
      document.getElementById('loginForm').classList.remove('hidden');
      document.getElementById('signupForm').classList.add('hidden');
    } else {
      const isClosed = currentMeeting.recruitmentOpen === false;
      const currentCount = parseInt(document.getElementById('participantCount').textContent);
      const isFull = currentCount >= currentMeeting.maxParticipants;

      if (isClosed || isFull) {
        const reason = isClosed ? '모집이 마감되었습니다' : '최대 인원이 초과되어 마감되었습니다';
        showMessage(`${reason}. 신규 참가가 불가능합니다.`);
        return;
      }
      document.getElementById('nameStep').classList.add('hidden');
      document.getElementById('passwordStep').classList.remove('hidden');
      document.getElementById('signupForm').classList.remove('hidden');
      document.getElementById('loginForm').classList.add('hidden');
    }
  } catch (error) {
    console.error('Check name error:', error);
    hideLoading();
    showMessage('이름 확인 중 오류가 발생했습니다.');
  }
}

async function signup() {
  const password = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  if (!password || password.length < 4) {
    showMessage('비밀번호는 최소 4자 이상이어야 합니다.');
    return;
  }
  if (password !== confirmPassword) {
    showMessage('비밀번호가 일치하지 않습니다.');
    return;
  }
  try {
    showLoading('참가 중...', '잠시만 기다려주세요');
    const response = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingId: currentMeetingId,
        name: myParticipantName,
        password: password,
        message: ''
      }),
    });
    const data = await response.json();
    hideLoading();
    if (data.success) {
      saveSessionAndShowJoinedView(data.participant.id);
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Signup error:', error);
    hideLoading();
    showMessage('참가 중 오류가 발생했습니다.');
  }
}

async function login() {
  const password = document.getElementById('password').value;
  if (!password) {
    showMessage('비밀번호를 입력해주세요.');
    return;
  }
  try {
    showLoading('로그인 중...', '잠시만 기다려주세요');
    const response = await fetch('/api/participants/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingId: currentMeetingId,
        name: myParticipantName,
        password: password
      }),
    });
    const data = await response.json();
    hideLoading();
    if (data.success) {
      saveSessionAndShowJoinedView(data.participant.id);
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    hideLoading();
    showMessage('로그인 중 오류가 발생했습니다.');
  }
}

async function loadMyGuestbook() {
  try {
    const response = await fetch(`/api/participants/${currentMeetingId}/name/${myParticipantName}`);
    if (response.status === 404) {
      handleParticipantDeleted();
      return;
    }
    const data = await response.json();
    if (data.success && data.participant) {
      const message = data.participant.message || '아직 방명록을 작성하지 않았습니다.';
      document.getElementById('currentMessage').textContent = message;
      currentParticipantId = data.participant.id;
    } else if (!data.success) {
      handleParticipantDeleted();
    }
  } catch (error) {
    console.error('Load guestbook error:', error);
  }
}

async function updateGuestbook() {
  const newMessage = document.getElementById('editMessage').value.trim();
  try {
    showLoading('방명록 저장 중...', '');
    const response = await fetch(`/api/participants/${currentParticipantId}/message`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId: currentMeetingId, message: newMessage }),
    });
    const data = await response.json();
    hideLoading();
    if (data.success) {
      showMessage('방명록이 수정되었습니다!', 'success');
      document.getElementById('currentMessage').textContent = newMessage || '아직 방명록을 작성하지 않았습니다.';
      cancelEditGuestbook();
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Update guestbook error:', error);
    hideLoading();
    showMessage('방명록 수정 중 오류가 발생했습니다.');
  }
}

async function leaveMeeting() {
  if (!confirm('정말 모임에서 나가시겠습니까? 나간 후 다시 참가할 수 있습니다.')) return;
  try {
    showLoading('모임 나가는 중...', '');
    const response = await fetch(`/api/participants/${currentMeetingId}/${currentParticipantId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    hideLoading();
    if (data.success) {
      showMessage('모임에서 나갔습니다.', 'success');
      handleParticipantDeleted();
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Leave meeting error:', error);
    hideLoading();
    showMessage('모임 나가기 중 오류가 발생했습니다.');
  }
}

async function checkManitto() {
  try {
    showLoading('마니또 확인 중...', '');
    const response = await fetch(`/api/participants/manitto/${currentMeetingId}/${myParticipantName}`);
    const data = await response.json();
    hideLoading();
    const manittoResultEl = document.getElementById('manittoResult');
    if (data.success && data.manitto) {
      manittoResultEl.innerHTML = `
        <div style="text-align: center; padding: 20px; background: white; border-radius: 8px;">
          <p style="font-size: 18px; color: #667eea; margin-bottom: 10px;">당신의 마니또는...</p>
          <h2 style="color: #764ba2; font-size: 32px; margin: 15px 0;">🎁 ${data.manitto.manittoName}</h2>
          <p style="color: #888; font-size: 14px;">비밀로 해주세요!</p>
        </div>
      `;
    } else {
      manittoResultEl.innerHTML = `<p style="color: #888; text-align: center;">아직 매칭이 진행되지 않았습니다.</p>`;
    }
  } catch (error) {
    console.error('Check manitto error:', error);
    hideLoading();
    showMessage('마니또 조회 중 오류가 발생했습니다.');
  }
}

// --- UI 상태 변경 함수 ---

function checkRecruitmentStatus(participantCount) {
  if (!currentMeeting || currentParticipantId) return;
  const isClosed = currentMeeting.recruitmentOpen === false;
  const isFull = participantCount >= currentMeeting.maxParticipants;
  const authForm = document.getElementById('authForm');
  if (isClosed || isFull) {
    authForm.classList.remove('hidden');
    const reason = isClosed ? '모집이 마감되었습니다' : '최대 인원이 초과되어 마감되었습니다';
    authForm.innerHTML = `
      <div style="padding: 30px; text-align: center; background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px;">
        <p style="font-size: 24px; margin-bottom: 10px;">❌</p>
        <p style="font-size: 18px; font-weight: 600; color: #856404; margin-bottom: 10px;">마감된 모임입니다</p>
        <p style="color: #856404;">${reason}</p>
        <p style="color: #856404; margin-top: 10px;">참가자 수: ${participantCount}/${currentMeeting.maxParticipants}명</p>
      </div>`;
  } else {
    authForm.classList.remove('hidden');
  }
}

function goBackToName() {
  document.getElementById('passwordStep').classList.add('hidden');
  document.getElementById('nameStep').classList.remove('hidden');
  document.getElementById('participantName').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  document.getElementById('password').value = '';
  myParticipantName = null;
}

function showJoinedView() {
  document.getElementById('authForm').classList.add('hidden');
  document.getElementById('joinedView').classList.remove('hidden');
  document.getElementById('myName').textContent = myParticipantName;
  loadMyGuestbook();
}

function handleParticipantDeleted() {
  myParticipantName = null;
  currentParticipantId = null;
  localStorage.removeItem(`participant_${currentMeetingCode}`);
  document.getElementById('joinedView').classList.add('hidden');
  document.getElementById('authForm').classList.remove('hidden');
  document.getElementById('passwordStep').classList.add('hidden');
  document.getElementById('nameStep').classList.remove('hidden');
  document.getElementById('participantName').value = '';
  showMessage('모임에서 퇴장되었습니다. 다시 참가하려면 이름을 입력해주세요.', 'error');
  loadParticipants();
}

function showEditGuestbook() {
  const currentMessage = document.getElementById('currentMessage').textContent;
  document.getElementById('editMessage').value = currentMessage === '아직 방명록을 작성하지 않았습니다.' ? '' : currentMessage;
  document.getElementById('guestbookView').classList.add('hidden');
  document.getElementById('guestbookEdit').classList.remove('hidden');
}

function cancelEditGuestbook() {
  document.getElementById('guestbookEdit').classList.add('hidden');
  document.getElementById('guestbookView').classList.remove('hidden');
}

// --- 세션 관리 ---

function saveSessionAndShowJoinedView(participantId) {
  currentParticipantId = participantId;
  const sessionKey = `participant_${currentMeetingCode}`;
  const sessionData = { meetingId: currentMeetingId, participantId: currentParticipantId, participantName: myParticipantName };
  localStorage.setItem(sessionKey, JSON.stringify(sessionData));
  showMessage('작업이 완료되었습니다!', 'success');
  showJoinedView();
  loadParticipants();
}

async function checkSession() {
  const session = localStorage.getItem(`participant_${currentMeetingCode}`);
  if (session) {
    try {
      const { meetingId, participantId, participantName } = JSON.parse(session);
      currentMeetingId = meetingId;
      currentParticipantId = participantId;
      myParticipantName = participantName;
      await loadMeetingInfo();
      showJoinedView();
    } catch (error) {
      localStorage.removeItem(`participant_${currentMeetingCode}`);
      loadMeetingInfo();
    }
  } else {
    loadMeetingInfo();
  }
}

// --- DOM 초기화 및 이벤트 리스너 ---

document.addEventListener('DOMContentLoaded', () => {
  const pathParts = window.location.pathname.split('/');
  currentMeetingCode = pathParts[pathParts.length - 1];

  if (currentMeetingCode) {
    checkSession();
  } else {
    showMessage('잘못된 접근입니다.');
  }

  // 이벤트 위임
  document.body.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    // 더 구체적인 식별자를 사용
    const action = button.getAttribute('data-action');

    switch (action) {
      case 'check-name': checkName(); break;
      case 'signup': signup(); break;
      case 'login': login(); break;
      case 'go-back': goBackToName(); break;
      case 'edit-guestbook': showEditGuestbook(); break;
      case 'update-guestbook': updateGuestbook(); break;
      case 'cancel-edit-guestbook': cancelEditGuestbook(); break;
      case 'check-manitto': checkManitto(); break;
      case 'leave-meeting': leaveMeeting(); break;
      case 'refresh-participants': loadParticipants(); break;
    }
  });

  // 엔터 키 이벤트
  document.getElementById('participantName')?.addEventListener('keypress', (e) => e.key === 'Enter' && checkName());
  document.getElementById('confirmPassword')?.addEventListener('keypress', (e) => e.key === 'Enter' && signup());
  document.getElementById('password')?.addEventListener('keypress', (e) => e.key === 'Enter' && login());
});