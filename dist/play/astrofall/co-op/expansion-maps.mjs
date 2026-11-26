export const clamp=(n,lo,hi)=>Math.max(lo,Math.min(n,hi));
const wall=(x,y,w,h)=>({x,y,w,h});
export const tileWalls=[
  wall(218,60,42,150),wall(218,324,42,155),wall(390,163,180,36),
  wall(390,341,180,36),wall(698,60,42,150),wall(698,324,42,155),
  wall(461,242,38,56),
];
export const platforms=[wall(112,416,736,22),wall(216,325,158,17),wall(587,325,158,17),wall(396,255,168,17)];
export const gravityCourses=[
  {gates:[329],directions:[1,-1],variant:0},
  {gates:[331,647],directions:[-1,1],variant:1},
  {gates:[342,651],directions:[1,-1],variant:2},
  {gates:[315,656],directions:[-1,1],variant:3},
];
const layouts=[
  [wall(502,54,36,242),wall(662,266,36,220)],
  [wall(443,54,37,237),wall(563,252,38,234),wall(751,54,42,280)],
  [wall(463,244,35,242),wall(546,54,36,224),wall(760,255,39,231)],
  [wall(466,50,43,272),wall(548,287,43,200),wall(786,51,35,257)],
];
export const routeWalls=variant=>layouts[variant] || layouts[0];
