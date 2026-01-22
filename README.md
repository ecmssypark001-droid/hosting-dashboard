# 🎯 호스팅팀 업무 관리 시스템

Google Sheets 기반의 통합 업무 관리 대시보드 + Slack 자동 등록 시스템

## 📋 주요 기능

### ✅ 웹 대시보드
- **업무 현황**: 팀 전체 및 개인별 업무 현황 실시간 조회
- **자동화 관리**: 업무 자동화 프로젝트 추적 및 효율성 측정
- **템플릿 관리**: 팀 공통 프롬프트 템플릿 관리
- **CRUD 지원**: 웹에서 직접 생성/수정/삭제 가능
- **Google Sheets 연동**: 기존 데이터 불러오기 및 실시간 동기화

### 🤖 Slack 자동 등록
- **멘션 감지**: 호스팅팀 관련 멘션 자동 감지
- **미답변 판정**: 3초 후 답변 없으면 자동 업무 등록
- **이모지 등록**: 📌 이모지로 간편하게 업무 등록
- **슬래시 커맨드**: `/업무추가` 명령어로 수동 등록
- **자동 담당자 배정**: 라운드로빈 방식 자동 배정

---

## 🚀 설정 가이드

### 1️⃣ Google Sheets 설정

#### 1.1 스프레드시트 준비
1. [Google Sheets](https://docs.google.com/spreadsheets/d/1TmLfBe2SCTRfbzbBRnN3F8x1NDN82BABuAr01U97Boc/edit) 열기
2. 다음 시트 생성:
   - `업무관리`
   - `자동화관리`
   - `템플릿`

#### 1.2 Apps Script 배포
1. **확장 프로그램** > **Apps Script** 클릭
2. `google-apps-script.js` 파일 내용 전체 복사
3. Apps Script 에디터에 붙여넣기
4. **배포** > **새 배포** 클릭
5. 설정:
   - **유형**: 웹 앱
   - **액세스 권한**: 모든 사용자
6. **배포** 클릭
7. **웹 앱 URL** 복사 (이것이 `WEBAPP_URL`입니다)

#### 1.3 테스트
```javascript
// Apps Script 에디터에서 실행
function testGetData() {
  const result = doGet({});
  Logger.log(result.getContent());
}
```

---

### 2️⃣ 웹 대시보드 설정

#### 2.1 index.html 수정
`index.html` 파일에서 `WEBAPP_URL` 변경:

```javascript
const WEBAPP_URL = '여기에_배포된_웹앱_URL_붙여넣기';
```

#### 2.2 GitHub Pages 배포 (선택)
```bash
# 1. GitHub에 푸시
git add .
git commit -m "Add hosting dashboard"
git push

# 2. GitHub 저장소 Settings
# 3. Pages 섹션에서 Source 설정: Branch (main), Folder (root)
# 4. 배포 완료 후 URL 확인
```

#### 2.3 로컬 테스트
```bash
# 간단한 HTTP 서버 실행
python -m http.server 8000

# 브라우저에서 열기
open http://localhost:8000
```

---

### 3️⃣ Slack 봇 설정

#### 3.1 Slack App 생성
1. [Slack API](https://api.slack.com/apps) 접속
2. **Create New App** > **From scratch**
3. 앱 이름: `호스팅팀 업무봇`
4. Workspace 선택

#### 3.2 권한 설정 (OAuth & Permissions)
다음 Bot Token Scopes 추가:
- `app_mentions:read` - 멘션 읽기
- `channels:history` - 채널 메시지 읽기
- `channels:read` - 채널 정보 읽기
- `chat:write` - 메시지 전송
- `reactions:read` - 리액션 읽기
- `users:read` - 사용자 정보 읽기
- `commands` - 슬래시 커맨드

#### 3.3 Event Subscriptions 활성화
1. **Event Subscriptions** 메뉴로 이동
2. **Enable Events** ON
3. Subscribe to bot events:
   - `app_mention`
   - `message.channels`
   - `reaction_added`

#### 3.4 Socket Mode 활성화 (권장)
1. **Socket Mode** 메뉴로 이동
2. **Enable Socket Mode** ON
3. App-Level Token 생성 (`xapp-...`)
4. Token 이름: `socket-token`

#### 3.5 Slash Commands 추가
1. **Slash Commands** 메뉴로 이동
2. **Create New Command**
   - Command: `/업무추가`
   - Description: `새 업무 등록`
   - Usage Hint: `[제목] | [담당자] | [마감일]`

#### 3.6 Workspace에 설치
1. **Install App** 메뉴로 이동
2. **Install to Workspace** 클릭
3. 권한 승인

#### 3.7 토큰 복사
- **Bot User OAuth Token** 복사 (`xoxb-...`)
- **App-Level Token** 복사 (`xapp-...`)

---

### 4️⃣ Slack 봇 실행

#### 4.1 환경 변수 설정
`.env` 파일 수정:

```env
# Slack 토큰
SLACK_TOKEN=xoxb-여기에_Bot_Token_붙여넣기
SLACK_APP_TOKEN=xapp-여기에_App_Level_Token_붙여넣기

# 기타 설정 (기존 유지)
ANTHROPIC_API_KEY=...
```

#### 4.2 의존성 설치
```bash
pip install -r requirements.txt
```

#### 4.3 봇 실행
```bash
python slack_task_bot.py
```

성공 시 출력:
```
🚀 호스팅팀 업무 자동 등록 봇 시작...
📡 연결 대기 중...
⚡️ Bolt app is running!
```

#### 4.4 백그라운드 실행 (Linux/Mac)
```bash
# nohup으로 백그라운드 실행
nohup python slack_task_bot.py > slack_bot.log 2>&1 &

# 프로세스 확인
ps aux | grep slack_task_bot

# 로그 확인
tail -f slack_bot.log
```

---

## 📖 사용 방법

### 웹 대시보드에서 업무 추가
1. 대시보드 접속
2. **새 업무 추가** 버튼 클릭
3. 폼 작성 후 저장
4. Google Sheets에 자동 저장됨

### Slack에서 자동 업무 등록

#### 방법 1: 멘션 감지
```
@호스팅팀 서버 점검 일정 공유 부탁드립니다
```
→ 3초 후 답변 없으면 자동 등록

#### 방법 2: 이모지 리액션
메시지에 📌 (:pushpin:) 이모지 추가
→ 즉시 업무 등록

#### 방법 3: 슬래시 커맨드
```
/업무추가 도메인 이관 작업 | 정혜인 | 2026-02-15
```

### 알림 예시
```
✅ 업무가 자동 등록되었습니다!
📋 내용: 서버 점검 일정 공유 부탁드립니다
👤 담당자: 박슬예
⚡ 긴급도: 보통

대시보드에서 확인하세요: https://hosting-dashboard.pages.dev
```

---

## 🔧 고급 설정

### 채널 ID 확인 방법
1. Slack에서 채널 우클릭
2. **링크 복사**
3. URL 끝 부분이 채널 ID (예: `C01234ABCDE`)

### 사용자 ID 확인 방법
1. 프로필 클릭
2. **더보기** > **프로필 복사**
3. ID가 포함됨 (예: `U01234ABCDE`)

### slack_task_bot.py 수정
```python
# 호스팅팀 관련 채널 목록
HOSTING_CHANNELS = [
    'C07HBKBGQN1',  # #호스팅-관리 (실제 ID로 변경)
    'C07JKLMNOPQ',  # #센터-운영
]

# 담당자 목록
ASSIGNEE_LIST = ['박슬예', '정혜인', '김수인', '이엄지', '김태훈']
```

---

## 🛠 문제 해결

### 1. 웹 대시보드가 데이터를 못 불러옴
- Google Apps Script 배포 URL 확인
- 웹 앱 액세스 권한 "모든 사용자"로 설정되었는지 확인
- 브라우저 콘솔(F12)에서 에러 메시지 확인

### 2. Slack 봇이 응답 안함
- `.env` 파일에 토큰이 제대로 설정되었는지 확인
- Socket Mode가 활성화되었는지 확인
- 봇이 채널에 초대되었는지 확인: `/invite @호스팅팀업무봇`

### 3. 업무가 Google Sheets에 추가 안됨
- Apps Script 실행 권한 확인
- 스프레드시트 ID가 올바른지 확인
- Apps Script 로그 확인: **실행** > **내 실행**

---

## 📊 데이터 구조

### 업무관리 시트
| 컬럼 | 설명 |
|------|------|
| ID | 고유 ID |
| 내용 | 업무 제목 |
| 담당자 | 담당자 이름 |
| 상태 | 시작전/진행중/완료/보류 |
| 긴급도 | 보통/높음/긴급 |
| 마감일 | YYYY-MM-DD |
| 구분 | 카테고리 |
| 생성일 | ISO 8601 |
| Slack 링크 | 메시지 URL (Slack 등록 시) |

### 자동화관리 시트
| 컬럼 | 설명 |
|------|------|
| ID | 고유 ID |
| 제목 | 프로젝트명 |
| 설명 | 상세 설명 |
| 상태 | in_progress/completed |
| 효율성(%) | 0-100 |
| 절감시간(h) | 월 단위 |
| 시작일 | YYYY-MM-DD |

### 템플릿 시트
| 컬럼 | 설명 |
|------|------|
| ID | 고유 ID |
| 제목 | 템플릿명 |
| 설명 | 간단한 설명 |
| 카테고리 | 분류 |
| 내용 | 템플릿 본문 |

---

## 🎨 커스터마이징

### 팀원 정보 변경
`index.html`에서:
```javascript
const MEMBERS = [
    { name: '박슬예', role: '팀장', avatar: '박', color: 'from-blue-500 to-blue-600' },
    { name: '정혜인', role: '파트장', avatar: '정', color: 'from-purple-500 to-purple-600' },
    // 추가/수정
];
```

### 긴급도 자동 감지 키워드 추가
`slack_task_bot.py`에서:
```python
def extract_task_info(text):
    task_info = {'content': text, 'priority': '보통'}

    if any(keyword in text for keyword in ['긴급', '급함', '빨리', '즉시', 'ASAP']):
        task_info['priority'] = '긴급'
    # 키워드 추가 가능
```

---

## 📝 라이선스

MIT License

---

## 🤝 기여

이슈 및 개선 제안 환영합니다!

1. Fork this repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📧 문의

호스팅팀 업무 관리 시스템 관련 문의: [team@example.com]

---

**Made with ❤️ by 호스팅팀**
