import {rpc} from './rpc.js';
import {connectedAccount} from './api.js';
const host=document.getElementById('emote-bundles'),status=document.getElementById('emote-status'),refresh=document.getElementById('emote-refresh');
const origin='https://mikage-moondust.uiling.chatgpt.site';
let shop,account=null,busy=false;
const lb=n=>(n/1000).toFixed(2)+'lb';
function node(tag,text){const e=document.createElement(tag);if(text)e.textContent=text;return e;}
const previews=new IntersectionObserver(entries=>{for(const e of entries){e.target.dataset.visible=String(e.isIntersecting);animate(e.target);}});
function animate(details){for(const img of details.querySelectorAll('img[data-src]')){if(details.open&&details.dataset.visible==='true')img.src=img.dataset.src;else img.removeAttribute('src');}}
function render(){
 previews.disconnect();host.replaceChildren();const owned=new Set(shop.ownedBundleIds??[]);
 for(const b of shop.bundles.filter(b=>b.enabled||owned.has(b.id))){
  const card=node('details'),summary=node('summary',b.name+' · '+b.emoteIds.length+'종 · '+lb(b.priceMilliLb)+(owned.has(b.id)?' · 보유중':''));card.append(summary,node('p',b.description));
  const grid=node('div');grid.style.cssText='display:flex;flex-wrap:wrap;gap:12px';
  for(const id of b.emoteIds){const e=shop.emotes.find(x=>x.id===id);if(!e)continue;const figure=node('figure');figure.style.cssText='margin:0;width:110px;text-align:center';const img=node('img');img.width=80;img.height=80;img.alt=e.name;img.dataset.src=origin+'/emote-assets/'+e.asset;img.onerror=()=>{img.removeAttribute('src');};const copy=node('button',e.trigger+' 복사');copy.type='button';copy.onclick=async()=>{try{await navigator.clipboard.writeText(e.trigger);status.textContent=e.trigger+' 복사했습니다. 치지직 채팅에 사용하세요.';}catch{status.textContent='이 이모지를 복사해 주세요: '+e.trigger;}};figure.append(img,node('figcaption',e.name+(e.enabled?'':' · 사용 중지')),copy);grid.append(figure);}
  card.append(grid);const have=owned.has(b.id),short=account&&!account.isOwner&&shop.availableMilliLb<b.priceMilliLb;const buy=node('button',have?'보유중':short?'달가루 부족':account?'이 번들 해금 · '+lb(b.priceMilliLb):'계정 연결 후 해금');buy.type='button';buy.disabled=busy||have||!!short||!b.enabled;buy.onclick=()=>void purchase(b.id);card.append(buy);card.addEventListener('toggle',()=>animate(card));host.append(card);previews.observe(card);
 }
 refresh.disabled=busy;
}
async function load(){const r=await rpc('emote-shop');shop=r.shop;account=r.account;document.dispatchEvent(new CustomEvent('emote-account',{detail:account}));render();status.textContent='사용 가능 '+lb(shop.availableMilliLb)+' · 보유 '+shop.ownedBundleIds.length+'번들';}
async function purchase(id){if(busy)return;busy=true;render();try{
 if(!account){await rpc('login');return;}
 await load();const b=shop.bundles.find(b=>b.id===id);if(shop.ownedBundleIds.includes(id)){status.textContent='이미 보유한 번들입니다.';return;}
 if(!b?.enabled)throw Error('판매 중인 번들이 아닙니다.');
 if(!confirm(b.name+' '+b.emoteIds.length+'종을 '+lb(b.priceMilliLb)+(account.isOwner?' (OWNER 비용 예외)':'')+'로 영구 해금할까요?'))return;
 status.textContent='구매 확인 중… 다시 누르지 않아도 됩니다.';
 const r=await rpc('emote-buy',{bundleId:id,expectedPriceMilliLb:b.priceMilliLb});shop=r.shop;account=r.account;document.dispatchEvent(new CustomEvent('emote-account',{detail:account}));status.textContent=b.name+' 영구 해금 완료 · 사용 가능 '+lb(shop.availableMilliLb);
 }catch(e){if(!e.redirecting){status.textContent=e.message;if(e.status===401)account=null;}}
 finally{busy=false;render();}
}
refresh.onclick=async()=>{if(busy)return;busy=true;refresh.disabled=true;try{await load();}catch(e){status.textContent=e.message;}finally{busy=false;if(shop)render();}};
try{const r=await fetch('./emote-catalog.json');if(!r.ok)throw Error('상점 목록을 불러오지 못했습니다.');shop=await r.json();render();account=await connectedAccount();if(account)await load();}catch(e){status.textContent=e.message;}
