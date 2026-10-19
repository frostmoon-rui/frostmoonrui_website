// Initial entry is CSS-driven and self-dismisses even if scripts fail.
if(typeof document!=='undefined'){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let animation=null;
 function cancel(){if(reduced.matches||document.body.dataset.motion==='false'||document.visibilityState==='hidden'){animation?.cancel();animation=null;}}
 reduced.addEventListener('change',cancel);document.addEventListener('visibilitychange',cancel);
 new MutationObserver(cancel).observe(document.body,{attributes:true,attributeFilter:['data-motion']});
 window.addEventListener('pageshow',event=>{
  cancel();if(!event.persisted||reduced.matches||document.body.dataset.motion==='false')return;
  const intro=document.querySelector('.page-intro');if(!intro?.animate)return;
  animation=intro.animate([{opacity:1,visibility:'visible',offset:0},{opacity:1,visibility:'visible',offset:.64},{opacity:0,visibility:'hidden',offset:1}],{duration:960,easing:'ease',fill:'none'});
  animation.finished.catch(()=>{});
 });
}
