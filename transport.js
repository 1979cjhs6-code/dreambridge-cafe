/* GitHub Pages -> isolated GAS HTML Service frame -> existing server API. */
(() => {
  'use strict';
  const config=window.DREAMBRIDGE_DEPLOYMENT||{},pending=new Map();
  let peer=null,peerOrigin='',sequence=0,connectionError=null;
  const bytes=crypto.getRandomValues(new Uint8Array(16)),channel=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  let resolveReady,rejectReady;
  const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
  ready.catch(()=>{});
  const trustedGoogleOrigin=origin=>/^https:\/\/(?:script\.google\.com|script\.googleusercontent\.com|[a-z0-9-]+-script\.googleusercontent\.com)$/.test(origin);
  function failConnection(message){connectionError=new Error(message);rejectReady(connectionError);}
  window.addEventListener('message',event=>{
    const message=event.data;
    if(!trustedGoogleOrigin(event.origin)||!message||message.type!=='dreambridge'||message.channel!==channel)return;
    if(message.kind==='ready'&&!peer&&event.source){peer=event.source;peerOrigin=event.origin;clearTimeout(connectTimer);resolveReady();return;}
    if(event.source!==peer||event.origin!==peerOrigin||message.kind!=='response')return;
    const request=pending.get(message.id);if(!request)return;
    pending.delete(message.id);clearTimeout(request.timer);
    if(message.ok===true)request.resolve(message.data);else request.reject(new Error(typeof message.error==='string'?message.error:'요청을 처리하지 못했습니다.'));
  });
  const connectTimer=setTimeout(()=>failConnection('운영 서버에 연결하지 못했습니다. 잠시 후 새로고침해주세요. 계속되면 관리자에게 문의해주세요.'),30000);
  let backend;
  try{backend=new URL(config.backendUrl);if(backend.origin!=='https://script.google.com'||!/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(backend.pathname))throw new Error();}
  catch{clearTimeout(connectTimer);failConnection('운영 서버 연결 주소가 설정되지 않았습니다. 관리자에게 문의해주세요.');}
  if(!connectionError){
    backend.search='';backend.hash='';backend.searchParams.set('page','bridge');backend.searchParams.set('parentOrigin',location.origin);backend.searchParams.set('channel',channel);
    const frame=document.createElement('iframe');frame.hidden=true;frame.title='드림브릿지 데이터 연결';frame.referrerPolicy='no-referrer';frame.src=backend.href;document.body.appendChild(frame);
  }
  window.DreambridgeTransport={async call(action,payload){
    if(connectionError)throw connectionError;
    await ready;
    return new Promise((resolve,reject)=>{const id=channel+':'+(++sequence);const timer=setTimeout(()=>{pending.delete(id);reject(new Error('서버 응답이 지연되었습니다. 저장 결과를 새로고침으로 확인한 뒤 다시 시도해주세요.'));},60000);pending.set(id,{resolve,reject,timer});try{peer.postMessage({type:'dreambridge',channel,kind:'request',id,action,payload},peerOrigin);}catch(error){pending.delete(id);clearTimeout(timer);reject(error);}});
  }};
})();
