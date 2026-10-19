// Parser-blocking, same-origin initialization runs before body or page modules.
(()=>{
 const root=document.documentElement;
 let saved;try{saved=localStorage.getItem('frostmoon-theme');}catch{}
 const hinted=root.dataset.theme;
 const theme=['dark','light'].includes(saved)?saved:['dark','light'].includes(hinted)?hinted:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
 root.dataset.theme=theme;
 try{document.cookie='frostmoon_theme='+theme+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');}catch{}
})();
