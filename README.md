# NIJISANJI 7 Colors Card Game Simulator (독립 사이트)

NIJISANJI 7 Colors Card Game 팬메이드 웹 대전 시뮬레이터.

- `index.html` — 시뮬레이터 본체 (claude.ai 아티팩트 버전과 같은 코드에서 빌드)
- `fb.js` — Firebase 연결 (Google 로그인 · Firestore 데이터 · 이미지)
- `config.js` — Firebase 프로젝트 설정 값
- `firestore.rules` — Firestore 보안 규칙 (Firebase 콘솔에 붙여넣기)
- `seed/` — claude.ai 버전에서 올린 카드 이미지 (관리자 화면 "기존 이미지 가져오기"로 한 번 옮김)

## 처음 설정

1. **Firebase 프로젝트** 만들기 (무료 Spark 요금제, Google 애널리틱스는 꺼도 됨)
2. 프로젝트 설정 → 내 앱 → 웹 앱(`</>`) 추가 → `firebaseConfig` 값을 `config.js`에 붙여넣기
3. Authentication → 로그인 방법 → **Google** 사용 설정
4. Authentication → 설정 → 승인된 도메인 → `<GitHub 아이디>.github.io` 추가
5. Firestore Database → 데이터베이스 만들기 (위치: `asia-northeast3 (서울)`, 프로덕션 모드)
6. Firestore → 규칙 탭 → `firestore.rules` 내용을 붙여넣고 게시
7. 사이트에서 Google로 한 번 로그인 → Authentication → 사용자 목록에서 내 **사용자 UID** 복사
8. Firestore → 컬렉션 시작 → 컬렉션 ID `admins` → 문서 ID에 내 UID → 필드 `ok` (boolean, true)
9. 사이트 새로고침 → 관리자 탭 → **기존 이미지 가져오기**

## 관리자

`admins/{uid}` 문서가 있는 계정만 관리자. 이메일은 공개 파일에 적지 않는다.
관리자를 추가하려면 그 사람이 한 번 로그인한 뒤, 그 사람의 UID로 `admins` 문서를 하나 더 만들면 된다.
