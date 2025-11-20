function showJoinModal() {
  const modal = document.getElementById('joinModal');
  modal.classList.toggle('hidden');
}

function joinMeeting() {
  const code = document.getElementById('meetingCode').value.trim().toUpperCase();
  const errorMessage = document.getElementById('errorMessage');

  if (code.length !== 6) {
    errorMessage.textContent = '6자리 코드를 입력해주세요.';
    errorMessage.classList.remove('hidden');
    return;
  }

  // 모임 코드 확인 후 참가 페이지로 이동
  fetch(`/api/meetings/code/${code}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        window.location.href = `/join/${code}`;
      } else {
        errorMessage.textContent = '존재하지 않는 모임 코드입니다.';
        errorMessage.classList.remove('hidden');
      }
    })
    .catch(error => {
      errorMessage.textContent = '오류가 발생했습니다. 다시 시도해주세요.';
      errorMessage.classList.remove('hidden');
    });
}

// 엔터 키 및 버튼 클릭 이벤트
document.addEventListener('DOMContentLoaded', () => {
  const codeInput = document.getElementById('meetingCode');
  if (codeInput) {
    codeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        joinMeeting();
      }
    });
  }

  const showModalButton = document.querySelector('.btn-secondary');
  if (showModalButton && showModalButton.textContent.includes('참가자로 입장하기')) {
    showModalButton.addEventListener('click', showJoinModal);
  }

  const joinMeetingButton = document.querySelector('#joinModal .btn-primary');
  if (joinMeetingButton) {
    joinMeetingButton.addEventListener('click', joinMeeting);
  }
});
