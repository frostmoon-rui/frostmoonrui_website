// Entries are the gap from the previous ledge, ledge width, and surface height.
const courses=[
 [
  [0,190,315],[56,126,286],[62,146,310],[64,118,265],
  [64,180,270,true],[72,120,301],[70,136,251],[76,120,270],[72,190,233]
 ],[
  [0,180,315],[74,116,281],[83,112,233],[86,135,274],
  [87,172,236,true],[85,108,285],[93,108,227],[86,124,250],[92,185,196]
 ],[
  [0,170,315],[90,108,269],[94,87,203],[97,111,240],[92,160,215,true],
  [108,91,283],[97,104,211],[103,82,242],[100,94,190],[109,165,227]
 ],[
  [0,174,315],[102,98,270],[114,85,206],[113,96,244],[104,152,198,true],
  [116,94,255],[122,80,188],[112,148,216,true],[125,76,257],
  [116,88,181],[121,170,208]
 ]
];

export const platformLevels=courses.map(course=>{
 let end=0;
 const ledges=course.map(([gap,w,y,checkpoint])=>{
  const x=end+gap;
  end=x+w;
  return {x,y,w,h:17,checkpoint};
 });
 const last=ledges.at(-1);
 const shards=ledges.slice(1).filter((_,i)=>i%2===0).map(p=>({x:p.x+p.w/2,y:p.y-14}));
 return {ledges,shards,width:end,goal:{x:last.x+last.w-52,y:last.y}};
});

const storageKey='frostmoon.platform.v1';

export function blankPlatformSave(level=0){
 return {level,checkpoint:0,collected:[]};
}

export function readPlatformSave(){
 try{
  const save=JSON.parse(localStorage.getItem(storageKey));
  const level=platformLevels[save?.level];
  if(!Number.isInteger(save?.level)||!level||!Number.isInteger(save.checkpoint))return blankPlatformSave();
  if(save.checkpoint!==0&&!level.ledges[save.checkpoint]?.checkpoint)return blankPlatformSave();
  if(!Array.isArray(save.collected)||save.collected.some(index=>!Number.isInteger(index)||!level.shards[index]))return blankPlatformSave();
  return {level:save.level,checkpoint:save.checkpoint,collected:[...new Set(save.collected)],completed:save.completed===true&&save.level===platformLevels.length-1};
 }catch{return blankPlatformSave();}
}

export function writePlatformSave(save){
 try{localStorage.setItem(storageKey,JSON.stringify(save));}catch{}
}
