/* Firebase 프로젝트 설정 (공개되어도 괜찮은 값 — 데이터 보호는 firestore.rules가 담당) */
window.NJ_CONFIG={
  firebase:{
    apiKey:"AIzaSyD3xk1P-72JdACN4hEaYv8i-SsBZ2gokV0",
    authDomain:"nijisanji-simulator.firebaseapp.com",
    projectId:"nijisanji-simulator",
    storageBucket:"nijisanji-simulator.firebasestorage.app",
    messagingSenderId:"28304075336",
    appId:"1:28304075336:web:893485a1afa57ac4d0067d",
    measurementId:"G-LSTYXJ2R78"
  },
  // 멀티 대전 연결 중계 서버 (선택). 비워 두면 Google 공개 STUN만 사용.
  // 연결 실패가 잦으면 TURN 서비스 주소를 넣으면 됨. 예) {urls:'turn:주소:3478',username:'아이디',credential:'비밀번호'}
  iceServers:[]
};
