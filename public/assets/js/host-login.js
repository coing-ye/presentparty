// 폼 전환
function showRegisterForm() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.remove('hidden');
  document.getElementById('message').classList.add('hidden');
}

function showLoginForm() {
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('message').classList.add('hidden');
}

// 메시지 표시
function showMessage(text, type = 'error') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message message-${type}`;
  messageEl.classList.remove('hidden');
}

// 로그인
async function login() {
  const hostId = document.getElementById('hostId').value.trim();
  const password = document.getElementById('password').value;

  if (!hostId || !password) {
    showMessage('ID와 비밀번호를 입력해주세요.');
    return;
  }

  try {
    showLoading('로그인 중...', '잠시만 기다려주세요');

    const response = await fetch('/api/host/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostId, password }),
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      // 로그인 성공 - 호스트 ID를 세션 스토리지에 저장
      sessionStorage.setItem('hostId', data.hostId);
      showMessage('로그인 성공! 대시보드로 이동합니다...', 'success');

      showLoading('대시보드로 이동 중...', '');
      setTimeout(() => {
        window.location.href = '/host/dashboard';
      }, 1000);
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    hideLoading();
    showMessage('로그인 중 오류가 발생했습니다.');
  }
}

// 회원가입
async function register() {
  const hostId = document.getElementById('newHostId').value.trim();
  const password = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!hostId || !password || !confirmPassword) {
    showMessage('모든 필드를 입력해주세요.');
    return;
  }

  if (password.length < 6) {
    showMessage('비밀번호는 6자 이상이어야 합니다.');
    return;
  }

  if (password !== confirmPassword) {
    showMessage('비밀번호가 일치하지 않습니다.');
    return;
  }

  try {
    showLoading('회원가입 중...', '잠시만 기다려주세요');

    const response = await fetch('/api/host/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostId, password }),
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      showMessage('회원가입 성공! 로그인해주세요.', 'success');
      setTimeout(() => {
        showLoginForm();
        document.getElementById('hostId').value = hostId;
      }, 1500);
    } else {
      showMessage(data.message);
    }
  } catch (error) {
    console.error('Register error:', error);
    hideLoading();
    showMessage('회원가입 중 오류가 발생했습니다.');
  }
}

// 엔터 키 및 버튼 클릭 이벤트
document.addEventListener('DOMContentLoaded', () => {
    // 버튼과 링크 요소를 선택
    const loginButton = document.querySelector('#loginForm .btn-primary');
    const registerLink = document.querySelector('#loginForm a.link');
    const registerButton = document.querySelector('#registerForm .btn-primary');
    const loginLink = document.querySelector('#registerForm a.link');

    // 이벤트 리스너 할당
    if (loginButton) {
        loginButton.addEventListener('click', login);
    }
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterForm();
        });
    }
    if (registerButton) {
        registerButton.addEventListener('click', register);
    }
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }

    // 로그인 폼
    document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
    });

    // 회원가입 폼
    document.getElementById('confirmPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') register();
    });
});
