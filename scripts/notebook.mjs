import {notebookTopics,articleDate} from '../shared/site-schema.js';
import {escape} from './i18n.mjs';

const icons={food:'◎',software:'⌘',hardware:'◇',maps:'⊕',automation:'↻',uncategorized:'·'};
export const topicPaths=Object.keys(notebookTopics).map(key=>'notes/category/'+key);
const topicHref=key=>'/notes/category/'+key+'/';
const projectSection=/<section\b[^>]*\bid\s*=\s*(['"])([a-z0-9-]+)\1[^>]*>([\s\S]*?)<\/section>/gi;

export function buildNotebook(pages,foodNotes,assignments,text,time,locale){
 const topicsFor=key=>assignments[key]?.length?assignments[key]:['uncategorized'];
 const articles=pages.filter(page=>page.path.startsWith('notes/')).map(page=>({
  id:page.path,href:'/'+page.path+'/',title:page.title,date:articleDate(page),topics:topicsFor(page.path),kind:'Article'
 }));
 const projectsPage=pages.find(page=>page.path==='projects');
 const projects=[...projectsPage.body.matchAll(projectSection)].flatMap(([,q,id,body])=>{
  const heading=body.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
  if(!heading)return [];
  const key='projects#'+id;
  return [{id:key,href:'/projects/#'+id,title:heading[1].replace(/<[^>]*>/g,'').trim(),date:'',topics:topicsFor(key),kind:'Project'}];
 });
 const venues=[...foodNotes].map(([path,{venue,date,categories}])=>({
  id:path,href:'/'+path+'/',title:venue.name,date,topics:[...new Set(['food',...categories])],kind:'Article'
 }));
 const all=[...articles,...projects,...venues];
 const entries=new Map(all.map(entry=>[entry.id,entry]));
 const byTopic=new Map(Object.keys(notebookTopics).map(key=>[key,all.filter(entry=>entry.topics.includes(key))
  .sort((a,b)=>Number(Boolean(a.date))-Number(Boolean(b.date))||b.date.localeCompare(a.date)||a.title.localeCompare(b.title,locale))]));
 const categoryNav=(keys,current)=>keys.length?`<nav class="notebook-topics" aria-label="${escape(text('Categories'))}">${keys.map(key=>`<a href="${topicHref(key)}"${key===current?' aria-current="page"':''}>${escape(text(notebookTopics[key]))}</a>`).join('')}</nav>`:'';
 const visibleTopics=[...byTopic.keys()].filter(key=>key!=='uncategorized'||byTopic.get(key).length);
 const indexLinks=visibleTopics.map(key=>[key,byTopic.get(key)]).map(([key,list])=>`<a class="category-link" href="${topicHref(key)}"><span aria-hidden="true">${icons[key]}</span><strong>${escape(text(notebookTopics[key]))}</strong><span class="category-count">${list.length}</span></a>`).join('');
 const directoryTitle=text('Categories');
 const sections=[{path:'notes',title:directoryTitle,body:`<nav class="category-grid" aria-label="${escape(directoryTitle)}">${indexLinks}</nav>`}];
 for(const [key,list] of byTopic){
  const rows=list.map(entry=>`<li><a href="${entry.href}"><span>${escape(entry.title)} <small class="notebook-kind">${escape(text(entry.kind))}</small></span>${time(entry.date)}<span aria-hidden="true">↗</span></a>${categoryNav(entry.topics.filter(topic=>topic!==key))}</li>`).join('');
  const body=`<div class="notebook-category-navigation"><a class="text-link" href="/notes/">${escape(directoryTitle)} ↗</a>${categoryNav(visibleTopics.includes(key)?visibleTopics:[...visibleTopics,key],key)}</div>`+
   (rows?`<ul class="category-articles">${rows}</ul>`:`<p>${escape(text('No entries in this category yet.'))}</p>`);
  sections.push({path:'notes/category/'+key,title:text(notebookTopics[key]),body});
 }
 function relatedMarkup(entry){
  if(!entry)return '';
  const related=new Map();
  for(const topic of entry.topics){
   const list=byTopic.get(topic);
   const index=list.findIndex(other=>other.id===entry.id);
   for(const neighbor of [list[index+1],list[index-1]]){
    if(neighbor)related.set(neighbor.id,neighbor);
   }
  }
  if(!related.size)return '';
  const links=[...related.values()].slice(0,3).map(item=>`<li><a class="text-link" href="${item.href}">${escape(item.title)} ↗</a></li>`).join('');
  return `<section class="notebook-related"><h2>${escape(text('Related articles and projects'))}</h2><ul>${links}</ul></section>`;
 }
 return {
  sections,
  topics:id=>categoryNav(entries.get(id)?.topics??[]),
  related:id=>relatedMarkup(entries.get(id)),
  decorateProjects:body=>body.replace(projectSection,(section,q,id,content)=>{
   const entry=entries.get('projects#'+id);
   return entry?section.replace(content,()=>content.replace(/<\/div>\s*$/i,close=>categoryNav(entry.topics)+close)):section;
  })
 };
}
