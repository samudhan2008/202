(()=>{
const C=window.MM_CONFIG,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=s=>s>0&&isFinite(s)?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'–';
let S=null;try{S=JSON.parse(localStorage.mm_sess||'null')}catch{}
document.documentElement.dataset.t=localStorage.mm_theme||'frost';

async function auth(grant,body){
  const r=await fetch(C.url+'/auth/v1/token?grant_type='+grant,{method:'POST',headers:{apikey:C.key,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.msg||j.error_description||j.message||'Sign-in failed (HTTP '+r.status+')');
  S=j;localStorage.mm_sess=JSON.stringify(j);
}
function signOut(){localStorage.removeItem('mm_sess');location.reload()}
async function req(path,opt={}){
  const go=()=>fetch(C.url+path,{...opt,headers:{apikey:C.key,Authorization:'Bearer '+S.access_token,...opt.headers}});
  let r=await go();
  if(r.status===401||(r.status===400&&path.startsWith('/storage'))){
    try{await auth('refresh_token',{refresh_token:S.refresh_token});r=await go()}catch{signOut();throw new Error('Session expired')}}
  return r;
}
async function sb(path,opt={}){
  const r=await req(path,{...opt,headers:{'Content-Type':'application/json',Prefer:'return=representation',...opt.headers}});
  if(!r.ok)throw new Error((await r.json().catch(()=>({}))).message||'Request failed ('+r.status+')');
  return r.status===204?null:r.json();
}

/* files: Supabase Storage (sb:path) or legacy Mega links */
const cache=new Map(),aud=[];
async function megaLib(){if(window.mega)return;await new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/megajs@1.3.4/dist/main.browser-umd.js';s.onload=ok;s.onerror=no;document.head.append(s)})}
function blob(link,audio){
  if(!cache.has(link))cache.set(link,(async()=>{
    let buf,n=link.toLowerCase();
    if(link.startsWith('sb:')){const r=await req('/storage/v1/object/authenticated/music/'+link.slice(3));if(!r.ok)throw new Error('Storage '+r.status);buf=await r.arrayBuffer()}
    else{await megaLib();const f=mega.File.fromURL(link);await f.loadAttributes();n=(f.name||'').toLowerCase();buf=await f.downloadBuffer()}
    const type=!audio?'':/\.(m4a|aac)$/.test(n)?'audio/mp4':/\.flac$/.test(n)?'audio/flac':/\.(ogg|opus)$/.test(n)?'audio/ogg':'audio/mpeg';
    return URL.createObjectURL(new Blob([buf],type?{type}:{}));
  })().catch(e=>{cache.delete(link);throw e}));
  if(audio){aud.push(link);if(aud.length>4){const o=aud.shift();cache.get(o)?.then(URL.revokeObjectURL);cache.delete(o)}}
  return cache.get(link);
}
async function upload(file){
  const path=crypto.randomUUID()+'-'+file.name.replace(/[^\w.-]/g,'_');
  const r=await req('/storage/v1/object/music/'+path,{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream'},body:file});
  if(!r.ok)throw new Error('Upload failed: '+((await r.json().catch(()=>({}))).message||r.status));
  return 'sb:'+path;
}
const removeFiles=l=>{const p=l.filter(x=>x?.startsWith('sb:')).map(x=>x.slice(3));
  return p.length?sb('/storage/v1/object/music',{method:'DELETE',body:JSON.stringify({prefixes:p})}).catch(()=>{}):Promise.resolve()};
const usage=async()=>(await sb('/storage/v1/object/list/music',{method:'POST',body:JSON.stringify({prefix:'',limit:1000,offset:0})})).reduce((n,o)=>n+(o.metadata?.size||0),0);
const duration=f=>new Promise(r=>{const a=new Audio(),u=URL.createObjectURL(f);a.preload='metadata';a.src=u;a.onloadedmetadata=()=>{r(Math.round(a.duration)||null);URL.revokeObjectURL(u)};a.onerror=()=>r(null)});

/* UI helpers */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);blob(e.target.dataset.l).then(u=>e.target.src=u).catch(()=>{})}}),{rootMargin:'250px'});
const hydrate=(r=document)=>$$('img[data-l]',r).forEach(i=>io.observe(i));
const img=l=>l?`<img data-l="${esc(l)}" alt="">`:'<div class="ph"></div>';
function toast(m,err){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.setAttribute('role','status');document.body.append(t)}
  t.textContent=m;t.className=err?'err show':'show';clearTimeout(t._t);t._t=setTimeout(()=>t.className='',3500)}
function gate(name,cb){
  if(S)return cb();
  const g=document.createElement('div');g.id='gate';
  g.innerHTML=`<form class="panel login"><h1>${esc(name)}</h1><label>Email<input name="e" type="email" required autocomplete="username"></label><label>Password<span class="pw"><input name="p" type="password" required autocomplete="current-password"><button type="button" class="btn">Show</button></span></label><button class="btn pri">Sign in</button><small class="err"></small></form>`;
  document.body.append(g);const f=$('form',g);
  $('.pw button',f).onclick=e=>{const h=f.p.type==='password';f.p.type=h?'text':'password';e.target.textContent=h?'Hide':'Show'};
  f.onsubmit=async e=>{e.preventDefault();try{await auth('password',{email:f.e.value.trim(),password:f.p.value});g.remove();cb()}catch(x){$('.err',f).textContent=x.message}};
}
window.MM={C,$,$$,esc,fmt,sb,gate,signOut,toast,blob,hydrate,img,upload,removeFiles,usage,duration,user:()=>S?.user};
})();
