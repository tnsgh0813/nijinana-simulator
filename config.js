/* Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹 </>) → "SDK 설정 및 구성"의 firebaseConfig 값을 그대로 붙여넣기.
   이 값들은 공개되어도 괜찮다 (데이터 보호는 firestore.rules가 담당). */
window.NJ_CONFIG={
  firebase:{
    apiKey:"",
    authDomain:"",
    projectId:"",
    storageBucket:"",
    messagingSenderId:"",
    appId:""
  }
};
