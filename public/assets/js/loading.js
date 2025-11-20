/**
 * 로딩 유틸리티
 * API 요청 중 사용자에게 시각적 피드백 제공
 */

// 로딩 오버레이 HTML
const createLoadingOverlay = (message, subtext) => {
  return `
    <div id="loadingOverlay" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">${message}</div>
        ${subtext ? `<div class="loading-subtext">${subtext}</div>` : ''}
      </div>
    </div>
  `;
};

/**
 * 로딩 표시
 * @param {string} message - 메인 메시지
 * @param {string} subtext - 서브 메시지 (선택)
 */
function showLoading(message = '처리 중...', subtext = '') {
  // 기존 로딩 제거
  hideLoading();

  // 로딩 오버레이 추가
  document.body.insertAdjacentHTML('beforeend', createLoadingOverlay(message, subtext));
}

/**
 * 로딩 숨김
 */
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.remove();
  }
}

/**
 * 버튼 로딩 상태 설정
 * @param {HTMLElement} button - 버튼 요소
 * @param {boolean} loading - 로딩 여부
 */
function setButtonLoading(button, loading) {
  if (loading) {
    button.disabled = true;
    button.classList.add('btn-loading');
    button.dataset.originalText = button.textContent;
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  }
}

/**
 * API 요청 래퍼 (자동 로딩 표시)
 * @param {Function} apiCall - API 호출 함수
 * @param {string} loadingMessage - 로딩 메시지
 * @param {string} subtext - 서브 텍스트
 * @param {boolean} showOverlay - 오버레이 표시 여부 (기본: true)
 * @returns {Promise} API 응답
 */
async function withLoading(apiCall, loadingMessage = '처리 중...', subtext = '', showOverlay = true) {
  try {
    if (showOverlay) {
      showLoading(loadingMessage, subtext);
    }
    const result = await apiCall();
    return result;
  } finally {
    if (showOverlay) {
      hideLoading();
    }
  }
}

/**
 * 첫 방문 안내 메시지 (Render.com 콜드 스타트 안내)
 */
function showFirstVisitNotice() {
  const hasVisited = sessionStorage.getItem('hasVisited');

  if (!hasVisited) {
    showLoading(
      '서버 연결 중...',
      '첫 방문 시 서버 시작에 10-20초가 소요될 수 있습니다.'
    );
    sessionStorage.setItem('hasVisited', 'true');

    // 20초 후에도 로딩 중이면 추가 안내
    setTimeout(() => {
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) {
        overlay.querySelector('.loading-subtext').textContent =
          '조금만 더 기다려주세요... 서버가 곧 준비됩니다.';
      }
    }, 10000);
  }
}

// 전역 함수로 export
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.setButtonLoading = setButtonLoading;
window.withLoading = withLoading;
window.showFirstVisitNotice = showFirstVisitNotice;
