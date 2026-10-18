let pending;
export async function loadAmap(){
 if(window.AMap)return window.AMap;
 if(pending)return pending;
 pending=(async()=>{
  const response=await fetch('/api/map-config',{signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('configuration');
  const config=await response.json();
  if(!config.configured||!config.key||config.serviceHost!==location.origin+'/_AMapService')throw new Error('configuration');
  window._AMapSecurityConfig={serviceHost:config.serviceHost};
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   const timer=setTimeout(()=>{script.remove();reject(new Error('Map library timeout'));},20000);
   script.src='https://webapi.amap.com/maps?'+new URLSearchParams({v:'2.0',key:config.key});
   script.onload=()=>{clearTimeout(timer);window.AMap?resolve():reject(new Error('Map library unavailable'));};
   script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('Map library unavailable'));};
   document.head.append(script);
  });
  return window.AMap;
 })();
 try{return await pending;}finally{pending=null;}
}
