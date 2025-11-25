let currentMeetingId = null;
let currentMeetingCode = null;
let myParticipantName = null;
let currentParticipantId = null;
let currentMeeting = null;

// --- 유틸리티 함수 ---

// 날짜를 YYYY-MM-DD 형식으로 변환 (시간대 문제 방지)
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  loadDateVotingInfo();
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

// --- 날짜 투표 기능 ---

async function loadDateVotingInfo() {
  try {
    const response = await fetch(`/api/date-voting/${currentMeetingId}`);
    const data = await response.json();

    const dateVotingSection = document.getElementById('dateVotingSection');

    if (data.enabled) {
      dateVotingSection.style.display = 'block';
      // 기존 투표 데이터 로드
      await loadMyDateVote();
    } else {
      dateVotingSection.style.display = 'none';
    }
  } catch (error) {
    console.error('Load date voting info error:', error);
  }
}

async function loadMyDateVote() {
  try {
    const response = await fetch(`/api/date-voting/${currentMeetingId}/vote/${myParticipantName}`);
    const data = await response.json();

    // 전역 변수로 저장
    window.myDateVote = data;
  } catch (error) {
    console.error('Load my date vote error:', error);
  }
}

function showDateVotingModal() {
  // 먼저 날짜 범위 가져오기
  fetch(`/api/date-voting/${currentMeetingId}`)
    .then(res => res.json())
    .then(data => {
      if (!data.enabled) {
        showMessage('날짜 투표가 활성화되지 않았습니다.');
        return;
      }

      const startDate = data.startDate.split('T')[0];
      const endDate = data.endDate.split('T')[0];

      const modal = document.createElement('div');
      modal.id = 'participantDateVotingModal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        overflow-y: auto;
        padding: 20px;
      `;

      modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
          <h2 style="margin-bottom: 20px; color: #1976d2;">📅 모임 날짜 투표</h2>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
            투표 기간: ${new Date(startDate).toLocaleDateString('ko-KR')} ~ ${new Date(endDate).toLocaleDateString('ko-KR')}
          </p>

          <div class="form-group">
            <label style="font-weight: 600; margin-bottom: 10px; display: block;">날짜별 선호도</label>
            <div id="participantDateCalendar" style="margin-top: 10px;">
              <p style="color: #888; font-size: 14px; margin-bottom: 15px;">
                날짜를 클릭하여 선호도를 표시하세요:
                <br>🟢 <strong style="color: #2e7d32;">선호</strong> /
                🟡 <strong style="color: #f57c00;">비선호</strong> /
                🔴 <strong style="color: #d32f2f;">불가능</strong> /
                ⚪ 일반
              </p>
              <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button type="button" class="btn btn-secondary btn-small" data-action="toggle-participant-weekdays" id="toggleParticipantWeekdaysBtn" style="flex: 1; font-size: 13px; padding: 8px;">
                  📅 평일 모두 불가능
                </button>
                <button type="button" class="btn btn-secondary btn-small" data-action="toggle-participant-weekends" id="toggleParticipantWeekendsBtn" style="flex: 1; font-size: 13px; padding: 8px;">
                  🎉 주말 모두 불가능
                </button>
              </div>
              <div id="participantCalendarGrid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-bottom: 15px;">
                <!-- 달력이 여기에 동적으로 생성됩니다 -->
              </div>
              <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button type="button" class="btn btn-secondary btn-small" data-action="navigate-participant-month" data-direction="-1">◀ 이전 달</button>
                <button type="button" class="btn btn-secondary btn-small" data-action="navigate-participant-month" data-direction="1">다음 달 ▶</button>
                <span id="participantCurrentMonthDisplay" style="flex: 1; text-align: center; line-height: 40px; font-weight: 600;"></span>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 25px;">
            <button class="btn btn-primary" style="flex: 1;" data-action="submit-participant-date-vote">투표 완료</button>
            <button class="btn btn-secondary" style="flex: 1; margin-top: 0;" data-action="close-participant-date-voting-modal">취소</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // 전역 변수로 날짜 선호도 저장
      window.participantDatePreferences = window.myDateVote || {
        impossible: [],
        notPreferred: [],
        preferred: []
      };
      window.participantCalendarDate = new Date();
      window.participantVotingStartDate = startDate;
      window.participantVotingEndDate = endDate;

      // 달력 렌더링
      renderParticipantCalendar();

      // 모달 내부 이벤트 리스너 추가
      modal.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const dateStr = target.dataset.date;

        switch (action) {
          case 'navigate-participant-month':
            navigateParticipantMonth(parseInt(target.dataset.direction));
            break;
          case 'toggle-participant-date-preference':
            toggleParticipantDatePreference(dateStr, target);
            break;
          case 'toggle-participant-weekdays':
            toggleParticipantWeekdaysImpossible();
            break;
          case 'toggle-participant-weekends':
            toggleParticipantWeekendsImpossible();
            break;
          case 'submit-participant-date-vote':
            submitParticipantDateVote();
            break;
          case 'close-participant-date-voting-modal':
            closeParticipantDateVotingModal();
            break;
        }
      });
    })
    .catch(error => {
      console.error('Show date voting modal error:', error);
      showMessage('날짜 투표 모달을 여는 중 오류가 발생했습니다.');
    });
}

function renderParticipantCalendar() {
  const startDate = window.participantVotingStartDate;
  const endDate = window.participantVotingEndDate;

  const calendarGrid = document.getElementById('participantCalendarGrid');
  const monthDisplay = document.getElementById('participantCurrentMonthDisplay');

  const year = window.participantCalendarDate.getFullYear();
  const month = window.participantCalendarDate.getMonth();

  monthDisplay.textContent = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay();

  calendarGrid.innerHTML = '';

  // 요일 헤더
  ['일', '월', '화', '수', '목', '금', '토'].forEach(day => {
    const header = document.createElement('div');
    header.textContent = day;
    header.style.cssText = 'text-align: center; font-weight: 600; padding: 5px; font-size: 12px; color: #666;';
    calendarGrid.appendChild(header);
  });

  // 빈 칸 추가
  for (let i = 0; i < firstDayOfWeek; i++) {
    const empty = document.createElement('div');
    calendarGrid.appendChild(empty);
  }

  // 날짜 추가
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    // 시간대 문제 방지를 위해 로컬 날짜를 직접 포맷
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const isInRange = dateStr >= startDate && dateStr <= endDate;

    const dayEl = document.createElement('div');
    dayEl.textContent = day;
    dayEl.dataset.date = dateStr;

    let bgColor = '#f5f5f5';
    let textColor = '#999';

    // 이전 선택 표시 (범위 밖이어도 표시)
    if (window.participantDatePreferences.preferred.includes(dateStr)) {
      bgColor = '#c8e6c9'; // 녹색 (선호)
      textColor = isInRange ? '#333' : '#999';
    } else if (window.participantDatePreferences.notPreferred.includes(dateStr)) {
      bgColor = '#ffe082'; // 노란색 (비선호)
      textColor = isInRange ? '#333' : '#999';
    } else if (window.participantDatePreferences.impossible.includes(dateStr)) {
      bgColor = '#ffcdd2'; // 빨간색 (불가능)
      textColor = isInRange ? '#333' : '#999';
    } else if (isInRange) {
      bgColor = '#e3f2fd'; // 파란색 (일반)
      textColor = '#333';
    }

    // 범위 밖이면 반투명 처리
    const opacity = isInRange ? '1' : '0.5';

    dayEl.style.cssText = `
      text-align: center;
      padding: 10px 5px;
      background: ${bgColor};
      color: ${textColor};
      border-radius: 8px;
      cursor: ${isInRange ? 'pointer' : 'not-allowed'};
      font-size: 14px;
      transition: all 0.2s;
      opacity: ${opacity};
    `;

    if (isInRange) {
      dayEl.dataset.action = 'toggle-participant-date-preference';
      dayEl.style.transform = 'scale(1)';
      dayEl.addEventListener('mouseenter', () => dayEl.style.transform = 'scale(1.1)');
      dayEl.addEventListener('mouseleave', () => dayEl.style.transform = 'scale(1)');
    }

    calendarGrid.appendChild(dayEl);
  }

  updateParticipantToggleButtonStates();
}

function toggleParticipantDatePreference(dateStr, dayElement) {
  // 기존 팝업이 있으면 제거
  const existingPopup = document.getElementById('participantDatePreferencePopup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // 팝업 생성
  const popup = document.createElement('div');
  popup.id = 'participantDatePreferencePopup';
  popup.style.cssText = `
    position: fixed;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    padding: 8px;
    z-index: 10000;
    display: flex;
    gap: 8px;
  `;

  // 현재 선택된 상태 확인
  const { impossible, notPreferred, preferred } = window.participantDatePreferences;
  let currentState = 'normal';
  if (preferred.includes(dateStr)) currentState = 'preferred';
  else if (notPreferred.includes(dateStr)) currentState = 'notPreferred';
  else if (impossible.includes(dateStr)) currentState = 'impossible';

  // 옵션 버튼들 생성
  const options = [
    { state: 'preferred', icon: '🟢', label: '선호', color: '#c8e6c9' },
    { state: 'normal', icon: '⚪', label: '가능', color: '#e3f2fd' },
    { state: 'notPreferred', icon: '🟡', label: '비선호', color: '#ffe082' },
    { state: 'impossible', icon: '🔴', label: '불가능', color: '#ffcdd2' }
  ];

  options.forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 20px; margin-bottom: 2px;">${option.icon}</div>
        <div style="font-size: 11px; color: #666;">${option.label}</div>
      </div>
    `;
    button.style.cssText = `
      border: ${currentState === option.state ? '2px solid #667eea' : '2px solid transparent'};
      background: ${option.color};
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 60px;
    `;
    button.onmouseover = () => {
      if (currentState !== option.state) {
        button.style.transform = 'scale(1.05)';
      }
    };
    button.onmouseout = () => {
      button.style.transform = 'scale(1)';
    };
    button.onclick = (e) => {
      e.stopPropagation();
      setParticipantDatePreference(dateStr, option.state);
      popup.remove();
    };
    popup.appendChild(button);
  });

  // 팝업 위치 계산
  const rect = dayElement.getBoundingClientRect();
  const popupWidth = 280;
  const popupHeight = 80;

  let left = rect.left + (rect.width / 2) - (popupWidth / 2);
  let top = rect.bottom + 8;

  // 화면 밖으로 나가지 않도록 조정
  if (left + popupWidth > window.innerWidth) {
    left = window.innerWidth - popupWidth - 10;
  }
  if (left < 10) {
    left = 10;
  }
  if (top + popupHeight > window.innerHeight) {
    top = rect.top - popupHeight - 8;
  }

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;

  document.body.appendChild(popup);

  // 외부 클릭 시 팝업 닫기
  setTimeout(() => {
    const closePopup = (e) => {
      if (!popup.contains(e.target) && e.target !== dayElement) {
        popup.remove();
        document.removeEventListener('click', closePopup);
      }
    };
    document.addEventListener('click', closePopup);
  }, 100);
}

function setParticipantDatePreference(dateStr, state) {
  // 모든 배열에서 해당 날짜 제거
  window.participantDatePreferences.preferred = window.participantDatePreferences.preferred.filter(d => d !== dateStr);
  window.participantDatePreferences.notPreferred = window.participantDatePreferences.notPreferred.filter(d => d !== dateStr);
  window.participantDatePreferences.impossible = window.participantDatePreferences.impossible.filter(d => d !== dateStr);

  // 새로운 상태에 추가 (normal은 추가하지 않음)
  if (state === 'preferred') {
    window.participantDatePreferences.preferred.push(dateStr);
  } else if (state === 'notPreferred') {
    window.participantDatePreferences.notPreferred.push(dateStr);
  } else if (state === 'impossible') {
    window.participantDatePreferences.impossible.push(dateStr);
  }

  renderParticipantCalendar();
  updateParticipantToggleButtonStates();
}

function toggleParticipantWeekdaysImpossible() {
  const startDate = new Date(window.participantVotingStartDate);
  const endDate = new Date(window.participantVotingEndDate);

  // 범위 내 모든 평일 찾기
  const weekdays = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 월~금
      weekdays.push(formatDateLocal(d));
    }
  }

  if (weekdays.length === 0) return;

  // 모든 평일이 불가능인지 확인
  const allWeekdaysImpossible = weekdays.every(date =>
    window.participantDatePreferences.impossible.includes(date)
  );

  if (allWeekdaysImpossible) {
    // 모두 일반(가능)으로 변경
    weekdays.forEach(date => {
      window.participantDatePreferences.impossible = window.participantDatePreferences.impossible.filter(d => d !== date);
      window.participantDatePreferences.preferred = window.participantDatePreferences.preferred.filter(d => d !== date);
      window.participantDatePreferences.notPreferred = window.participantDatePreferences.notPreferred.filter(d => d !== date);
    });
  } else {
    // 모두 불가능으로 변경
    weekdays.forEach(date => {
      window.participantDatePreferences.impossible = window.participantDatePreferences.impossible.filter(d => d !== date);
      window.participantDatePreferences.preferred = window.participantDatePreferences.preferred.filter(d => d !== date);
      window.participantDatePreferences.notPreferred = window.participantDatePreferences.notPreferred.filter(d => d !== date);
      window.participantDatePreferences.impossible.push(date);
    });
  }

  renderParticipantCalendar();
  updateParticipantToggleButtonStates();
}

function toggleParticipantWeekendsImpossible() {
  const startDate = new Date(window.participantVotingStartDate);
  const endDate = new Date(window.participantVotingEndDate);

  // 범위 내 모든 주말 찾기
  const weekends = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // 일, 토
      weekends.push(formatDateLocal(d));
    }
  }

  if (weekends.length === 0) return;

  // 모든 주말이 불가능인지 확인
  const allWeekendsImpossible = weekends.every(date =>
    window.participantDatePreferences.impossible.includes(date)
  );

  if (allWeekendsImpossible) {
    // 모두 일반(가능)으로 변경
    weekends.forEach(date => {
      window.participantDatePreferences.impossible = window.participantDatePreferences.impossible.filter(d => d !== date);
      window.participantDatePreferences.preferred = window.participantDatePreferences.preferred.filter(d => d !== date);
      window.participantDatePreferences.notPreferred = window.participantDatePreferences.notPreferred.filter(d => d !== date);
    });
  } else {
    // 모두 불가능으로 변경
    weekends.forEach(date => {
      window.participantDatePreferences.impossible = window.participantDatePreferences.impossible.filter(d => d !== date);
      window.participantDatePreferences.preferred = window.participantDatePreferences.preferred.filter(d => d !== date);
      window.participantDatePreferences.notPreferred = window.participantDatePreferences.notPreferred.filter(d => d !== date);
      window.participantDatePreferences.impossible.push(date);
    });
  }

  renderParticipantCalendar();
  updateParticipantToggleButtonStates();
}

function updateParticipantToggleButtonStates() {
  const weekdaysBtn = document.getElementById('toggleParticipantWeekdaysBtn');
  const weekendsBtn = document.getElementById('toggleParticipantWeekendsBtn');

  if (!weekdaysBtn || !weekendsBtn) return;

  const startDate = new Date(window.participantVotingStartDate);
  const endDate = new Date(window.participantVotingEndDate);

  // 평일 확인
  const weekdays = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdays.push(formatDateLocal(d));
    }
  }

  const allWeekdaysImpossible = weekdays.length > 0 && weekdays.every(date =>
    window.participantDatePreferences.impossible.includes(date)
  );

  // 주말 확인
  const weekends = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekends.push(formatDateLocal(d));
    }
  }

  const allWeekendsImpossible = weekends.length > 0 && weekends.every(date =>
    window.participantDatePreferences.impossible.includes(date)
  );

  // 평일 버튼 업데이트
  weekdaysBtn.textContent = allWeekdaysImpossible ? '📅 평일 모두 가능' : '📅 평일 모두 불가능';
  weekdaysBtn.style.background = allWeekdaysImpossible ? '#ffcdd2' : '';

  // 주말 버튼 업데이트
  weekendsBtn.textContent = allWeekendsImpossible ? '🎉 주말 모두 가능' : '🎉 주말 모두 불가능';
  weekendsBtn.style.background = allWeekendsImpossible ? '#ffcdd2' : '';
}

function navigateParticipantMonth(direction) {
  window.participantCalendarDate.setMonth(window.participantCalendarDate.getMonth() + direction);
  renderParticipantCalendar();
  updateParticipantToggleButtonStates();
}

async function submitParticipantDateVote() {
  try {
    showLoading('투표 제출 중...', '');

    const response = await fetch(`/api/date-voting/${currentMeetingId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        participantName: myParticipantName,
        ...window.participantDatePreferences
      }),
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      showMessage('투표가 완료되었습니다!', 'success');
      closeParticipantDateVotingModal();
      await loadMyDateVote();
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Submit participant date vote error:', error);
    hideLoading();
    showMessage('투표 제출 중 오류가 발생했습니다.');
  }
}

function closeParticipantDateVotingModal() {
  const modal = document.getElementById('participantDateVotingModal');
  if (modal) {
    modal.remove();
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
      case 'show-date-voting': showDateVotingModal(); break;
    }
  });

  // 엔터 키 이벤트
  document.getElementById('participantName')?.addEventListener('keypress', (e) => e.key === 'Enter' && checkName());
  document.getElementById('confirmPassword')?.addEventListener('keypress', (e) => e.key === 'Enter' && signup());
  document.getElementById('password')?.addEventListener('keypress', (e) => e.key === 'Enter' && login());
});