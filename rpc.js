import {apiFetch,connectPages,connectedAccount,rememberAccount,clearConnection} from './api.js';
export async function rpc(action,input){
 if(action==='login')return connectPages(true);
 if(action==='me'){const account=await connectedAccount();if(account)return {account};}
 const r=await apiFetch('/api/viewer/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,input})}),b=await r.json();if(!r.ok)throw Object.assign(Error(b.error||'서버 연결을 확인해 주세요.'),{status:r.status});
 const deadline=Date.now()+95000;
 while(Date.now()<deadline){const poll=await apiFetch('/api/viewer/result?id='+encodeURIComponent(b.id)),result=await poll.json();if(poll.status===202){await new Promise(resolve=>setTimeout(resolve,500));continue;}if(!poll.ok)throw Object.assign(Error(result.error||'요청 처리에 실패했습니다.'),{status:poll.status});if(result.account)rememberAccount(result.account);if(action==='logout')clearConnection();return {...result,jobId:b.id};}
 throw Error('응답이 늦어지고 있습니다. 같은 내용으로 다시 누르면 중복 차감 없이 확인합니다.');
}
