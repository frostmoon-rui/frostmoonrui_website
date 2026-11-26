// Route entries give the gap from the preceding ledge, the width and the surface height.
const courses=[
 {route:[[0,190,315],[56,126,286],[62,146,310],[64,118,265],[64,180,270,true],[72,120,301],[70,136,251],[76,120,270],[72,190,233]]},
 {route:[[0,180,315],[74,116,281],[83,112,233],[86,135,274],[87,172,236,true],[85,108,285],[93,108,227],[86,124,250],[92,185,196]]},
 {
  route:[[0,170,315],[90,108,269],[94,87,203],[97,111,240],[92,160,215,true],[108,91,283],[97,104,211],[103,82,242],[100,94,190],[109,165,227]],
  motion:[[2,'y',27,144],[5,'x',22,180],[8,'y',24,145]]
 },
 {
  route:[[0,174,315],[102,98,270],[114,85,206],[113,96,244],[104,152,198,true],[116,94,255],[122,80,188],[112,148,216,true],[125,76,257],[116,88,181],[121,170,208]],
  spikes:[[0,88,34],[4,99,26],[7,106,26],[10,65,37]]
 },
 {
  route:[[0,390,315],[70,135,273],[72,125,233],[74,300,276,true],[79,117,240],[82,200,203]],
  switches:[[0,109]],gate:[0,274]
 },
 {
  route:[[0,186,315],[75,138,280],[82,116,239],[72,300,280,true],[82,97,249],[90,109,213],[80,233,248]],
  branches:[[3,115,93,191]],motion:[[4,'y',29,175],[5,'x',22,158]],
  switches:[[7,46]],gate:[6,112],spikes:[[6,55,26]]
 },
 {
  route:[[0,184,315],[88,117,264],[97,105,220],[87,480,278,true],[96,100,229],[95,184,205]],
  branches:[[3,72,85,187],[3,290,78,194]],
  switches:[[7,39],[6,42]],gate:[3,409],spikes:[[3,260,28]],motion:[[4,'x',20,150]]
 },
 {
  route:[[0,180,315],[91,108,263],[99,97,212],[93,460,286,true],[104,90,229],[110,92,262],[97,238,213,true],[92,100,250],[100,110,192],[97,210,234]],
  branches:[[3,84,88,197],[3,294,92,186],[6,72,87,120]],motion:[[1,'y',23,140],[4,'x',24,152],[5,'y',29,144],[8,'x',23,142]],
  switches:[[11,45],[10,44],[12,42]],gate:[9,95],spikes:[[3,258,28],[6,180,28],[7,57,27],[9,43,26]]
 }
];

export const platformLevels=courses.map(({route,branches=[],motion=[],spikes=[],switches=[],gate})=>{
 let end=0;
 const motionByLedge=new Map(motion.map(([index,axis,range,period])=>[index,{axis,range,period}]));
 const ledges=route.map(([gap,w,y,checkpoint],index)=>{
  const x=end+gap;
  end=x+w;
  return {x,y,w,h:17,checkpoint,motion:motionByLedge.get(index)};
 });
 const last=ledges.at(-1);
 const shards=ledges.flatMap((p,i)=>i%2===1?[{ledge:i,offset:p.w/2}]:[]);
 for(const [support,offset,w,y] of branches)ledges.push({x:ledges[support].x+offset,y,w,h:14});
 const locate=([index,offset,w=0],h)=>({x:ledges[index].x+offset,y:ledges[index].y-h,w,h});
 return {
  ledges,shards,width:end,goal:{x:last.x+last.w-47,y:last.y,ledge:route.length-1},
  spikes:spikes.map(entry=>locate(entry,20)),
  switches:switches.map(entry=>locate(entry,17)),
  gate:gate?locate([...gate,13],139):null,
  notices:[
   ...(motion.length?[{x:ledges[motion[0][0]].x,type:'move'}]:[]),
   ...(spikes.length?[{x:ledges[spikes[0][0]].x+spikes[0][1],type:'spikes'}]:[]),
   ...(switches.length?[{x:ledges[0].x+80,type:switches.length>1?'sequence':'switch'}]:[])
  ]
 };
});

export function ledgeAt(ledge,time){
 const motion=ledge.motion;
 if(!motion)return ledge;
 const offset=Math.sin(time/motion.period*Math.PI*2)*motion.range;
 return {...ledge,[motion.axis]:ledge[motion.axis]+offset};
}
