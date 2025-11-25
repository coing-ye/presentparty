# 🔍 검색 엔진 등록 가이드

Secret Santa Matcher를 구글과 네이버 검색에 노출시키는 방법입니다.

## ✅ 완료된 SEO 최적화

다음 항목들은 이미 적용되었습니다:

- ✅ 메타 태그 최적화 (description, keywords)
- ✅ Open Graph 태그 (카카오톡, SNS 공유)
- ✅ 구조화된 데이터 (Schema.org JSON-LD)
- ✅ robots.txt 생성
- ✅ sitemap.xml 생성
- ✅ 모바일 최적화
- ✅ 콘텐츠 최적화 (키워드 포함)
- ✅ H1, H2, H3 태그 구조화

---

## 📝 다음 단계: 검색 엔진 등록

### 1️⃣ 도메인 준비 (필수)

**중요**: 현재 `localhost:3000`으로 개발 중이므로, 검색 엔진에 등록하려면 먼저 **실제 도메인**이 필요합니다.

#### 도메인 옵션:

**A) 무료 호스팅 + 도메인**
- **Vercel** (추천): `your-app.vercel.app`
- **Netlify**: `your-app.netlify.app`
- **GitHub Pages**: `username.github.io/repo-name`
- **Firebase Hosting**: `your-app.web.app`

**B) 유료 도메인 (더 전문적)**
- **호스팅KR**: `.com` / `.co.kr` (1만원/년~)
- **가비아**: 도메인 + 호스팅
- **Cafe24**: 전자상거래 특화

---

### 2️⃣ Google Search Console 등록

#### Step 1: Google Search Console 접속
1. https://search.google.com/search-console 접속
2. Google 계정으로 로그인
3. "속성 추가" 클릭

#### Step 2: 도메인 소유권 확인
**방법 A: HTML 파일 업로드** (추천)
```bash
# Google이 제공하는 HTML 파일 다운로드
# public 폴더에 업로드
cp googleXXXXX.html public/
```

**방법 B: 메타 태그 추가**
```html
<!-- index.html의 <head>에 추가 -->
<meta name="google-site-verification" content="YOUR_CODE_HERE" />
```

#### Step 3: Sitemap 제출
1. Search Console > "Sitemaps" 메뉴
2. 사이트맵 URL 입력: `https://your-domain.com/sitemap.xml`
3. "제출" 클릭

#### Step 4: URL 색인 요청
1. Search Console > "URL 검사" 도구
2. 메인 페이지 URL 입력
3. "색인 생성 요청" 클릭

**예상 소요 시간**: 2일 ~ 2주

---

### 3️⃣ Naver Search Advisor 등록

#### Step 1: Naver Search Advisor 접속
1. https://searchadvisor.naver.com 접속
2. 네이버 계정으로 로그인
3. "웹마스터 도구" 선택

#### Step 2: 사이트 등록 및 소유 확인
**방법 A: HTML 파일 업로드**
```bash
# 네이버가 제공하는 HTML 파일 다운로드
# public 폴더에 업로드
cp naverXXXXX.html public/
```

**방법 B: 메타 태그 추가**
```html
<!-- index.html의 <head>에 추가 -->
<meta name="naver-site-verification" content="YOUR_CODE_HERE" />
```

#### Step 3: Sitemap 제출
1. 웹마스터 도구 > "요청" > "사이트맵 제출"
2. 사이트맵 URL 입력: `https://your-domain.com/sitemap.xml`

#### Step 4: RSS 제출 (선택)
1. "요청" > "RSS 제출"
2. RSS URL 입력 (있다면)

**예상 소요 시간**: 1주 ~ 4주

---

### 4️⃣ robots.txt 및 sitemap.xml 수정

배포 후, 파일 내용을 실제 도메인으로 변경하세요:

**public/robots.txt**
```txt
# robots.txt

User-agent: *
Allow: /

Disallow: /assets/
Disallow: /api/

User-agent: Yeti
Allow: /

User-agent: Googlebot
Allow: /

# 실제 도메인으로 변경!
Sitemap: https://your-domain.com/sitemap.xml
```

**public/sitemap.xml**
```xml
<!-- 모든 localhost:3000을 실제 도메인으로 변경 -->
<loc>https://your-domain.com/</loc>
<loc>https://your-domain.com/host/login.html</loc>
<!-- ... -->
```

---

## 🚀 빠른 배포 가이드 (Vercel 추천)

### Vercel에 배포하기

#### 1. GitHub에 코드 푸시
```bash
git add .
git commit -m "SEO 최적화 완료"
git push origin main
```

#### 2. Vercel 계정 생성 및 연동
1. https://vercel.com 접속
2. GitHub 계정으로 가입
3. "New Project" 클릭
4. GitHub 저장소 선택
5. "Deploy" 클릭

#### 3. 환경 변수 설정
- `.env` 파일 내용을 Vercel 대시보드의 "Environment Variables"에 추가
- Firebase 설정 등

#### 4. 배포 완료!
- 자동으로 `your-project.vercel.app` 도메인 생성
- HTTPS 자동 적용
- 무료!

---

## 📊 SEO 성과 확인

### Google Analytics 설치 (선택)

**index.html의 `<head>`에 추가:**
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 확인할 지표
- **유입 키워드**: 어떤 검색어로 들어오는가?
- **클릭률 (CTR)**: 검색 결과에서 클릭되는 비율
- **체류 시간**: 사용자가 얼마나 머무는가?
- **이탈률**: 바로 나가는 비율

---

## 💡 추가 SEO 팁

### 1. 블로그/커뮤니티 홍보
- 개발자 커뮤니티 (Reddit, Stack Overflow)
- 한국 커뮤니티 (Okky, 클리앙, 디시인사이드)
- SNS (Twitter, Facebook, Instagram)

### 2. 백링크 확보
- GitHub README에 링크 추가
- Product Hunt 등록
- 블로그 포스팅 작성

### 3. 콘텐츠 업데이트
- 정기적으로 새로운 기능 추가
- 블로그 섹션 추가 (사용 가이드, 팁 등)
- 사용자 리뷰 섹션

### 4. 페이지 속도 최적화
- 이미지 압축
- CSS/JS 최소화
- CDN 사용

---

## 🎯 목표 키워드 순위 체크

주기적으로 확인할 키워드:

✅ 마니또
✅ 마니또매처
✅ 마니또매칭
✅ 시크릿산타
✅ 약속일정
✅ 날짜투표
✅ 모임날짜정하기
✅ 파티준비
✅ 송년회마니또

---

## ❓ FAQ

### Q: 언제쯤 검색에 노출되나요?
**A**: Google 2일~2주, Naver 1주~4주 소요됩니다.

### Q: 검색 순위를 더 올리려면?
**A**:
1. 콘텐츠 품질 향상 (더 많은 설명, 가이드)
2. 백링크 확보 (다른 사이트에서 링크)
3. 사용자 체류 시간 증가 (좋은 UX)
4. 소셜 미디어 공유

### Q: 로컬 환경에서 테스트 가능한가요?
**A**: SEO 태그는 로컬에서도 확인 가능하지만, 실제 검색 엔진 등록은 **배포 후**에만 가능합니다.

### Q: 무료로 할 수 있나요?
**A**: 네! Vercel/Netlify 무료 플랜 + Google/Naver 등록 무료입니다.

---

## 📞 도움이 필요하면

- Google Search Console 도움말: https://support.google.com/webmasters
- Naver Search Advisor 도움말: https://searchadvisor.naver.com/guide

---

**준비 완료!** 이제 배포하고 검색 엔진에 등록하면 됩니다! 🚀
