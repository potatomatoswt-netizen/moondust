import {steps} from './guide-content.js';
import {readState,writeState} from './onboarding-state.js';
const card=document.getElementById('welcome-card'),dialog=document.getElementById('welcome-dialog'),body=document.getElementById('welcome-body'),progress=document.getElementById('welcome-progress'),previous=document.getElementById('welcome-previous'),next=document.getElementById('welcome-next');
let state=readState(),index=0,opener=null,oldOverflow='',completed=false;
function save(value){state=value;writeState(value);refresh();}
function refresh(){card.hidden=state!=='new'||!['','#home'].includes(location.hash);}
function element(tag,text){const node=document.createElement(tag);node.textContent=text;return node;}
function render(){const step=steps[index];body.replaceChildren();const title=element('h3',step.title);title.tabIndex=-1;body.append(title);
 for(const text of step.body)body.append(element('p',text));
 if(step.command){const box=element('div','');box.className='welcome-command';box.append(element('code',step.command));const copy=element('button','예시 복사');copy.type='button';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(step.command);document.getElementById('welcome-status').textContent='복사했습니다. 치지직 채팅창에 직접 붙여 넣어 주세요.';}catch{const field=document.createElement('input');field.readOnly=true;field.value=step.command;field.setAttribute('aria-label','복사할 명령어 예시');box.append(field);field.focus();field.select();document.getElementById('welcome-status').textContent='선택한 예시를 직접 복사해 주세요.';}});box.append(copy);body.append(box);}
 if(step.features){const list=document.createElement('ul');for(const text of step.features)list.append(element('li',text));body.append(list);}
 body.append(element('p',step.note));if(step.extra)body.append(element('p',step.extra));
 progress.textContent=(index+1)+' / '+steps.length+'단계';previous.disabled=index===0;next.textContent=index===steps.length-1?'둘러보러 가기':'다음';document.getElementById('welcome-status').textContent='';body.scrollTop=0;if(dialog.open)title.focus();
}
function open(event){opener=event.currentTarget;completed=false;if(typeof dialog.showModal!=='function'){location.hash='guide';return;}index=0;render();oldOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';dialog.showModal();body.querySelector('h3').focus();}
function close(){dialog.close();}
for(const node of document.querySelectorAll('[data-open-onboarding]'))node.addEventListener('click',open);
document.getElementById('welcome-later').addEventListener('click',()=>{save('later');document.querySelector('[data-open-onboarding]:not(#welcome-start)').focus();});
document.getElementById('welcome-close').addEventListener('click',close);
document.getElementById('welcome-skip').addEventListener('click',()=>{save('later');close();});
previous.addEventListener('click',()=>{if(index>0){index--;render();}});
next.addEventListener('click',()=>{if(index<steps.length-1){index++;render();}else{completed=true;save('complete');close();location.hash='home';}});
dialog.addEventListener('close',()=>{document.documentElement.style.overflow=oldOverflow;if(completed){const nav=document.querySelector('.feature-nav');nav.tabIndex=-1;nav.focus();nav.scrollIntoView({block:'nearest'});}else if(opener&&!opener.closest('[hidden]'))opener.focus();else document.querySelector('[data-open-onboarding]:not(#welcome-start)').focus();});
window.addEventListener('hashchange',refresh);document.addEventListener('moondust-session-ready',refresh);refresh();
