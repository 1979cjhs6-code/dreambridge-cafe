/* Pages -> Apps Script JSON API. Tokens and passwords stay in HTTPS request bodies. */
(() => {
  'use strict';
  let backend;
  try{backend=new URL((window.DREAMBRIDGE_DEPLOYMENT||{}).backendUrl);if(backend.origin!=='https://script.google.com'||!/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(backend.pathname))throw new Error();backend.search='';backend.hash='';}
  catch{backend=null;}
  window.DreambridgeTransport={async call(action,payload){
    if(!backend)throw new Error('운영 서버 연결 주소가 설정되지 않았습니다. 관리자에게 문의해주세요.');
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),60000);
    try{
      const response=await fetch(backend.href,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},credentials:'omit',redirect:'follow',body:JSON.stringify({parentOrigin:location.origin,action,payload}),signal:controller.signal});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const result=await response.json();
      if(!result||typeof result.ok!=='boolean')throw new Error('Invalid server response');
      if(!result.ok)throw Object.assign(new Error(typeof result.error==='string'?result.error:'요청을 처리하지 못했습니다.'),{serverResponse:true});
      return result.data;
    }catch(error){
      if(error.serverResponse)throw error;
      throw new Error(error.name==='AbortError'?'서버 응답이 지연되었습니다. 저장 결과를 새로고침으로 확인한 뒤 다시 시도해주세요.':'운영 서버에 연결하지 못했습니다. 네트워크 연결을 확인한 뒤 다시 연결해주세요.');
    }finally{clearTimeout(timeout);}
  }};
})();
