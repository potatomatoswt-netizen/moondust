// Only a 15-minute credential is kept in tab storage; long sessions remain HttpOnly on the API.
const API='https://mikage-moondust.uiling.chatgpt.site',cacheKey='md-pages-short-session';
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
let access=null,expires=0,account=null,accountAt=0;
function save(){try{sessionStorage.setItem(cacheKey,JSON.stringify({access,expires,account,accountAt}));}catch{}}
export function clearConnection(){access=null;expires=0;account=null;accountAt=0;sessionStorage.removeItem(cacheKey);}
export function rememberAccount(value){account=value;accountAt=Date.now();save();}
export async function connectedAccount(){await ready;return access&&expires>Date.now()&&account&&Date.now()-accountAt<30000?account:null;}
export async function connectPages(force=false){const verifier=b64(crypto.getRandomValues(new Uint8Array(32))),state=b64(crypto.getRandomValues(new Uint8Array(32))),challenge=b64(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
clearConnection();sessionStorage.setItem('md-pages-proof',JSON.stringify({verifier,state,at:Date.now()}));const u=new URL('/connect',API);u.search=new URLSearchParams({challenge,state,redirect:new URL('./',location.href).href,force:force?'1':'0'});location.replace(u.href);throw Object.assign(Error('기존 계정 연결을 확인하고 있습니다.'),{redirecting:true});}
async function restore(){const f=new URLSearchParams(location.hash.slice(1));if(!f.has('md_code')&&!f.has('md_anonymous')){
try{const c=JSON.parse(sessionStorage.getItem(cacheKey)||'null');if(c&&typeof c.access==='string'&&Number.isFinite(c.expires)&&c.expires>Date.now()&&c.expires<=Date.now()+15*60000){access=c.access;expires=c.expires;account=c.account;accountAt=c.accountAt;return;}}catch{}
clearConnection();if(sessionStorage.getItem('md-pages-anonymous')==='1')return;await connectPages();return;}
history.replaceState(null,'',location.pathname+location.search);let p;try{p=JSON.parse(sessionStorage.getItem('md-pages-proof')||'null');}catch{}sessionStorage.removeItem('md-pages-proof');if(!p||p.state!==f.get('md_state')||Date.now()-p.at>10*60000)throw Error('연결 확인 값이 만료됐습니다. 다시 연결해 주세요.');if(f.has('md_anonymous')){clearConnection();sessionStorage.setItem('md-pages-anonymous','1');return;}
const r=await fetch(API+'/api/pages/exchange',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:f.get('md_code'),verifier:p.verifier})}),d=await r.json();if(!r.ok)throw Error(d.error);access=d.accessToken;expires=d.expiresAt;account=d.account??null;accountAt=Date.now();sessionStorage.removeItem('md-pages-anonymous');save();}
const ready=restore().catch(e=>{if(!e.redirecting)console.warn('MoonDust 계정 연결을 다시 확인해 주세요.');});
export async function apiFetch(path,init={}){await ready;if(!access)return Response.json({error:'치지직 계정을 연결해 주세요.'},{status:401});if(Date.now()>=expires){await connectPages();}
if(!/^\/api\/viewer\/(request|result|upload|audio)(\?|$)/.test(path))throw Error('지원하지 않는 API');const headers=new Headers(init.headers);headers.set('Authorization','Bearer '+access);const r=await fetch(API+path.replace('/api/viewer/','/api/pages/'),{...init,headers,credentials:'omit'});if(r.status===401){const d=await r.clone().json().catch(()=>({}));if(d.reconnect)await connectPages();}return r;}
