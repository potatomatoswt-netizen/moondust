import {rpc} from './rpc.js';import {ttsQuote} from './policy.mjs';
const $=id=>document.getElementById(id),key='md-submit-intent';let account=null,busy=false,connecting=true;
const lb=v=>(v/1000).toFixed(2)+'lb';
function status(text){$('account-status').hidden=false;$('account-status').textContent=text;}
function render(){
 $('account-summary').textContent=account?account.nickname+' · 보유 '+lb(account.balanceMilliLb)+' · 누적 '+lb(account.lifetimeMilliLb):connecting?'기존 달가루 계정 확인 중…':'둘러보기는 연결 없이 자유롭게';
 $('connect-account').hidden=!!account;$('disconnect-account').hidden=!account;$('connect-account').disabled=busy;$('disconnect-account').disabled=busy;
 $('balance-row').hidden=!account;$('account-balance').textContent=account?lb(account.balanceMilliLb):'—';
 $('submit-tts').hidden=$('tts-panel').hidden;$('submit-video').hidden=$('video-panel').hidden;
 $('submit-tts').disabled=busy||ttsQuote($('message').value).cost===null;
 $('submit-video').disabled=busy||$('video-panel').dataset.ready!=='true'||$('video-panel').dataset.open!=='true';
 $('submit-tts').textContent=busy?'접수 확인 중…':'내 달가루로 낭독 신청';
}
function pending(){try{const p=JSON.parse(sessionStorage.getItem(key)||'null');if(p&&['tts','video'].includes(p.action)&&Date.now()-p.at<10*60000)return p;}catch{}sessionStorage.removeItem(key);return null;}
const initial=(async()=>{try{account=(await rpc('me')).account;}catch(e){if(e.status!==401)status(e.message);}finally{connecting=false;render();}})();
async function submit(intent){
 if(busy)return;busy=true;status('신청을 확인하고 있습니다. 다시 누르지 않아도 됩니다.');render();
 try{
  await initial;
  if(!account){status('계정 연결 후 이 신청을 자동으로 이어갑니다.');return await rpc('login');}
  const r=await rpc(intent.action,intent.input);account=r.account;
  if(intent.action==='tts'){
   if(!r.ok){const errors={locked:'누적 달가루 0.10lb부터 낭독할 수 있습니다.',insufficient_balance:'보유 달가루가 부족합니다.',cooldown:'90초 개인 쿨타임이 아직 지나지 않았습니다.'};status(errors[r.code]||'접수할 수 없습니다.');}
   else status('낭독 #'+r.requestId+' '+(r.duplicate?'접수 확인':'접수 완료')+' · '+lb(r.chargedMilliLb)+' · 재생 대기열로 전달했습니다.');
  }else status('영상 #'+r.request.id+' 접수 확인 · '+lb(r.request.cost_milli_lb)+' 예약 · 실제 재생 시작 시 차감');
  sessionStorage.removeItem(key);
 }catch(e){
  if(e.redirecting)return;
  if(e.status===401){account=null;status('계정 연결을 갱신한 뒤 이 신청을 이어갑니다.');return await rpc('login').catch(error=>{if(!error.redirecting)status(error.message);});}
  status(e.message+' 같은 신청을 다시 누르면 중복 차감 없이 확인합니다.');
  if(e.status>=400&&e.status<500)sessionStorage.removeItem(key);
 }finally{busy=false;render();}
}
function request(action,input){const previous=pending(),fingerprint=JSON.stringify({action,input});const intent=previous?.fingerprint===fingerprint?previous:{action,input:{...input,requestId:crypto.randomUUID()},fingerprint,at:Date.now()};sessionStorage.setItem(key,JSON.stringify(intent));void submit(intent);}
$('submit-tts').addEventListener('click',()=>request('tts',{text:$('message').value,voice:$('voice').value,speakingRate:Number($('rate').value),pitch:Number($('pitch').value)}));
$('submit-video').addEventListener('click',()=>request('video',{url:$('video-url').value,uploadId:$('video-panel').dataset.uploadId||undefined,start:Number($('start').value),end:Number($('end').value)}));
$('connect-account').addEventListener('click',()=>{status('기존 치지직 계정에 연결하고 있습니다.');void rpc('login').catch(e=>{if(!e.redirecting)status(e.message);});});
$('disconnect-account').addEventListener('click',async()=>{if(busy)return;busy=true;render();try{await rpc('logout');account=null;sessionStorage.removeItem(key);status('이 브라우저의 계정 연결을 해제했습니다.');}catch(e){status(e.message);}finally{busy=false;render();}});
for(const event of ['input','modechange','rangechange','videoready'])document.addEventListener(event,render);
render();void initial.then(()=>{const p=pending();if(p&&account&&!busy)void submit(p);});
