let currentHostId = null;

// 날짜를 YYYY-MM-DD 형식으로 변환 (시간대 문제 방지)
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
            <span>👥 참가자: ${meeting.participantCount} / ${meeting.maxParticipants}명</span>
            <span>모집: <strong style="color: ${meeting.recruitmentOpen !== false && meeting.participantCount < meeting.maxParticipants ? '#2e7d32' : '#d32f2f'};">
              ${meeting.recruitmentOpen === false
                ? '❌ 모집 마감'
                : meeting.participantCount >= meeting.maxParticipants
                  ? '❌ 인원 마감'
                  : '✅ 모집 중'}
            </strong></span>
          </div>
          <div class="meeting-info" style="font-size: 13px; color: #888; margin-top: 5px;">
            <span>📅 생성: ${new Date(meeting.createdAt._seconds * 1000).toLocaleDateString()}</span>
            <span>🔢 코드: <strong>${meeting.code}</strong></span>
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
    
    if (meetingData.success && participantsData.success) {
      const meeting = meetingData.meeting;
      const participants = participantsData.participants;

      const detailHTML = `
        <div style="margin: 20px 0;">
          <h3 style="color: #667eea; margin-bottom: 15px;">📋 ${meeting.title}</h3>
          <p><strong>모임 코드:</strong> ${meeting.code}</p>
          <p><strong>참가 링크:</strong> <a href="/join/${meeting.code}" target="_blank" class="link word-break-all">${window.location.origin}/join/${meeting.code}</a></p>
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

        <div style="margin: 20px 0; padding: 20px; background: #fff3e0; border-radius: 10px;">
          <h3>📅 모임 날짜 투표</h3>
          <p style="color: #666; font-size: 14px; margin: 10px 0;">참가자들과 함께 모임 날짜를 투표로 정할 수 있습니다.</p>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button
              class="btn btn-primary"
              data-action="setup-date-voting" data-meeting-id="${meetingId}"
              style="flex: 1;">
              📅 날짜 투표 설정
            </button>
            <button
              class="btn btn-white"
              data-action="view-date-voting-results" data-meeting-id="${meetingId}"
              style="flex: 1;">
              📊 투표 결과 보기
            </button>
          </div>

          <!-- 날짜 투표 결과 표시 영역 -->
          <div id="dateVotingResults_${meetingId}" style="display: none; margin-top: 20px;"></div>
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
      hideLoading();
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
      // 상세 정보 새로고침 후, 매칭 결과 자동 표시
      await refreshMeetingDetail(meetingId);
      await viewMappings(meetingId);
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
      hideLoading();
    } else {
      hideLoading();
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
      // 전체 목록 새로고침 대신 해당 모임의 상세 정보만 새로고침
      await refreshMeetingDetail(meetingId);
      hideLoading();
    } else {
      hideLoading();
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

// ========== 날짜 투표 기능 ==========

// 날짜 투표 설정 팝업 표시
async function showDateVotingSetup(meetingId) {
  // 기존 투표 데이터 불러오기
  let existingVotingData = null;
  let hostVote = null;

  try {
    const response = await fetch(`/api/date-voting/${meetingId}`);
    const data = await response.json();

    if (data.enabled) {
      existingVotingData = data;
      // 호스트 투표 데이터 가져오기 (호스트 이름은 meetings 컬렉션에서 가져와야 함)
      if (data.hostVote) {
        hostVote = data.hostVote;
      }
    }
  } catch (error) {
    console.error('Error loading existing voting data:', error);
  }

  const modal = document.createElement('div');
  modal.id = 'dateVotingModal';
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

  // 기존 데이터가 있으면 사용, 없으면 기본값
  const today = formatDateLocal(new Date());
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
  const defaultEndDate = formatDateLocal(oneMonthLater);

  const startDateValue = existingVotingData ? existingVotingData.startDate.split('T')[0] : today;
  const endDateValue = existingVotingData ? existingVotingData.endDate.split('T')[0] : defaultEndDate;

  modal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
      <h2 style="margin-bottom: 20px; color: #667eea;">📅 모임 날짜 투표 설정</h2>

      <div class="form-group">
        <label for="votingStartDate">모임 가능 기간 시작일</label>
        <input type="date" id="votingStartDate" value="${startDateValue}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
      </div>

      <div class="form-group">
        <label for="votingEndDate">모임 가능 기간 종료일</label>
        <input type="date" id="votingEndDate" value="${endDateValue}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
      </div>

      <div class="form-group">
        <label style="font-weight: 600; margin-bottom: 10px; display: block;">호스트 날짜 선호도 (선택사항)</label>
        <div id="dateSelectionCalendar" style="margin-top: 10px;">
          <p style="color: #888; font-size: 14px; margin-bottom: 15px;">
            날짜를 클릭하여 선호도를 표시하세요:
            <br>🟢 <strong style="color: #2e7d32;">선호</strong> /
            🟡 <strong style="color: #f57c00;">비선호</strong> /
            🔴 <strong style="color: #d32f2f;">불가능</strong> /
            ⚪ 가능
          </p>
          <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
            <button type="button" class="btn btn-white btn-small" data-action="toggle-weekdays" id="toggleWeekdaysBtn" style="font-size: 12px; padding: 6px 12px;">
              📅 평일 모두 불가능
            </button>
            <button type="button" class="btn btn-white btn-small" data-action="toggle-weekends" id="toggleWeekendsBtn" style="font-size: 12px; padding: 6px 12px;">
              🎉 주말 모두 불가능
            </button>
          </div>
          <div id="calendarGrid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-bottom: 15px;">
            <!-- 달력이 여기에 동적으로 생성됩니다 -->
          </div>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button type="button" class="btn btn-secondary btn-small" data-action="navigate-month" data-direction="-1">◀ 이전 달</button>
            <button type="button" class="btn btn-secondary btn-small" data-action="navigate-month" data-direction="1">다음 달 ▶</button>
            <span id="currentMonthDisplay" style="flex: 1; text-align: center; line-height: 40px; font-weight: 600;"></span>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 25px;">
        <button class="btn btn-primary" style="flex: 1;" data-action="submit-date-voting" data-meeting-id="${meetingId}">설정 완료</button>
        <button class="btn btn-secondary" style="flex: 1; margin-top: 0;" data-action="close-date-voting-modal">취소</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 전역 변수로 날짜 선호도 저장 (기존 데이터가 있으면 불러오기)
  window.datePreferences = hostVote ? {
    impossible: hostVote.impossible || [],
    notPreferred: hostVote.notPreferred || [],
    preferred: hostVote.preferred || []
  } : {
    impossible: [],
    notPreferred: [],
    preferred: []
  };
  window.currentCalendarDate = new Date();

  // 달력 렌더링
  renderCalendar();

  // 모달 내부 이벤트 리스너 추가
  modal.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const dateStr = target.dataset.date;

    switch (action) {
      case 'navigate-month':
        navigateMonth(parseInt(target.dataset.direction));
        break;
      case 'toggle-date-preference':
        toggleDatePreference(dateStr, target);
        break;
      case 'toggle-weekdays':
        toggleWeekdaysImpossible();
        break;
      case 'toggle-weekends':
        toggleWeekendsImpossible();
        break;
      case 'submit-date-voting':
        submitDateVoting(target.dataset.meetingId);
        break;
      case 'close-date-voting-modal':
        closeDateVotingModal();
        break;
    }
  });

  // 날짜 범위 변경 시 달력 재렌더링
  const startDateInput = modal.querySelector('#votingStartDate');
  const endDateInput = modal.querySelector('#votingEndDate');

  if (startDateInput) {
    startDateInput.addEventListener('change', () => {
      renderCalendar();
      updateToggleButtonStates();
    });
  }
  if (endDateInput) {
    endDateInput.addEventListener('change', () => {
      renderCalendar();
      updateToggleButtonStates();
    });
  }

  // 초기 버튼 상태 업데이트
  updateToggleButtonStates();
}

// 달력 렌더링
function renderCalendar() {
  const startDate = document.getElementById('votingStartDate').value;
  const endDate = document.getElementById('votingEndDate').value;

  if (!startDate || !endDate) return;

  const calendarGrid = document.getElementById('calendarGrid');
  const monthDisplay = document.getElementById('currentMonthDisplay');

  const year = window.currentCalendarDate.getFullYear();
  const month = window.currentCalendarDate.getMonth();

  monthDisplay.textContent = `${year}년 ${month + 1}월`;

  // 해당 월의 첫째 날과 마지막 날
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 첫째 날의 요일 (0 = 일요일)
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

    // 날짜 범위 내에 있는지 확인
    const isInRange = dateStr >= startDate && dateStr <= endDate;

    const dayEl = document.createElement('div');
    dayEl.textContent = day;
    dayEl.dataset.date = dateStr;

    let bgColor = '#f5f5f5';
    let textColor = '#999';

    // 이전 선택 표시 (범위 밖이어도 표시)
    if (window.datePreferences.preferred.includes(dateStr)) {
      bgColor = '#c8e6c9'; // 녹색 (선호)
      textColor = isInRange ? '#333' : '#999';
    } else if (window.datePreferences.notPreferred.includes(dateStr)) {
      bgColor = '#ffe082'; // 노란색 (비선호)
      textColor = isInRange ? '#333' : '#999';
    } else if (window.datePreferences.impossible.includes(dateStr)) {
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
      dayEl.dataset.action = 'toggle-date-preference';
      dayEl.style.transform = 'scale(1)';
      dayEl.addEventListener('mouseenter', () => dayEl.style.transform = 'scale(1.1)');
      dayEl.addEventListener('mouseleave', () => dayEl.style.transform = 'scale(1)');
    }

    calendarGrid.appendChild(dayEl);
  }
}

// 날짜 선호도 선택 팝업 표시
function toggleDatePreference(dateStr, dayElement) {
  // 기존 팝업이 있으면 제거
  const existingPopup = document.getElementById('datePreferencePopup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // 팝업 생성
  const popup = document.createElement('div');
  popup.id = 'datePreferencePopup';
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
  const { impossible, notPreferred, preferred } = window.datePreferences;
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
      setDatePreference(dateStr, option.state);
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

// 날짜 선호도 설정
function setDatePreference(dateStr, state) {
  // 모든 배열에서 해당 날짜 제거
  window.datePreferences.preferred = window.datePreferences.preferred.filter(d => d !== dateStr);
  window.datePreferences.notPreferred = window.datePreferences.notPreferred.filter(d => d !== dateStr);
  window.datePreferences.impossible = window.datePreferences.impossible.filter(d => d !== dateStr);

  // 새로운 상태에 추가 (normal은 추가하지 않음)
  if (state === 'preferred') {
    window.datePreferences.preferred.push(dateStr);
  } else if (state === 'notPreferred') {
    window.datePreferences.notPreferred.push(dateStr);
  } else if (state === 'impossible') {
    window.datePreferences.impossible.push(dateStr);
  }

  renderCalendar();
  updateToggleButtonStates();
}

// 평일 모두 불가능 토글
function toggleWeekdaysImpossible() {
  const startDate = document.getElementById('votingStartDate').value;
  const endDate = document.getElementById('votingEndDate').value;

  if (!startDate || !endDate) {
    alert('먼저 투표 기간을 설정해주세요.');
    return;
  }

  // 기간 내 모든 평일 찾기
  const weekdays = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // 월~금 (1~5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdays.push(formatDateLocal(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 모든 평일이 이미 불가능인지 확인
  const allWeekdaysImpossible = weekdays.every(date =>
    window.datePreferences.impossible.includes(date)
  );

  if (allWeekdaysImpossible) {
    // 모두 불가능 → 모두 가능으로 (impossible에서 제거)
    window.datePreferences.impossible = window.datePreferences.impossible.filter(
      date => !weekdays.includes(date)
    );
  } else {
    // 일부 또는 전체 가능 → 모두 불가능으로
    weekdays.forEach(date => {
      // 다른 배열에서 제거
      window.datePreferences.preferred = window.datePreferences.preferred.filter(d => d !== date);
      window.datePreferences.notPreferred = window.datePreferences.notPreferred.filter(d => d !== date);
      // impossible에 추가 (중복 방지)
      if (!window.datePreferences.impossible.includes(date)) {
        window.datePreferences.impossible.push(date);
      }
    });
  }

  renderCalendar();
  updateToggleButtonStates();
}

// 주말 모두 불가능 토글
function toggleWeekendsImpossible() {
  const startDate = document.getElementById('votingStartDate').value;
  const endDate = document.getElementById('votingEndDate').value;

  if (!startDate || !endDate) {
    alert('먼저 투표 기간을 설정해주세요.');
    return;
  }

  // 기간 내 모든 주말 찾기
  const weekends = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // 토, 일 (0, 6)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekends.push(formatDateLocal(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 모든 주말이 이미 불가능인지 확인
  const allWeekendsImpossible = weekends.every(date =>
    window.datePreferences.impossible.includes(date)
  );

  if (allWeekendsImpossible) {
    // 모두 불가능 → 모두 가능으로
    window.datePreferences.impossible = window.datePreferences.impossible.filter(
      date => !weekends.includes(date)
    );
  } else {
    // 일부 또는 전체 가능 → 모두 불가능으로
    weekends.forEach(date => {
      // 다른 배열에서 제거
      window.datePreferences.preferred = window.datePreferences.preferred.filter(d => d !== date);
      window.datePreferences.notPreferred = window.datePreferences.notPreferred.filter(d => d !== date);
      // impossible에 추가 (중복 방지)
      if (!window.datePreferences.impossible.includes(date)) {
        window.datePreferences.impossible.push(date);
      }
    });
  }

  renderCalendar();
  updateToggleButtonStates();
}

// 토글 버튼 상태 업데이트
function updateToggleButtonStates() {
  const startDate = document.getElementById('votingStartDate')?.value;
  const endDate = document.getElementById('votingEndDate')?.value;

  if (!startDate || !endDate) return;

  // 평일 체크
  const weekdays = [];
  const weekends = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = formatDateLocal(currentDate);
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdays.push(dateStr);
    } else {
      weekends.push(dateStr);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 평일 버튼 업데이트
  const weekdaysBtn = document.getElementById('toggleWeekdaysBtn');
  if (weekdaysBtn) {
    const allWeekdaysImpossible = weekdays.every(date =>
      window.datePreferences.impossible.includes(date)
    );
    weekdaysBtn.textContent = allWeekdaysImpossible ? '📅 평일 모두 가능' : '📅 평일 모두 불가능';
    weekdaysBtn.style.background = allWeekdaysImpossible ? '#ffcdd2' : 'white';
  }

  // 주말 버튼 업데이트
  const weekendsBtn = document.getElementById('toggleWeekendsBtn');
  if (weekendsBtn) {
    const allWeekendsImpossible = weekends.every(date =>
      window.datePreferences.impossible.includes(date)
    );
    weekendsBtn.textContent = allWeekendsImpossible ? '🎉 주말 모두 가능' : '🎉 주말 모두 불가능';
    weekendsBtn.style.background = allWeekendsImpossible ? '#ffcdd2' : 'white';
  }
}

// 월 이동
function navigateMonth(direction) {
  window.currentCalendarDate.setMonth(window.currentCalendarDate.getMonth() + direction);
  renderCalendar();
  updateToggleButtonStates();
}

// 날짜 투표 설정 제출
async function submitDateVoting(meetingId) {
  const startDate = document.getElementById('votingStartDate').value;
  const endDate = document.getElementById('votingEndDate').value;

  if (!startDate || !endDate) {
    alert('시작일과 종료일을 모두 선택해주세요.');
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    alert('종료일은 시작일보다 이후여야 합니다.');
    return;
  }

  try {
    showLoading('날짜 투표 설정 중...', '');

    const response = await fetch(`/api/date-voting/${meetingId}/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hostId: currentHostId,
        startDate,
        endDate,
        hostVote: window.datePreferences
      }),
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      showMessage('날짜 투표가 설정되었습니다!', 'success');
      closeDateVotingModal();
      await refreshMeetingDetail(meetingId);
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Submit date voting error:', error);
    hideLoading();
    showMessage('날짜 투표 설정 중 오류가 발생했습니다.');
  }
}

// 날짜 투표 모달 닫기
function closeDateVotingModal() {
  const modal = document.getElementById('dateVotingModal');
  if (modal) {
    modal.remove();
  }
}

// 날짜 투표 결과 보기
async function viewDateVotingResults(meetingId) {
  try {
    showLoading('투표 결과 불러오는 중...', '');

    const response = await fetch(`/api/date-voting/${meetingId}/results`);
    const data = await response.json();
    hideLoading();

    if (!data.totalParticipants) {
      showMessage('투표 결과가 없습니다.');
      return;
    }

    // 결과 표시 영역 토글
    const resultsEl = document.getElementById(`dateVotingResults_${meetingId}`);

    if (resultsEl.style.display === 'block') {
      resultsEl.style.display = 'none';
      return;
    }

    const resultsHTML = `
      <div style="padding: 20px; background: #f9f9f9; border-radius: 10px;">
        <h4 style="margin-bottom: 15px; color: #667eea;">📊 날짜 투표 결과</h4>
        <p style="margin-bottom: 15px;">
          <strong>총 참여 인원:</strong> ${data.totalParticipants}명 /
          <strong>투표 완료:</strong> ${data.votedParticipants}명
        </p>

        <div style="max-height: 400px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #667eea; color: white; position: sticky; top: 0;">
                <th style="padding: 10px; text-align: left;">순위</th>
                <th style="padding: 10px; text-align: left;">날짜</th>
                <th style="padding: 10px; text-align: center;">참여 가능</th>
                <th style="padding: 10px; text-align: center;">선호도 점수</th>
                <th style="padding: 10px; text-align: left;">불가능한 인원</th>
              </tr>
            </thead>
            <tbody>
              ${data.results.slice(0, 20).map((result, index) => {
                const date = new Date(result.date);
                const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
                const isWeekend = dayOfWeek === '토' || dayOfWeek === '일';

                return `
                  <tr style="border-bottom: 1px solid #ddd; ${index < 3 ? 'background: #fff9c4;' : ''}">
                    <td style="padding: 10px; font-weight: 600;">${index + 1}</td>
                    <td style="padding: 10px;">
                      ${date.toLocaleDateString('ko-KR')} (${dayOfWeek})
                      ${isWeekend ? '<span style="color: #d32f2f;">🎉</span>' : ''}
                    </td>
                    <td style="padding: 10px; text-align: center; font-weight: 600; color: ${result.availableCount === data.totalParticipants ? '#2e7d32' : '#f57c00'};">
                      ${result.availableCount}명
                      ${result.availableCount === data.totalParticipants ? ' ✅' : ''}
                    </td>
                    <td style="padding: 10px; text-align: center;">${result.totalScore}점</td>
                    <td style="padding: 10px; color: #d32f2f; font-size: 12px;">
                      ${result.unavailableParticipants.length > 0
                        ? result.unavailableParticipants.map(p => p === 'HOST' ? '👑 호스트' : p).join(', ')
                        : '-'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${data.results.length > 20 ? `<p style="margin-top: 10px; color: #888; font-size: 14px;">상위 20개 날짜만 표시됩니다.</p>` : ''}
      </div>
    `;

    resultsEl.innerHTML = resultsHTML;
    resultsEl.style.display = 'block';
  } catch (error) {
    console.error('View date voting results error:', error);
    hideLoading();
    showMessage('투표 결과 조회 중 오류가 발생했습니다.');
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
      case 'setup-date-voting':
        showDateVotingSetup(meetingId);
        break;
      case 'view-date-voting-results':
        viewDateVotingResults(meetingId);
        break;
    }
  });
});
