export function enablePlatformFullscreen(game,canvas){
 const button=game.querySelector('[data-fullscreen]');
 const hint=game.querySelector('[data-rotate-hint]');
 const placeholder=document.createComment('');
 const landscape=matchMedia('(orientation: landscape)');
 let immersive=false;
 let background=[];

 function update(active){
  game.classList.toggle('is-immersive',active);
  document.documentElement.classList.toggle('platform-immersive',active);
  button.textContent=active?game.dataset.exitFullscreen:game.dataset.fullscreen;
  button.setAttribute('aria-pressed',String(active));
  hint.hidden=!active||landscape.matches;
 }

 function exitFallback(){
  if(!immersive)return;
  immersive=false;
  placeholder.replaceWith(game);
  game.removeAttribute('role');
  game.removeAttribute('aria-modal');
  game.removeAttribute('aria-label');
  for(const element of background)element.inert=false;
  background=[];
  update(false);
  button.focus({preventScroll:true});
 }

 button.addEventListener('click',async()=>{
  if(document.fullscreenElement===game){
   await document.exitFullscreen();
   return;
  }
  if(immersive){
   exitFallback();
   return;
  }
  if(game.requestFullscreen){
   try{
    await game.requestFullscreen();
    try{await screen.orientation?.lock?.('landscape');}catch{}
    canvas.focus({preventScroll:true});
    return;
   }catch{}
  }
  immersive=true;
  game.before(placeholder);
  document.body.append(game);
  background=[...document.body.children].filter(element=>element!==game&&!element.inert);
  for(const element of background)element.inert=true;
  game.setAttribute('role','dialog');
  game.setAttribute('aria-modal','true');
  game.setAttribute('aria-label',canvas.getAttribute('aria-label'));
  update(true);
  canvas.focus({preventScroll:true});
 });

 document.addEventListener('fullscreenchange',()=>{
  if(immersive)return;
  const active=document.fullscreenElement===game;
  update(active);
  if(!active)screen.orientation?.unlock?.();
 });
 landscape.addEventListener('change',()=>update(immersive||document.fullscreenElement===game));
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape')exitFallback();
 });
}
