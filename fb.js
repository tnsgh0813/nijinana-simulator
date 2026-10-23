/* にじなな 시뮬레이터 — 독립 사이트용 Firebase 연결
   시뮬레이터 본체는 claude.ai의 window.claude.use('db'|'user'|'assets') 형식으로 작성되어 있어서,
   여기서 같은 모양의 함수를 Firebase(Auth + Firestore)로 만들어 준다.
   - 로그인: Google
   - 데이터: Firestore (cardart/*, carddata/*, data/users/{uid}/…)
   - 이미지: Firestore 'img' 컬렉션에 base64로 저장 (무료 Spark 요금제에서 동작) + 브라우저 캐시 */
(function(){
  'use strict';
  // 다른 사이트가 이 페이지를 몰래 iframe으로 띄워 클릭을 유도하는 것(클릭재킹) 차단
  if(window.top!==window.self){try{window.top.location.replace(location.href)}catch(e){}document.documentElement.style.display='none';return}
  const C=window.NJ_CONFIG||{};
  const V='10.12.2';
  const SDK=n=>`https://www.gstatic.com/firebasejs/${V}/firebase-${n}.js`;
  let ready=null;
  function load(){
    if(ready)return ready;
    ready=(async()=>{
      if(!C.firebase||!C.firebase.apiKey)throw new Error('config.js에 Firebase 설정이 없음');
      const [app,auth,fs]=await Promise.all([import(SDK('app')),import(SDK('auth')),import(SDK('firestore'))]);
      const A=app.initializeApp(C.firebase);
      const au=auth.getAuth(A);
      const db=fs.getFirestore(A);
      const user=await new Promise(res=>{const un=auth.onAuthStateChanged(au,u=>{un();res(u)})});
      // 관리자 = Firestore admins/{uid} 문서가 있는 계정 (이메일을 공개 파일에 적지 않음)
      let admin=false;if(user){try{admin=(await fs.getDoc(fs.doc(db,'admins/'+user.uid))).exists()}catch(e){admin=false}}
      return{auth,au,fs,db,user,admin};
    })();
    return ready;
  }

  /* ---- db: claude 'db' 모양 ---- */
  const wrap=s=>({exists:s.exists(),id:s.id,data:()=>s.data()});
  function mkDoc(F,path){const r=F.fs.doc(F.db,path);return{
    onSnapshot:(cb,err)=>F.fs.onSnapshot(r,s=>cb(wrap(s)),e=>{console.warn(path,e);err&&err(e)}),
    get:async()=>wrap(await F.fs.getDoc(r)),
    set:v=>F.fs.setDoc(r,v).catch(e=>{throw codeErr(e)}),
    delete:()=>F.fs.deleteDoc(r).catch(e=>{throw codeErr(e)}),
    collection:n=>mkCol(F,path+'/'+n)}}
  function mkCol(F,path){const r=F.fs.collection(F.db,path);return{
    doc:id=>mkDoc(F,path+'/'+id),
    onSnapshot:(cb,err)=>F.fs.onSnapshot(r,qs=>cb({docs:qs.docs.map(wrap)}),e=>{console.warn(path,e);err&&err(e)})}}
  function codeErr(e){const x=new Error(e&&e.message||String(e));x.code=e&&e.code==='permission-denied'?'not_granted':(e&&e.code)||'store_unavailable';return x}

  /* ---- 이미지: Firestore img/{id} {d: base64, t: type} ---- */
  const CACHE='nj-img-v1';const URLS={},PEND={};let rr=0;
  const BLANK='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  const rid=()=>[...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join('');
  async function b64(blob){const u=new Uint8Array(await blob.arrayBuffer());let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)}
  // 이미지로 허용하는 형식만 (text/html 등이 섞여 있어도 이미지로만 취급)
  const IMG_T=['image/webp','image/png','image/jpeg','image/gif'];
  const safeT=t=>IMG_T.includes(t)?t:'image/webp';
  function unb64(d,t){t=safeT(t);const bin=atob(d);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:t||'image/webp'})}
  async function cachePut(id,blob){try{const c=await caches.open(CACHE);await c.put('./__img/'+id,new Response(blob,{headers:{'Content-Type':blob.type}}))}catch(e){}}
  async function cacheGet(id){try{const c=await caches.open(CACHE);const r=await c.match('./__img/'+id);if(!r)return null;const bl=await r.blob();return IMG_T.includes(bl.type)?bl:new Blob([bl],{type:'image/webp'})}catch(e){return null}}
  async function fetchImg(id){
    const hit=await cacheGet(id);if(hit)return hit; // 이미지 id는 바뀌지 않으므로 한 번 받으면 다시 받지 않음
    const F=await load();const s=await F.fs.getDoc(F.fs.doc(F.db,'img/'+id));
    if(!s.exists())throw new Error('없는 이미지');const v=s.data();if(!v||typeof v.d!=='string')throw new Error('잘못된 이미지');const blob=unb64(v.d,v.t);cachePut(id,blob);return blob;
  }
  function bump(){clearTimeout(rr);rr=setTimeout(()=>{try{window.rerenderAll&&window.rerenderAll()}catch(e){}},60)}
  window.__imgUrl=id=>{
    if(URLS[id])return URLS[id];
    if(!PEND[id])PEND[id]=fetchImg(id).then(b=>{URLS[id]=URL.createObjectURL(b);
      // 다시 그려지지 않는 화면(인트로 연출 등)의 빈 이미지도 바로 교체
      try{document.querySelectorAll('img[data-art="'+id+'"]').forEach(i=>{if(i.src===BLANK)i.src=URLS[id]})}catch(e){}
      bump()}).catch(()=>{URLS[id]='data:,';bump()});
    return BLANK;
  };
  // 다 받아질 때까지 기다리는 버전 (대전 시작 전 로딩 확인용)
  window.__imgLoad=id=>URLS[id]?Promise.resolve(URLS[id]):(window.__imgUrl(id),PEND[id].then(()=>URLS[id]));
  const MAXB=700*1024; // Firestore 문서 1MB 제한 안쪽
  async function putImg(F,id,blob){
    if(blob.size>MAXB){const e=new Error('too large');e.code='too_large';throw e}
    if(blob.type&&!IMG_T.includes(blob.type)){const e=new Error('bad type');e.code='bad_type';throw e}
    await F.fs.setDoc(F.fs.doc(F.db,'img/'+id),{d:await b64(blob),t:safeT(blob.type),s:blob.size,at:Date.now()}).catch(e=>{throw codeErr(e)});
    cachePut(id,blob);URLS[id]=URL.createObjectURL(blob);
  }
  const assetsFor=F=>Object.freeze({
    upload:async(blob)=>{const id=rid();await putImg(F,id,blob);return{id,url:URLS[id],sizeBytes:blob.size,contentType:blob.type}},
    delete:async id=>{await F.fs.deleteDoc(F.fs.doc(F.db,'img/'+id)).catch(e=>{throw codeErr(e)});return{deleted:true}},
    list:async()=>({assets:[],usage:null})
  });

  /* ---- 기존(claude.ai에서 올린) 이미지 가져오기: seed/seed.json + seed/*.webp ---- */
  async function seed(progress){
    const F=await load();if(!F.admin)throw new Error('관리자 권한 필요');
    const r=await fetch('seed/seed.json',{cache:'no-store'});if(!r.ok)throw new Error('seed.json 없음');const S=await r.json();
    const cm=await F.fs.getDoc(F.fs.doc(F.db,'cardart/map'));const ct=await F.fs.getDoc(F.fs.doc(F.db,'cardart/thumbs'));
    const curM=cm.exists()?cm.data():{},curT=ct.exists()?ct.data():{};
    const ids=[...new Set([...Object.values(S.map||{}),...Object.values(S.thumbs||{}).map(x=>x.t)])];let n=0,k=0;
    for(const id of ids){k++;
      const ex=await F.fs.getDoc(F.fs.doc(F.db,'img/'+id));
      if(!ex.exists()){const b=await fetch('seed/'+id+'.webp',{cache:'no-store'});if(b.ok){await putImg(F,id,await b.blob());n++}}
      progress&&progress(`기존 이미지 가져오는 중… ${k}/${ids.length}`)}
    // 기존 목록과 합침 (seed에 있는 칸은 seed 값으로), 교체된 예전 이미지는 지움
    const old=[];for(const [slot,id] of Object.entries(S.map||{})){if(curM[slot]&&curM[slot]!==id){old.push(curM[slot]);if(curT[slot]&&curT[slot].t)old.push(curT[slot].t)}}
    await F.fs.setDoc(F.fs.doc(F.db,'cardart/map'),{...curM,...(S.map||{})});
    await F.fs.setDoc(F.fs.doc(F.db,'cardart/thumbs'),{...curT,...(S.thumbs||{})});
    const keep=new Set(ids);for(const id of old)if(!keep.has(id))await F.fs.deleteDoc(F.fs.doc(F.db,'img/'+id)).catch(()=>{});
    return Object.keys(S.map||{}).length;
  }

  window.claude={
    standalone:true,
    use:async name=>{
      let F;try{F=await load()}catch(e){console.error(e);return null}
      if(name==='db')return Object.freeze({doc:p=>mkDoc(F,p),collection:p=>mkCol(F,p)});
      if(name==='user'){const u=F.user;const me={id:u?u.uid:null,name:u?(u.displayName||u.email||''):'',avatarUrl:(u&&u.photoURL)||'',color:'#d6337a',email:u?u.email:null,isOwner:F.admin,canEdit:F.admin};
        return Object.freeze({id:async()=>me.id,me:async()=>me,canEdit:async()=>me.canEdit,isOwner:async()=>me.isOwner,can:async()=>null})}
      if(name==='assets')return F.admin?assetsFor(F):null;
      return null;
    },
    auth:{
      login:async()=>{const F=await load();await F.auth.signInWithPopup(F.au,new F.auth.GoogleAuthProvider());location.reload()},
      logout:async()=>{const F=await load();await F.auth.signOut(F.au);location.reload()}
    },
    seed
  };
})();
