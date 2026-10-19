/* Each new choice replaces the previous animation without delaying the actual filter. */
export function createNoteFilter(cards,{animate=true,style=node=>getComputedStyle(node)}={}){
 const running=new Map();
 function stop(){for(const [card,animation] of running){animation.cancel();running.delete(card);}}
 function select(choice,motion=animate){
  const previous=new Map(cards.filter(card=>!card.hidden).map(card=>[card,{rect:card.getBoundingClientRect(),opacity:style(card).opacity}]));
  stop();
  let count=0;
  for(const card of cards){card.hidden=choice!=='all'&&card.dataset.category!==choice;if(!card.hidden)count++;}
  if(motion)for(const card of cards){
   if(card.hidden||!card.animate)continue;
   const before=previous.get(card),after=card.getBoundingClientRect();
   const animation=card.animate([
    {opacity:before?.opacity??0,transform:`translateY(${before?before.rect.top-after.top:10}px)`},
    {opacity:1,transform:'translateY(0px)'}
   ],{duration:300,easing:'cubic-bezier(.16,1,.3,1)'});
   running.set(card,animation);
   animation.finished.catch(()=>{}).finally(()=>{if(running.get(card)===animation)running.delete(card);});
  }
  return count;
 }
 return {select,stop};
}
