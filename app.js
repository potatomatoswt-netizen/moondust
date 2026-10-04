import {ttsQuote,videoCommand} from './policy.mjs';
const $=id=>document.getElementById(id);let mode='tts';
function update(){
 $('rate-value').textContent=Number($('rate').value).toFixed(2)+'배';$('pitch-value').textContent=$('pitch').value+' 반음';let cost=null;const isTts=mode==='tts';
 $('receipt-title').textContent=isTts?'달가루 낭독':'달가루상영실';$('cooldown-row').hidden=!isTts;
 if(isTts){const q=ttsQuote($('message').value);$('count').textContent=q.count+' / 120자';$('tts-error').textContent=q.count>120?'120자 이하로 줄여 주세요.':'';cost=q.cost;$('cost-note').textContent='확정 요금 · 실제 접수 시 사용 조건 확인';}
 else{try{const seconds=Number($('end').value)-Number($('start').value);const q=$('video-panel').dataset.uploadId?{seconds,cost:Math.ceil(seconds/30)*100}:videoCommand($('video-url').value,$('start').value,$('end').value);cost=q.cost;$('duration').textContent=q.seconds+'초 구간 · 최대 180초';}catch{}$('cost-note').textContent='30초당 0.10lb · 서버에서 길이와 비용 재확인';}
 $('cost').textContent=cost===null?'—':(cost/1000).toFixed(2);
}
function select(next){mode=next;for(const kind of ['tts','video']){$(kind+'-tab').setAttribute('aria-selected',String(kind===mode));$(kind+'-tab').tabIndex=kind===mode?0:-1;$(kind+'-panel').hidden=kind!==mode;}update();document.dispatchEvent(new Event('modechange'));}
for(const kind of ['tts','video']){$(kind+'-tab').addEventListener('click',()=>select(kind));$(kind+'-tab').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();select(e.key==='Home'?'tts':e.key==='End'?'video':mode==='tts'?'video':'tts');$(mode+'-tab').focus();}});}
document.addEventListener('input',update);document.addEventListener('rangechange',update);
const fields=['message','video-url','start','end','voice','rate','pitch'];
try{const saved=JSON.parse(sessionStorage.getItem('md-draft')||'{}');for(const id of fields)if(typeof saved[id]==='string')$(id).value=saved[id];}catch{}
document.addEventListener('input',()=>{try{sessionStorage.setItem('md-draft',JSON.stringify(Object.fromEntries(fields.map(id=>[id,$(id).value]))));}catch{}});
$('reset-speech').addEventListener('click',()=>{$('voice').value='random';$('rate').value='1';$('pitch').value='0';document.dispatchEvent(new Event('input'));});update();
