import {apiFetch,connectPages} from './api.js';
import {rpc} from './rpc.js';
const $=id=>document.getElementById(id);let busy=false,objectUrl=null;
$('preview-voice').addEventListener('click',async()=>{if(busy)return;busy=true;$('preview-voice').disabled=true;$('preview-status').textContent='미리듣기 준비 중…';try{
 const r=await rpc('preview',{text:$('message').value,voice:$('voice').value,speakingRate:Number($('rate').value),pitch:Number($('pitch').value)});
 const audio=await apiFetch('/api/viewer/audio?job='+encodeURIComponent(r.jobId));if(!audio.ok)throw Error('미리듣기를 가져오지 못했습니다.');const blob=await audio.blob();if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(blob);$('voice-preview').src=objectUrl;$('voice-preview').hidden=false;
 try{await $('voice-preview').play();$('preview-status').textContent='내 브라우저에서만 재생됩니다. 방송에는 전송되지 않습니다.';}catch{$('preview-status').textContent='아래 재생 버튼을 눌러 들어 주세요.';}
 }catch(e){$('preview-status').textContent=e.message;}finally{busy=false;$('preview-voice').disabled=false;}});
document.addEventListener('modechange',()=>{$('voice-preview').pause();});
