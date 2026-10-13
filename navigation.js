const allowed=new Set(['home','tts','video','emotes','guide']);
function route(){
 const hash=location.hash.slice(1);if(hash.startsWith('md_'))return;
 const section=allowed.has(hash)?hash:'home';
 document.querySelector('.workspace').hidden=!['tts','video'].includes(section);
 document.getElementById('emote-shop').hidden=section!=='emotes';
 document.getElementById('newcomer-guide').hidden=section!=='guide';
 for(const a of document.querySelectorAll('.feature-nav a')){if(a.hash==='#'+section)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
 if(section==='tts'||section==='video')document.getElementById(section+'-tab').click();
}
window.addEventListener('hashchange',route);
document.addEventListener('DOMContentLoaded',route);
for(const kind of ['tts','video'])document.getElementById(kind+'-tab').addEventListener('click',()=>{if(location.hash!=='#'+kind)history.replaceState(null,'','#'+kind);});
// An OAuth return may restore the fragment after the initial DOM event.
document.addEventListener('moondust-session-ready',route);
