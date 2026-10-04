
function remembered(key,fingerprint){let p;try{p=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}if(!p||p.fingerprint!==fingerprint)p={fingerprint,requestId:crypto.randomUUID()};sessionStorage.setItem(key,JSON.stringify(p));return p;}
import {rpc} from './rpc.js';import {ttsQuote} from './policy.mjs';
const $=id=>document.getElementById(id);let account=null,busy=false,pendingTts=null,pendingVideo=null;
const query=new URLSearchParams(location.search),callback=location.pathname==='/viewer-auth/callback';if(callback)history.replaceState(null,'','/');
const lb=v=>(v/1000).toFixed(2)+'lb';
function render(){
 $('account-summary').textContent=account?account.nickname+' · 보유 '+lb(account.balanceMilliLb)+' · 누적 '+lb(account.lifetimeMilliLb):'둘러보기는 연결 없이 자유롭게';
 $('connect-account').hidden=!!account;$('disconnect-account').hidden=!account;$('connect-account').disabled=busy;$('disconnect-account').disabled=busy;
 $('balance-row').hidden=!account;$('account-balance').textContent=account?lb(account.balanceMilliLb):'—';
 $('submit-tts').hidden=$('tts-panel').hidden;$('submit-video').hidden=$('video-panel').hidden;
 $('submit-tts').disabled=busy||ttsQuote($('message').value).cost===null;
 $('submit-video').disabled=busy||$('video-panel').dataset.ready!=='true'||$('video-panel').dataset.open!=='true';
}
async function connect(){const r=await rpc('login');location.assign(r.authorizeUrl);}
async function run(fn,{silent=false}={}){if(busy)return;busy=true;render();if(!silent){$('account-status').hidden=false;$('account-status').textContent='처리 중…';}try{await fn();}catch(e){if(e.status===401){account=null;pendingTts=null;pendingVideo=null;}if(!silent)$('account-status').textContent=e.message;}finally{busy=false;render();}}
$('connect-account').addEventListener('click',()=>run(connect));
$('disconnect-account').addEventListener('click',()=>run(async()=>{await rpc('logout');sessionStorage.removeItem('md-pending-tts');sessionStorage.removeItem('md-pending-video');account=null;pendingTts=null;pendingVideo=null;$('account-status').textContent='이 브라우저의 계정 연결을 해제했습니다.';}));
$('submit-tts').addEventListener('click',()=>run(async()=>{
 if(!account)return connect();
 const input={text:$('message').value,voice:$('voice').value,speakingRate:Number($('rate').value),pitch:Number($('pitch').value)},fingerprint=JSON.stringify(input);
 if(!pendingTts||pendingTts.fingerprint!==fingerprint)pendingTts=remembered('md-pending-tts',fingerprint);
 const r=await rpc('tts',{...input,requestId:pendingTts.requestId});account=r.account;
 if(!r.ok){const errors={locked:'누적 달가루 0.10lb부터 낭독할 수 있습니다.',insufficient_balance:'보유 달가루가 부족합니다.',cooldown:'90초 개인 쿨타임이 아직 지나지 않았습니다.'};$('account-status').textContent=errors[r.code]||'접수할 수 없습니다.';pendingTts=null;return;}
 $('account-status').textContent='낭독 #'+r.requestId+' '+(r.duplicate?'접수 확인':'접수 완료')+' · '+lb(r.chargedMilliLb);
}));
$('submit-video').addEventListener('click',()=>run(async()=>{
 if(!account)return connect();
 const input={url:$('video-url').value,uploadId:$('video-panel').dataset.uploadId||undefined,start:Number($('start').value),end:Number($('end').value)},fingerprint=JSON.stringify(input);
 if(!pendingVideo||pendingVideo.fingerprint!==fingerprint)pendingVideo=remembered('md-pending-video',fingerprint);
 const r=await rpc('video',{...input,requestId:pendingVideo.requestId});account=r.account;
 $('account-status').textContent='영상 #'+r.request.id+' 접수 확인 · '+lb(r.request.cost_milli_lb)+' 예약 · 실제 재생 시작 시 차감';
}));
for(const event of ['input','modechange','rangechange','videoready'])document.addEventListener(event,render);
render();void run(async()=>{
 if(callback){if(query.has('error'))throw Error('치지직 계정 연결이 취소됐습니다.');const r=await rpc('callback',{code:query.get('code'),state:query.get('state')});account=r.account??null;if(sessionStorage.getItem('moondust-pages-return')){location.replace('/connect');return;}$('account-status').textContent=r.broadcaster?'방송자 재인증을 완료했습니다.':'기존 달가루 계정에 연결했습니다.';}
 else{try{account=(await rpc('me')).account;}catch{account=null;}}
},{silent:!callback});
