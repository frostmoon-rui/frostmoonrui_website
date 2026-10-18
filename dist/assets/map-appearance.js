// Official Amap styles apply to vector layers; satellite imagery stays unfiltered.
export function mapStyle(dark){return `amap://styles/${dark?'darkblue':'whitesmoke'}`;}
const paths={
 coffee:'M5 5h12v9a5 5 0 0 1-10 0V5Zm12 1h2a3 3 0 0 1 0 6h-2M5 21h14',
 dessert:'m6 10 6 12 6-12M5 10h14a3 3 0 0 0-3-3 4 4 0 0 0-8 0 3 3 0 0 0-3 3Z',
 noodles:'M3 12h18a9 9 0 0 1-18 0Zm3 10h12M9 3v6m4-7v7m4-6v6',
 dining:'M5 2v7m4-7v7M3 2v5a4 4 0 0 0 8 0V2M7 11v11M19 2c-4 5-4 10 0 10V2Zm0 10v10'
};
export function markerKind(category){return ['Coffee','Drinks'].includes(category)?'coffee':category==='Dessert'?'dessert':category==='Noodles'?'noodles':'dining';}
export function createPin(document,place,number,onSelect){
 const kind=markerKind(place.category),button=document.createElement('button');
 button.type='button';button.className=`atlas-pin atlas-pin--${kind}`;
 button.setAttribute('aria-label',`${number}. ${place.name}`);
 button.setAttribute('aria-pressed','false');button.title=place.name;
 const face=document.createElement('span');face.className='atlas-pin-face';
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 for(const [key,value] of Object.entries({viewBox:'0 0 24 24',width:'18',height:'18',fill:'none',stroke:'currentColor','stroke-width':'1.6','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))svg.setAttribute(key,value);
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',paths[kind]);svg.append(path);face.append(svg);
 const badge=document.createElement('span');badge.className='atlas-pin-number';badge.textContent=String(number);badge.setAttribute('aria-hidden','true');
 button.append(face,badge);button.addEventListener('click',event=>{event.stopPropagation();onSelect();});
 return button;
}
