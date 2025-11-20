let currentHostId = null;

// 메시지 표시
function showMessage(text, type = 'error') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message message-${type}`;
  messageEl.classList.remove('hidden');

  // 3초 후 자동 숨김
  setTimeout(() => {
    messageEl.classList.add('hidden');
  }, 3000);
}

// 로그아웃
function logout() {
  sessionStorage.removeItem('hostId');
  showLoading('로그아웃 중...', '메인 페이지로 이동합니다');
  setTimeout(() => {
    window.location.href = '/host';
  }, 500);
}

// 호스트 참가자 입력 필드 토글
function toggleHostParticipantFields() {
  const checkbox = document.getElementById('hostJoinsAsParticipant');
  const fields = document.getElementById('hostParticipantFields');

  if (checkbox.checked) {
    fields.classList.remove('hidden');
  } else {
    fields.classList.add('hidden');
  }
}

// 모임 생성
async function createMeeting() {
  const title = document.getElementById('meetingTitle').value.trim();
  const maxParticipants = parseInt(document.getElementById('maxParticipants').value);
  const hostJoinsAsParticipant = document.getElementById('hostJoinsAsParticipant').checked;

  if (!title) {
    showMessage('모임 제목을 입력해주세요.');
    return;
  }

  const meetingData = {
    hostId: currentHostId,
    title,
    maxParticipants,
    hostJoinsAsParticipant
  };

  // 호스트가 게스트로 참여하는 경우 추가 정보 수집
  if (hostJoinsAsParticipant) {
    const hostParticipantName = document.getElementById('hostParticipantName').value.trim();
    const hostPassword = document.getElementById('hostPassword').value.trim();
    const hostParticipantMessage = document.getElementById('hostParticipantMessage').value.trim();

    if (!hostParticipantName) {
      showMessage('참가자 이름을 입력해주세요.');
      return;
    }

    if (!hostPassword || hostPassword.length < 4) {
      showMessage('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    meetingData.hostParticipantName = hostParticipantName;
    meetingData.hostPassword = hostPassword;
    meetingData.hostParticipantMessage = hostParticipantMessage;
  }

  try {
    showLoading('모임 생성 중...', '잠시만 기다려주세요');

    const response = await fetch('/api/meetings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingData),
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      showMessage('모임이 생성되었습니다!', 'success');

      // 입력 필드 초기화
      document.getElementById('meetingTitle').value = '';
      document.getElementById('maxParticipants').value = '50';
      document.getElementById('hostJoinsAsParticipant').checked = false;
      document.getElementById('hostParticipantName').value = '';
      document.getElementById('hostPassword').value = '';
      document.getElementById('hostParticipantMessage').value = '';
      document.getElementById('hostParticipantFields').classList.add('hidden');

      loadMeetings();
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Create meeting error:', error);
    hideLoading();
    showMessage('모임 생성 중 오류가 발생했습니다.');
  }
}

// 모임 목록 로드
async function loadMeetings() {
  try {
    showLoading('모임 목록 불러오는 중...', '');

    const response = await fetch(`/api/host/${currentHostId}/meetings`);
    const data = await response.json();
    hideLoading();

    const meetingsListEl = document.getElementById('meetingsList');

    if (data.success && data.meetings.length > 0) {
      meetingsListEl.innerHTML = data.meetings.map(meeting => `
        <div class="meeting-card" id="meeting_${meeting.id}">
          <h3>${meeting.title}</h3>
          <div class="meeting-info">
            <span>📅 ${new Date(meeting.createdAt._seconds * 1000).toLocaleDateString()}</span>
            <span>👥 참가자: ${meeting.participantCount}명</span>
            <span>🔢 코드: <strong>${meeting.code}</strong></span>
          </div>
          <div class="meeting-info">
            <span>상태: ${getStatusText(meeting.status)}</span>
          </div>
          <div class="meeting-actions">
            <button class="btn btn-primary btn-small" data-action="toggle-detail" data-meeting-id="${meeting.id}">
              <span id="toggleBtn_${meeting.id}">▼ 상세 보기</span>
            </button>
            <button class="btn btn-white btn-small" data-action="copy-link" data-meeting-code="${meeting.code}">
              링크 복사
            </button>
            <button class="btn btn-danger btn-small" data-action="delete-meeting" data-meeting-id="${meeting.id}">
              삭제
            </button>
          </div>

          <!-- 상세 정보 영역 (초기에는 숨김) -->
          <div id="detail_${meeting.id}" style="display: none; margin-top: 20px; padding: 20px; background: #f0f8ff; border-radius: 10px; border-top: 2px solid #667eea;">
            <div class="loading">상세 정보를 불러오는 중...</div>
          </div>
        </div>
      `).join('');
    } else {
      meetingsListEl.innerHTML = '<p style="text-align: center; color: #888;">아직 생성된 모임이 없습니다.</p>';
    }
  } catch (error) {
    console.error('Load meetings error:', error);
    hideLoading();
    document.getElementById('meetingsList').innerHTML = '<p style="text-align: center; color: #c33;">목록을 불러오는 중 오류가 발생했습니다.</p>';
  }
}

// 모임 상태 텍스트
function getStatusText(status) {
  const statusMap = {
    'waiting': '⏳ 대기 중',
    'active': '✅ 진행 중',
    'completed': '✔️ 완료'
  };
  return statusMap[status] || status;
}

// 모임 상세 토글 (아코디언 방식)
async function toggleMeetingDetail(meetingId) {
  const detailEl = document.getElementById(`detail_${meetingId}`);
  const toggleBtn = document.getElementById(`toggleBtn_${meetingId}`);

  // 현재 펼쳐져 있으면 접기
  if (detailEl.style.display !== 'none') {
    detailEl.style.display = 'none';
    toggleBtn.textContent = '▼ 상세 보기';
    return;
  }

  // 접혀 있으면 펼치기 (데이터 로드)
  detailEl.style.display = 'block';
  toggleBtn.textContent = '▲ 접기';

  try {
    showLoading('상세 정보 불러오는 중...', '');

    // 모임 정보 조회
    const meetingResponse = await fetch(`/api/meetings/${meetingId}`);
    const meetingData = await meetingResponse.json();

    // 참가자 목록 조회
    const participantsResponse = await fetch(`/api/meetings/${meetingId}/participants`);
    const participantsData = await participantsResponse.json();
    hideLoading();

    if (meetingData.success && participantsData.success) {
      const meeting = meetingData.meeting;
      const participants = participantsData.participants;

      const detailHTML = `
        <div style="margin: 20px 0;">
          <h3 style="color: #667eea; margin-bottom: 15px;">📋 ${meeting.title}</h3>
          <p><strong>모임 코드:</strong> ${meeting.code}</p>
          <p><strong>참가 링크:</strong> <a href="/join/${meeting.code}" target="_blank">${window.location.origin}/join/${meeting.code}</a></p>
          <p><strong>상태:</strong> ${getStatusText(meeting.status)}</p>
          ${!meeting.hostJoinsAsParticipant ? `<p><strong>호스트:</strong> 👑 ${meeting.hostId}</p>` : ''}
          <p><strong>참가자 수:</strong> ${participants.length}/${meeting.maxParticipants}명</p>
          <p><strong>모집 상태:</strong>
            <span style="color: ${meeting.recruitmentOpen !== false && participants.length < meeting.maxParticipants ? '#2e7d32' : '#d32f2f'}; font-weight: 600;">
              ${meeting.recruitmentOpen === false
                ? '❌ 모집 마감'
                : participants.length >= meeting.maxParticipants
                  ? '❌ 마감 (인원 초과)'
                  : '✅ 모집 중'}
            </span>
          </p>
        </div>

        <div style="margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 10px;">
          <h3>⚙️ 모집 관리</h3>
          <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
            <button
              class="btn ${meeting.recruitmentOpen !== false ? 'btn-secondary' : 'btn-primary'}"
              data-action="toggle-recruitment" data-meeting-id="${meetingId}" data-currently-open="${meeting.recruitmentOpen !== false}"
              style="flex: 1; min-width: 150px;">
              ${meeting.recruitmentOpen !== false ? '🔒 모집 중단' : '🔓 모집 재개'}
            </button>
            <button
              class="btn btn-white"
              data-action="edit-max-participants" data-meeting-id="${meetingId}" data-current-max="${meeting.maxParticipants}" data-current-count="${participants.length}"
              style="flex: 1; min-width: 150px;">
              👥 최대 인원 수정
            </button>
          </div>
        </div>

        <div style="margin: 20px 0;">
          <h3>👥 참가자 목록</h3>
          <ul class="participant-list">
            <!-- 참가자 목록 -->
            ${participants.length > 0 ? participants.map(p => `
              <li class="participant-item"${p.isHost ? ' style="background: #f0f8ff; border-left: 3px solid #667eea;"' : ''}>
                <div>
                  <span class="participant-name">${p.isHost ? '👑 ' : ''}${p.name}</span>
                  ${p.isHost ? '<br><small style="color: #667eea; font-weight: 600;">호스트</small>' : ''}
                  ${p.message ? `<br><small style="color: #666;">💌 ${p.message}</small>` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="participant-time">${new Date(p.joinedAt._seconds * 1000).toLocaleString()}</span>
                  ${p.isHost ? '<span style="color: #667eea; font-size: 14px; font-weight: 600;">HOST</span>' : `
                  <button class="btn btn-danger btn-small" data-action="delete-participant" data-meeting-id="${meetingId}" data-participant-id="${p.id}" data-participant-name="${p.name}" style="width: auto; padding: 5px 10px;">
                    삭제
                  </button>
                  `}
                </div>
              </li>
            `).join('') : '<li style="color: #888; text-align: center; padding: 20px;">아직 참가자가 없습니다.</li>'}
          </ul>
        </div>

        <div style="margin: 20px 0;">
          <h3>🎲 마니또 매칭</h3>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            ${meeting.status === 'waiting' ? `
              <button
                class="btn btn-primary"
                data-action="execute-matching" data-meeting-id="${meetingId}"
                style="flex: 1;"
                ${(meeting.hostJoinsAsParticipant ? participants.length < 3 : participants.length < 2) ? 'disabled' : ''}>
                🎲 매칭 실행
              </button>
            ` : `
              <button class="btn btn-primary" data-action="view-mappings" data-meeting-id="${meetingId}" style="flex: 1;">
                👀 매칭 결과 확인
              </button>
              <button class="btn btn-secondary" data-action="reset-matching" data-meeting-id="${meetingId}" style="flex: 1;">
                🔄 매칭 초기화
              </button>
            `}
          </div>
          ${meeting.status === 'waiting' && (meeting.hostJoinsAsParticipant ? participants.length < 3 : participants.length < 2) ? `
            <p style="color: #d32f2f; margin-top: 10px; text-align: center; font-size: 14px;">
              ⚠️ 상호 매칭 방지를 위해 최소 3명 이상의 참가자가 필요합니다.<br>
              (현재: ${meeting.hostJoinsAsParticipant ? participants.length : participants.length + 1}명 (호스트 포함) / 필요: 3명)
            </p>
          ` : ''}
          ${meeting.status === 'active' ? `
            <p style="color: #2e7d32; margin-top: 10px; text-align: center;">
              ✅ 매칭 완료 (${meeting.matchedAt ? new Date(meeting.matchedAt._seconds * 1000).toLocaleString() : ''})
            </p>
          ` : ''}
        </div>

        <!-- 매칭 결과 표시 영역 -->
        <div id="mappingsResult_${meetingId}" style="display: none; margin: 20px 0; padding: 20px; background: #ffffff; border-radius: 10px; border: 2px solid #667eea;">
          <h3 style="color: #667eea; margin-bottom: 15px;">🔍 전체 매칭 결과</h3>
          <div id="mappingsList_${meetingId}"></div>
          <button class="btn btn-secondary" data-action="hide-mappings" data-meeting-id="${meetingId}" style="margin-top: 15px;">
            닫기
          </button>
        </div>
      `;

      detailEl.innerHTML = detailHTML;
    }
  } catch (error) {
    console.error('View meeting detail error:', error);
    hideLoading();
    detailEl.innerHTML = '<p style="color: #c33; text-align: center;">상세 정보를 불러오는 중 오류가 발생했습니다.</p>';
  }
}

// 모임 상세 새로고침 (참가자 삭제 등 업데이트 시)
async function refreshMeetingDetail(meetingId) {
  const detailEl = document.getElementById(`detail_${meetingId}`);

  // 펼쳐져 있는 경우에만 새로고침
  if (detailEl && detailEl.style.display !== 'none') {
    // 접었다 다시 펼치기 (자동으로 최신 데이터 로드)
    detailEl.style.display = 'none';
    await toggleMeetingDetail(meetingId);
  }
}

// 링크 복사
function copyMeetingLink(code) {
  const link = `${window.location.origin}/join/${code}`;
  navigator.clipboard.writeText(link).then(() => {
    showMessage('링크가 클립보드에 복사되었습니다!', 'success');
  }).catch(() => {
    prompt('링크를 복사하세요:', link);
  });
}

// 참가자 삭제
async function deleteParticipant(meetingId, participantId, participantName) {
  if (!confirm(`정말 "${participantName}" 참가자를 삭제하시겠습니까?`)) {
    return;
  }

  try {
    showLoading('참가자 삭제 중...', '');

    const response = await fetch(`/api/participants/${meetingId}/${participantId}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      showMessage('참가자가 삭제되었습니다.', 'success');
      // 모임 목록 및 상세 정보 새로고침
      await loadMeetings();
      await refreshMeetingDetail(meetingId);
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Delete participant error:', error);
    hideLoading();
    showMessage('참가자 삭제 중 오류가 발생했습니다.');
  }
}

// 모임 삭제
async function deleteMeeting(meetingId) {
  if (!confirm('정말 이 모임을 삭제하시겠습니까? 모든 참가자 데이터가 삭제됩니다.')) {
    return;
  }

  try {
    showLoading('모임 삭제 중...', '');

    const response = await fetch(`/api/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostId: currentHostId }),
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      showMessage('모임이 삭제되었습니다.', 'success');
      loadMeetings();
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Delete meeting error:', error);
    hideLoading();
    showMessage('모임 삭제 중 오류가 발생했습니다.');
  }
}

// 마니또 매칭 실행
async function executeMatching(meetingId) {
  if (!confirm('마니또 매칭을 실행하시겠습니까? 호스트를 포함한 모든 참가자가 매칭됩니다.')) {
    return;
  }

  try {
    showLoading('매칭 실행 중...', '잠시만 기다려주세요');

    const response = await fetch(`/api/manitto/execute/${meetingId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostId: currentHostId }),
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      showMessage(`매칭이 완료되었습니다! (총 ${data.participantCount}명)`, 'success');
      await loadMeetings();
      await refreshMeetingDetail(meetingId);
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Execute matching error:', error);
    hideLoading();
    showMessage('매칭 실행 중 오류가 발생했습니다.');
  }
}

// 매칭 결과 확인
async function viewMappings(meetingId) {
  try {
    showLoading('매칭 결과 불러오는 중...', '');

    const response = await fetch(`/api/manitto/mappings/${meetingId}?hostId=${currentHostId}`);
    const data = await response.json();
    hideLoading();

    if (data.success) {
      const mappingsList = document.getElementById(`mappingsList_${meetingId}`);

      if (data.mappings.length > 0) {
        mappingsList.innerHTML = `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #667eea; color: white;">
                <th style="padding: 10px; text-align: left;">참가자</th>
                <th style="padding: 10px; text-align: center;">→</th>
                <th style="padding: 10px; text-align: left;">마니또</th>
              </tr>
            </thead>
            <tbody>
              ${data.mappings.map(m => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px; font-weight: 600;">${m.giver}</td>
                  <td style="padding: 10px; text-align: center; color: #667eea;">🎁</td>
                  <td style="padding: 10px; font-weight: 600; color: #764ba2;">${m.receiver}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else {
        mappingsList.innerHTML = '<p style="color: #888; text-align: center;">매칭 결과가 없습니다.</p>';
      }

      document.getElementById(`mappingsResult_${meetingId}`).style.display = 'block';
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('View mappings error:', error);
    hideLoading();
    showMessage('매칭 결과 조회 중 오류가 발생했습니다.');
  }
}

// 매칭 결과 숨기기
function hideMappings(meetingId) {
  document.getElementById(`mappingsResult_${meetingId}`).style.display = 'none';
}

// 매칭 초기화
async function resetMatching(meetingId) {
  if (!confirm('정말 매칭을 초기화하시겠습니까? 모든 매칭 결과가 삭제되며, 다시 매칭을 실행할 수 있습니다.')) {
    return;
  }

  try {
    showLoading('매칭 초기화 중...', '');

    const response = await fetch(`/api/manitto/reset/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostId: currentHostId }),
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      showMessage('매칭이 초기화되었습니다.', 'success');
      hideMappings(meetingId);
      await loadMeetings();
      await refreshMeetingDetail(meetingId);
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Reset matching error:', error);
    hideLoading();
    showMessage('매칭 초기화 중 오류가 발생했습니다.');
  }
}

// 모집 중단/재개
async function toggleRecruitment(meetingId, currentlyOpen) {
  const action = currentlyOpen ? '중단' : '재개';
  if (!confirm(`정말 모집을 ${action}하시겠습니까?`)) {
    return;
  }

  try {
    showLoading(`모집 ${action} 중...`, '');

    const response = await fetch(`/api/meetings/${meetingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hostId: currentHostId,
        recruitmentOpen: !currentlyOpen
      }),
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      showMessage(`모집이 ${action}되었습니다.`, 'success');
      // 모임 목록과 상세 정보 모두 새로고침
      await loadMeetings();
      await refreshMeetingDetail(meetingId);
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Toggle recruitment error:', error);
    hideLoading();
    showMessage('모집 상태 변경 중 오류가 발생했습니다.');
  }
}

// 최대 참가자 수 수정
function showEditMaxParticipants(meetingId, currentMax, currentCount) {
  const newMax = prompt(`최대 참가자 수를 입력해주세요\n현재 설정: ${currentMax}명\n현재 참가자: ${currentCount}명`, currentMax);

  if (newMax === null) return; // 취소

  const maxNum = parseInt(newMax);

  // 숫자 유효성 검사
  if (isNaN(maxNum)) {
    alert('올바른 숫자를 입력해주세요.');
    return;
  }

  // 0 이하 체크
  if (maxNum <= 0) {
    alert('최대 인원은 1명 이상이어야 합니다.');
    return;
  }

  // 현재 참가자 수보다 적은지 체크
  if (maxNum < currentCount) {
    alert(`현재 참가자(${currentCount}명)보다 적게 설정할 수 없습니다.`);
    return;
  }

  // 최소 1명 체크 (이미 위에서 체크했으므로 제거 가능하지만 명시적으로 유지)
  if (maxNum < 1) {
    alert('최소 1명 이상으로 설정해주세요.');
    return;
  }

  updateMaxParticipants(meetingId, maxNum);
}

async function updateMaxParticipants(meetingId, maxParticipants) {
  try {
    showLoading('최대 참가자 수 수정 중...', '');

    const response = await fetch(`/api/meetings/${meetingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hostId: currentHostId,
        maxParticipants
      }),
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      showMessage('최대 참가자 수가 수정되었습니다.', 'success');
      // 모임 목록과 상세 정보 모두 새로고침
      await loadMeetings();
      await refreshMeetingDetail(meetingId);
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Update max participants error:', error);
    hideLoading();
    showMessage('최대 참가자 수 수정 중 오류가 발생했습니다.');
  }
}


// --- DOMContentLoaded: 모든 이벤트 핸들러 설정 ---
document.addEventListener('DOMContentLoaded', () => {
  currentHostId = sessionStorage.getItem('hostId');

  if (!currentHostId) {
    alert('로그인이 필요합니다.');
    window.location.href = '/host';
    return;
  }

  document.getElementById('hostIdDisplay').textContent = currentHostId;
  loadMeetings();

  // 정적 요소에 대한 이벤트 리스너
  document.querySelector('.logout-btn').addEventListener('click', logout);
  
  const createMeetingButton = document.querySelector('.btn-primary[data-action="create-meeting"]');
  if(createMeetingButton) {
      createMeetingButton.addEventListener('click', createMeeting);
  } else { 
      // Fallback for the case where data-action is not set yet.
      const buttons = document.querySelectorAll('.btn-primary');
      buttons.forEach(button => {
          if (button.textContent.includes('모임 생성하기')) {
              button.addEventListener('click', createMeeting);
          }
      });
  }


  document.getElementById('hostJoinsAsParticipant').addEventListener('change', toggleHostParticipantFields);

  // 동적 요소에 대한 이벤트 위임 (컨테이너에 리스너 추가)
  const container = document.querySelector('.container-wide');
  container.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const action = target.dataset.action;
    if (!action) return;

    const meetingId = target.dataset.meetingId;

    switch (action) {
      case 'toggle-detail':
        toggleMeetingDetail(meetingId);
        break;
      case 'copy-link':
        copyMeetingLink(target.dataset.meetingCode);
        break;
      case 'delete-meeting':
        deleteMeeting(meetingId);
        break;
      case 'toggle-recruitment':
        toggleRecruitment(meetingId, target.dataset.currentlyOpen === 'true');
        break;
      case 'edit-max-participants':
        showEditMaxParticipants(meetingId, parseInt(target.dataset.currentMax), parseInt(target.dataset.currentCount));
        break;
      case 'delete-participant':
        deleteParticipant(meetingId, target.dataset.participantId, target.dataset.participantName);
        break;
      case 'execute-matching':
        executeMatching(meetingId);
        break;
      case 'view-mappings':
        viewMappings(meetingId);
        break;
      case 'reset-matching':
        resetMatching(meetingId);
        break;
      case 'hide-mappings':
        hideMappings(meetingId);
        break;
    }
  });
});
