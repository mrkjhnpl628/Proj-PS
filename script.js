/* ===== CONFIG =====
   Google sign-in: create an OAuth Web Client ID at console.cloud.google.com
   (APIs & Services > Credentials), add your site origin, and paste it below. */
const GOOGLE_CLIENT_ID='';

const $=s=>document.querySelector(s),app=$('#app');
function h(t,c,x){const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let me=null,view='dash',cur=null;
document.documentElement.dataset.theme=store.get('theme','light');

/* ---- Built-in course (from the Platform Security slides) ---- */
let cc=null;
const ctops=id=>COURSES.find(c=>c.id===id).topics.concat(store.get('extra',[]).filter(e=>(e.course||'c1')===id));
const topics=()=>ctops(cc);
const PASS_PERCENT=75; /* single place to change the pass mark */
const passMark=n=>Math.ceil(n*PASS_PERCENT/100);

/* ---- Auth & account security ---- */
const COMMON=['password','123456','qwerty','letmein','admin','welcome','iloveyou','abc123'];
const enc=new TextEncoder(),hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''),unhex=s=>new Uint8Array(s.match(/../g).map(x=>parseInt(x,16)));
async function hashPw(p,s){const k=await crypto.subtle.importKey('raw',enc.encode(p),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:s,iterations:150000,hash:'SHA-256'},k,256))}
const pwOk=p=>p.length>=10&&/[a-z]/.test(p)&&/[A-Z]/.test(p)&&/\d/.test(p)&&/[^A-Za-z0-9]/.test(p)&&!COMMON.some(c=>p.toLowerCase().includes(c));
let fails=0,lock=0,idle;const EDU_CODE='PSEC-EDU';
function resetIdle(){clearTimeout(idle);if(me)idle=setTimeout(()=>{me=null;try{sessionStorage.removeItem('sl')}catch(e){}route('dash');alert('Logged out after 5 minutes of inactivity.')},300000)}
['click','keydown','mousemove'].forEach(e=>addEventListener(e,resetIdle));
const prog=()=>store.get('prog:'+me.n,{passed:{}});

const PUB=['about','faq','contact'];
function nav(){const n=$('#nav');n.replaceChildren();
 const add=(l,v)=>{const b=h('button','nb'+(view===v?' on':''),l);b.onclick=()=>route(v);n.append(b)};
 if(me){add('Dashboard','home');add('Courses','catalog');add('Videos','videos');if(me.role==='educator')add('Educator Studio','edu');add('Profile','profile');const av=avatar(me.n,30);av.style.marginLeft='4px';n.append(av)}
 add('About','about');add('FAQ','faq');add('Contact','contact');
 if(me){const o=h('button','nb','Log out');o.onclick=()=>{me=null;cc=null;try{sessionStorage.removeItem('sl')}catch(e){}route('dash')};n.append(o)}else add('Log in','dash');
 const tg=h('button','nb','🌓');tg.title='Toggle dark mode';tg.onclick=()=>{const d=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=d;store.set('theme',d)};n.append(tg)}
function route(v,t){view=v;cur=t??null;nav();app.replaceChildren();scrollTo(0,0);if(!me&&!PUB.includes(v))return authView();if(me)syncBadges();({videos,home,catalog,profile,about,faq,contact,dash,edu,topic,quiz}[v]||home)()}

/* ---- 2FA (TOTP, RFC 6238 - works with Google Authenticator) ---- */
const B32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32enc(a){let bits='',o='';a.forEach(x=>bits+=x.toString(2).padStart(8,'0'));for(let i=0;i<bits.length;i+=5)o+=B32[parseInt(bits.slice(i,i+5).padEnd(5,'0'),2)];return o}
function b32dec(s){let bits='';for(const ch of s)bits+=B32.indexOf(ch).toString(2).padStart(5,'0');const a=[];for(let i=0;i+8<=bits.length;i+=8)a.push(parseInt(bits.slice(i,i+8),2));return new Uint8Array(a)}
async function totp(sec,step){const k=await crypto.subtle.importKey('raw',b32dec(sec),{name:'HMAC',hash:'SHA-1'},false,['sign']);
 const c=new Uint8Array(8);new DataView(c.buffer).setUint32(4,step);const m=new Uint8Array(await crypto.subtle.sign('HMAC',k,c)),o=m[19]&15;
 return String((((m[o]&127)<<24)|(m[o+1]<<16)|(m[o+2]<<8)|m[o+3])%1000000).padStart(6,'0')}
async function checkTotp(sec,code){if(!/^\d{6}$/.test(code))return false;const t=Math.floor(Date.now()/30000);for(const d of[-1,0,1])if(await totp(sec,t+d)===code)return true;return false}

/* ---- Google sign-in (Google Identity Services) ---- */
let gsi=null;
function initGoogle(box,onCred,warn){
 if(true){/* Google sign-in is switched off for now */const b=h('button','gbtn');const gi=document.createElement('img');gi.src='images/google-g.svg';gi.alt='';gi.width=20;gi.height=20;b.append(gi,'Continue with Google');b.onclick=()=>toast('Google sign-in is not available for now.');box.append(b);return}
 const draw=()=>{google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:r=>onCred(r.credential)});google.accounts.id.renderButton(box,{theme:'outline',size:'large',width:300,text:'continue_with'})};
 if(window.google&&google.accounts)return draw();
 if(!gsi){gsi=document.createElement('script');gsi.src='https://accounts.google.com/gsi/client';gsi.async=true;document.head.append(gsi)}
 gsi.addEventListener('load',draw)}

function failed(bad){fails++;if(fails>=3){lock=Date.now()+30000;fails=0;bad('Too many attempts. Locked for 30 seconds.')}else bad('Incorrect details ('+(3-fails)+' attempts left).')}
function finish(n,role){me={n,role};try{sessionStorage.setItem('sl',JSON.stringify(me))}catch(e){}resetIdle();route('home')}
const EMAIL=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function authView(){
 const w=h('div','auth'),l=h('div','hero'),c=h('div','card authcard');let mode='in';
 l.append(mascot(),h('span','pill','PLATFORM SECURITY ACADEMY'),h('h1'),h('p','lead','Interactive courses on platform security. Pass each quiz to unlock the next topic and earn badges as you master every layer.'));
 l.querySelector('h1').append('Learn to ',h('em',null,'secure'),' every layer.');
 const ft=h('div','chips');['🔐 Salted password hashing','📲 Two-factor authentication','🏅 Course badges','🧪 Quiz-gated lessons'].forEach(x=>ft.append(h('span','chip',x)));l.append(ft);
 w.append(l,c);app.append(w);draw();
 function draw(){c.replaceChildren();
  const tb=h('div','tabs');[['in','Log in'],['up','Sign up']].forEach(([k,t])=>{const b=h('button','tab'+(mode===k?' on':''),t);b.onclick=()=>{mode=k;draw()};tb.append(b)});c.append(tb);
  const m=h('div','msg'),bad=x=>{m.className='msg bad';m.textContent=x};
  const id=h('input'),em=h('input'),p=h('input'),r=h('select'),ec=h('input');
  em.type='email';em.placeholder='Email (e.g. name@gmail.com)';em.maxLength=80;em.autocomplete='off';
  id.placeholder=mode==='in'?'Username or email':'Username (3–20 letters/numbers)';id.maxLength=80;id.autocomplete='off';
  p.type='password';p.placeholder='Password';p.autocomplete='off';
  r.append(new Option('I am a learner','learner'),new Option('I am an educator','educator'));ec.type='password';ec.placeholder='Educator access code';ec.autocomplete='off';ec.style.display='none';r.onchange=()=>ec.style.display=r.value==='educator'?'block':'none';
  const go=h('button','btn wide',mode==='in'?'Log in':'Create account'),gb=h('div','gbox');
  if(mode==='up')c.append(em,id,p,r,ec);else c.append(id,p);
  c.append(go,h('div','or','or'),gb,m,h('p','sub','3 failed attempts lock the form for 30 seconds.'));
  initGoogle(gb,onGoogle,bad);
  go.onclick=async()=>{if(Date.now()<lock)return bad('Locked. Try again in '+Math.ceil((lock-Date.now())/1000)+'s.');if(!crypto.subtle)return bad('Secure crypto unavailable. Open via HTTPS or localhost.');
   const us=store.get('users',{});
   if(mode==='up'){const n=id.value.trim().toLowerCase(),e=em.value.trim().toLowerCase();
    if(!/^[a-z0-9]{3,20}$/.test(n))return bad('Username must be 3–20 letters or numbers.');if(!EMAIL.test(e))return bad('Enter a valid email address.');
    if(!pwOk(p.value))return bad('Password needs 10+ characters with upper, lower, number, symbol and nothing common.');
    if(r.value==='educator'&&ec.value!==EDU_CODE)return bad('Invalid educator access code.');
    if(us[n]||Object.values(us).some(u=>u.email===e))return bad('Username or email already registered.');
    const s=crypto.getRandomValues(new Uint8Array(16));us[n]={s:hex(s),h:await hashPw(p.value,s),role:r.value,email:e,joined:Date.now()};store.set('users',us);finish(n,r.value)}
   else{const k=id.value.trim().toLowerCase(),n=us[k]?k:Object.keys(us).find(q=>us[q].email===k),x=n&&us[n];
    if(x&&x.h&&await hashPw(p.value,unhex(x.s))===x.h){fails=0;afterPw(n,x)}else failed(bad)}};
  function onGoogle(cred){try{const P=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(cred.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')),q=>q.charCodeAt(0))));
   if(!P.email||!P.email_verified)return bad('Your Google email is not verified.');
   const us=store.get('users',{}),e=P.email.toLowerCase();let n=Object.keys(us).find(q=>us[q].email===e);
   if(!n){const b=e.split('@')[0].replace(/[^a-z0-9]/g,'').slice(0,14)||'user';n=b;let i=1;while(us[n])n=b+(i++);us[n]={role:'learner',email:e,google:true,joined:Date.now()};store.set('users',us)}
   afterPw(n,us[n])}catch(err){bad('Google sign-in failed.')}}
  function afterPw(n,x){x.totp&&!trusted(n)?challenge(n,x):finish(n,x.role)}
  function challenge(n,x){c.replaceChildren();const o=h('input','code'),m2=h('div','msg'),tr=h('input'),lb=h('label','chk'),cn=h('button','btn g wide','Back');
   o.placeholder='000000';o.inputMode='numeric';o.maxLength=6;o.autocomplete='one-time-code';tr.type='checkbox';tr.style.cssText='width:auto;margin:0 8px 0 0';lb.append(tr,'Trust this device for 30 days');
   c.append(h('h2',null,'Enter your code'),h('p','sub','Open your authenticator app and type the 6-digit code. It checks automatically.'),o,lb,m2,cn);o.focus();
   const bd=t=>{m2.className='msg bad';m2.textContent=t};
   o.oninput=async()=>{o.value=o.value.replace(/\D/g,'');if(o.value.length<6)return;if(Date.now()<lock)return bd('Locked. Try again shortly.');
    if(await checkTotp(x.totp,o.value)){fails=0;if(tr.checked)store.set('trust:'+n,Date.now()+2592e6);finish(n,x.role)}else{failed(bd);o.value=''}};cn.onclick=draw}}}

/* ---- Learner dashboard ---- */
function dash(){if(!me)return authView();if(!cc)return route('home');
 const T=topics(),P=prog().passed,n=T.filter(t=>P[t.id]!=null).length,all=n===T.length;
 const top=h('div','card');top.append(h('span','pill','COURSE'),h('h2',null,COURSES.find(x=>x.id===cc).t),h('p','sub',n+' of '+T.length+' topics completed. Pass each quiz ('+'75%+) to unlock the next topic.'));
 const b=h('div','bar'),i=h('i');i.style.width=(n/T.length*100)+'%';b.append(i);top.append(b);const bk=h('button','btn g','← Dashboard');bk.style.marginBottom='14px';bk.onclick=()=>route('home');app.append(bk,top);
 if(all){const bd=h('div','card badge'),m=h('div','medal','🏅');bd.append(m,h('h2',null,COURSES.find(x=>x.id===cc).t+' Badge Earned!'),h('p','sub','Awarded to '+me.n+' for passing all '+T.length+' topic assessments.'));app.append(bd)}
 T.forEach((t,k)=>{const done=P[t.id]!=null,open=k===0||P[T[k-1].id]!=null;
  const it=h('div','item '+(open?'open':'lock'));it.append(h('div','num'+(done?' done':''),done?'✓':open?k+1:'🔒'));
  const d=h('div');d.append(h('b',null,t.t),h('div','sub',done?'Passed · score '+P[t.id]+'/'+t.q.length+' · 🎖 topic badge':open?'Ready to start':'Locked: pass the previous quiz'));it.append(d);
  if(open)it.onclick=()=>route('topic',t.id);app.append(it)})}

/* ---- Topic media: image, YouTube video, learn-more links (data in resources.js) ---- */
function media(c,id){const r=(window.RES||{})[id];if(!r)return;
 if(r.img){const f=h('figure','fig'),i=document.createElement('img');i.src=r.img;i.alt=r.alt||'';i.loading='lazy';f.append(i,h('figcaption','sub',r.cap||''));c.append(f)}
 if(r.vid){const w=h('div','video'),f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+r.vid;f.title=r.vt||'Video lesson';f.loading='lazy';f.allowFullscreen=true;f.referrerPolicy='strict-origin-when-cross-origin';f.sandbox='allow-scripts allow-same-origin allow-presentation';w.append(f);
  const a=h('a','lnk','Open this video on YouTube ↗');a.href='https://www.youtube.com/watch?v='+r.vid;a.target='_blank';a.rel='noopener noreferrer';c.append(h('h3','mh','🎬 Watch: '+(r.vt||'Video lesson')),w,a)}
 if(r.links&&r.links.length){c.append(h('h3','mh','🔗 Learn more'));const u=h('ul','links');r.links.forEach(([l,url])=>{const a=h('a',null,l),li=h('li');a.href=url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);u.append(li)});c.append(u)}}

/* ---- Topic reading ---- */
function topic(){const t=topics().find(x=>x.id===cur);if(!t)return route('dash');
 const c=h('div','card read'),bk=h('button','btn g','← Back');bk.onclick=()=>route('dash');
 c.append(h('h2',null,t.t));t.b.forEach(p=>c.append(h('p',null,p)));media(c,t.id);
 const go=h('button','btn','Take the quiz →');go.onclick=()=>route('quiz',t.id);app.append(bk,h('div'),c,go)}

/* ---- Topic quiz ---- */
function quiz(){const t0=topics().find(x=>x.id===cur);if(!t0)return route('dash');
 const t={...t0,q:t0.q.map(q=>{const o=q[1].map((x,i)=>[x,i]).sort(()=>Math.random()-.5);return [q[0],o.map(x=>x[0]),o.findIndex(x=>x[1]===q[2])]})},sel=new Array(t.q.length).fill(null),c=h('div','card');c.append(h('span','pill','QUIZ'),h('h2',null,t.t),h('p','sub','Pass mark: '+PASS_PERCENT+'% ('+passMark(t.q.length)+' of '+t.q.length+' correct).'));
 const qs=[];t.q.forEach((q,i)=>{const bx=h('div');bx.style.marginTop='18px';bx.append(h('b',null,(i+1)+'. '+q[0]));const bs=[];
  q[1].forEach((o,j)=>{const b=h('button','opt',o);b.onclick=()=>{sel[i]=j;bs.forEach(x=>x.classList.remove('sel'));b.classList.add('sel')};bs.push(b);bx.append(b)});qs.push(bs);c.append(bx)});
 const sb=h('button','btn','Submit answers'),out=h('div');sb.style.marginTop='18px';
 sb.onclick=()=>{if(sel.includes(null)){out.className='msg bad';out.textContent='Please answer every question.';return}
  let s=0;t.q.forEach((q,i)=>{qs[i].forEach((b,j)=>{b.disabled=true;if(j===q[2]){b.classList.add('ok');b.textContent='✓ '+b.textContent}else if(j===sel[i]){b.classList.add('no');b.textContent='✗ '+b.textContent}});if(sel[i]===q[2])s++});
  sb.style.display='none';const pass=s>=passMark(t.q.length);out.replaceChildren();out.className='';
  out.append(h('h3',pass?'okc':'bad',(pass?'Passed! ':'Not yet. ')+'Score '+s+'/'+t.q.length));
  const r=h('div','row');r.style.marginTop='12px';
  if(pass){const p=prog();if(p.passed[t.id]==null||s>p.passed[t.id]){p.passed[t.id]=s;store.set('prog:'+me.n,p)}syncBadges();
   const nx=h('button','btn','Continue'),T=topics(),k=T.findIndex(x=>x.id===t.id);nx.onclick=()=>k<T.length-1?route('topic',T[k+1].id):route('dash');r.append(nx)}
  else{const a=h('button','btn','Review material'),b2=h('button','btn g','Retry quiz');a.onclick=()=>route('topic',t.id);b2.onclick=()=>route('quiz',t.id);r.append(a,b2)}
  out.append(r)};
 c.append(sb,out);app.append(c)}

/* ---- Educator studio (upload materials + quiz) ---- */
function edu(){if(!me||me.role!=='educator')return route('dash');
 const c=h('div','card');c.append(h('h2',null,'Upload learning material'),h('p','sub','Add a topic. It is appended to the course and learners must pass its quiz to finish the course.'));
 const cs=h('select'),t=h('input'),b=h('textarea'),q=h('textarea'),m=h('div','msg');COURSES.forEach(c=>cs.append(new Option(c.t,c.id)));b.rows=6;q.rows=5;t.placeholder='Topic title';
 b.placeholder='Learning material. Separate paragraphs with a blank line.';
 q.placeholder='Quiz, one question per line:\nQuestion?|Option A|Option B|Option C|Option D|2\n(last number = correct option, 1 to 4)';
 const add=h('button','btn','Publish topic');
 add.onclick=()=>{const ps=b.value.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean),qs=[];
  for(const ln of q.value.split('\n').map(x=>x.trim()).filter(Boolean)){const a=ln.split('|').map(x=>x.trim()),k=parseInt(a[a.length-1]);
   if(a.length<4||a.length>6||!(k>=1&&k<=a.length-2))return bad('Bad quiz line: "'+ln.slice(0,40)+'"');qs.push([a[0],a.slice(1,-1),k-1])}
  if(!t.value.trim()||!ps.length||!qs.length)return bad('Title, material and at least one quiz question are required.');
  const ex=store.get('extra',[]);ex.push({id:'e'+Date.now(),course:cs.value,t:t.value.trim().slice(0,100),b:ps,q:qs});store.set('extra',ex);route('edu')};
 const bad=x=>{m.className='msg bad';m.textContent=x};
 c.append(cs,t,b,q,add,m);app.append(c);
 const l=h('div','card');l.append(h('h3',null,'Topics you published'));const ex=store.get('extra',[]);
 if(!ex.length)l.append(h('p','sub','None yet.'));
 ex.forEach(e=>{const r=h('div','row');r.style.margin='8px 0';const d=h('button','btn r','Delete');d.onclick=()=>{store.set('extra',store.get('extra',[]).filter(x=>x.id!==e.id));route('edu')};r.append(h('span',null,e.t+' ('+e.q.length+' questions)'),d);l.append(r)});
 app.append(l)}

/* ---- Dashboard, catalog, profile ---- */
const enr=()=>store.get('enr:'+me.n,[]);
const cst=c=>{const T=ctops(c.id),P=prog().passed,n=T.filter(t=>P[t.id]!=null).length;return{n,tot:T.length,done:n===T.length}};
function ccard(c){const s=cst(c),e=enr().includes(c.id),k=h('div','card course');k.style.setProperty('--cc','hsl('+(COURSES.indexOf(c)*47+205)+' 72% 46%)');
 k.append(h('div','ico',c.i),h('b',null,c.t),h('div','sub',c.d),h('span','pill',s.tot+' topics'));
 if(e){const b=h('div','bar'),i=h('i');i.style.width=(s.n/s.tot*100)+'%';b.append(i);k.append(b,h('div','sub',s.done?'🏅 Badge earned':s.n+' / '+s.tot+' completed'))}
 const bt=h('button','btn'+(e?'':' g'),e?(s.done?'Review course':'Continue'):'Enroll & start');
 bt.onclick=()=>{if(!e){const l=enr();l.push(c.id);store.set('enr:'+me.n,l)}cc=c.id;route('dash')};k.append(bt);return k}
function stat(a,b){const c=h('div','card stat');c.append(h('b',null,b),h('span','sub',a));return c}
function home(){const E=COURSES.filter(c=>enr().includes(c.id)),bd=E.filter(c=>cst(c).done).length;
 const bn=h('div','card banner'),bt=h('div');bt.append(h('h2',null,'Welcome back, '+me.n+'!'),h('p','sub','Hi, I am ShieldBot. Pick up where you left off and keep your platform safe.'));bn.append(mascot(),bt,avatar(me.n,56));app.append(bn);
 const g=h('div','grid');g.style.margin='16px 0';g.append(stat('Enrolled courses',E.length),stat('Topics passed',Object.keys(prog().passed).length),stat('Badges earned',bd));
 app.append(g,h('h3',null,'My courses'));const g2=h('div','grid');g2.style.margin='12px 0 18px';E.forEach(c=>g2.append(ccard(c)));app.append(g2);
 if(!E.length)app.append(h('p','sub','You are not enrolled in any course yet.'));
 const cb=h('button','btn','Browse course catalog');cb.onclick=()=>route('catalog');app.append(cb)}
function catalog(){app.append(h('h2',null,'Course catalog'),h('p','sub','Pick any course on platform security. Each topic ends with a quiz you must pass to continue.'));
 const g=h('div','grid');g.style.marginTop='16px';COURSES.forEach(c=>g.append(ccard(c)));app.append(g)}
function profile(){const u=store.get('users',{})[me.n]||{},P=prog().passed,ps=COURSES.flatMap(c=>ctops(c.id)).filter(t=>P[t.id]!=null);
 const avg=ps.length?Math.round(ps.reduce((a,t)=>a+P[t.id]/t.q.length,0)/ps.length*100):0,E=COURSES.filter(c=>enr().includes(c.id));
 const c=h('div','card'),av=avatar(me.n,72);
 c.append(av,h('h2',null,me.n),h('p','sub',(me.role==='educator'?'Educator':'Learner')+(u.email?' · '+u.email:'')+(u.google?' · Google account':'')+(u.joined?' · Member since '+new Date(u.joined).toLocaleDateString():'')));
 const g=h('div','grid');g.style.marginTop='14px';g.append(stat('Topics passed',ps.length),stat('Average quiz score',avg+'%'),stat('Courses enrolled',E.length));c.append(g);
 const bc=h('div','card');bc.append(h('h3',null,'My badges'));const done=E.filter(x=>cst(x).done);
 if(!done.length)bc.append(h('p','sub','Complete every topic of a course to earn its badge.'));
 done.forEach(x=>bc.append(h('span','bd','🏅 '+x.t)));
 const pc=h('div','card'),o=h('input'),n=h('input'),m=h('div','msg');pc.append(h('h3',null,'Change password'));
 o.type=n.type='password';o.autocomplete=n.autocomplete='off';o.placeholder='Current password';n.placeholder='New password (10+ chars, mixed, not common)';
 const sv=h('button','btn','Update password'),bad=t=>{m.className='msg bad';m.textContent=t};
 sv.onclick=async()=>{const us=store.get('users',{}),x=us[me.n];if(!crypto.subtle)return bad('Secure crypto unavailable. Use HTTPS or localhost.');
  if(await hashPw(o.value,unhex(x.s))!==x.h)return bad('Current password is incorrect.');
  if(!pwOk(n.value))return bad('New password is too weak.');
  const s=crypto.getRandomValues(new Uint8Array(16));x.s=hex(s);x.h=await hashPw(n.value,s);store.set('users',us);o.value=n.value='';m.className='msg okc';m.textContent='Password updated.'};
 pc.append(o,n,sv,m);app.append(c,avatarCard(),badgesCard(),twofa());if(u.h)app.append(pc)}

const trusted=n=>store.get('trust:'+n,0)>Date.now();
const num=()=>{const i=h('input','code');i.placeholder='000000';i.inputMode='numeric';i.maxLength=6;i.autocomplete='off';return i};
function twofa(){const k=h('div','card'),body=h('div'),U=()=>store.get('users',{});k.append(h('h3',null,'📲 Two-factor authentication (2FA)'),body);draw();return k;
 function draw(){body.replaceChildren();const x=U()[me.n],m=h('div','msg'),bad=t=>{m.className='msg bad';m.textContent=t};
  if(x.totp){const i=num();body.append(h('p','okc','✅ 2FA is ON. We ask for a code when you log in.'),h('p','sub','To turn it off, type a current code from your app.'),i,m);
   i.oninput=async()=>{i.value=i.value.replace(/\D/g,'');if(i.value.length<6)return;if(await checkTotp(x.totp,i.value)){const us=U();delete us[me.n].totp;store.set('users',us);try{localStorage.removeItem('trust:'+me.n)}catch(e){}draw()}else{bad('That code is not correct.');i.value=''}}}
  else{const b=h('button','btn','Turn on 2FA');b.onclick=()=>setup(b32enc(crypto.getRandomValues(new Uint8Array(20))));body.append(h('p','sub','Adds a 6-digit code to your login. Setup takes about a minute.'),b)}
  function setup(sec){body.replaceChildren();const i=num(),cp=h('button','btn g','Copy key'),op=h('a','btn g','Open in authenticator app'),st=(n,t)=>{const d=h('div','step');d.append(h('span','sn',n),h('b',null,t));return d};
   op.href='otpauth://totp/ShieldBot:'+encodeURIComponent(me.n)+'?secret='+sec+'&issuer=ShieldBot';op.style.display='inline-block';op.style.textDecoration='none';
   cp.onclick=async()=>{try{await navigator.clipboard.writeText(sec);cp.textContent='Copied ✓'}catch(e){cp.textContent='Select the key and copy it'}};
   const r=h('div','row');r.append(cp,op);
   body.append(st('1','Install an authenticator app'),h('p','sub','Google Authenticator, Microsoft Authenticator or Authy (free).'),
    st('2','Add ShieldBot to the app'),h('p','sub','On your phone, tap the blue button. Or copy this key and choose "Enter a setup key".'),h('div','secret',sec.match(/.{4}/g).join(' ')),r,
    st('3','Type the 6-digit code'),h('p','sub','2FA turns on automatically when the code is right.'),i,m);
   i.oninput=async()=>{i.value=i.value.replace(/\D/g,'');if(i.value.length<6)return;if(!crypto.subtle)return bad('Secure crypto unavailable.');
    if(await checkTotp(sec,i.value)){const us=U();us[me.n].totp=sec;store.set('users',us);route('profile')}else{bad('Code does not match. Wait for a new code and try again.');i.value=''}}}}}

/* ---- Badges ---- */
function toast(t){const d=h('div','toast',t);d.setAttribute('role','status');document.body.append(d);setTimeout(()=>d.remove(),4500)}
function allBadges(){const P=prog().passed,u=store.get('users',{})[me.n]||{},E=enr(),T=COURSES.flatMap(c=>ctops(c.id)),n=Object.keys(P).length;
 return [{id:'first',i:'🚀',t:'First Steps',d:'Pass your first topic quiz',ok:n>=1},{id:'five',i:'🔥',t:'On a Roll',d:'Pass 5 topic quizzes',ok:n>=5},
 {id:'perfect',i:'🎯',t:'Perfect Score',d:'Get every answer right in a quiz',ok:T.some(t=>P[t.id]===t.q.length)},{id:'enroll',i:'📚',t:'Curious Mind',d:'Enroll in 3 courses',ok:E.length>=3},
 {id:'avatar',i:'🖼️',t:'Looking Good',d:'Upload a profile icon',ok:!!u.avatar},{id:'2fa',i:'🔐',t:'2FA Guardian',d:'Turn on two-factor authentication',ok:!!u.totp}]
 .concat(COURSES.map(c=>({id:'c:'+c.id,i:c.i,t:c.t+' Graduate',d:'Complete every topic in this course',ok:cst(c).done})))
 .concat([{id:'master',i:'🏆',t:'Security Master',d:'Earn every course badge',ok:COURSES.every(c=>cst(c).done)}])}
function syncBadges(){const k='bdg:'+me.n,st=store.get(k,{}),L=allBadges(),nw=[];L.forEach(b=>{if(b.ok&&!st[b.id]){st[b.id]=Date.now();nw.push(b)}});
 if(nw.length){store.set(k,st);toast('🏅 Badge unlocked: '+nw.map(b=>b.t).join(', '))}return{L,st}}
function badgesCard(){const {L,st}=syncBadges(),c=h('div','card'),g=h('div','bgrid');
 c.append(h('h3',null,'🏅 Badges ('+L.filter(b=>st[b.id]).length+' of '+L.length+' earned)'),h('p','sub','Earn badges by learning, passing quizzes and securing your account.'));
 L.forEach(b=>{const e=!!st[b.id],k=h('div','bdg'+(e?' got':''));k.append(h('div','bi',e?b.i:'🔒'),h('b',null,b.t),h('div','sub',e?'Earned '+new Date(st[b.id]).toLocaleDateString():b.d));g.append(k)});c.append(g);return c}

/* ---- Avatar / mascot ---- */
function avatar(n,s){const u=store.get('users',{})[n]||{},d=h('div','avatar');d.style.width=d.style.height=s+'px';d.style.fontSize=Math.round(s*.42)+'px';
 if(u.avatar){const i=document.createElement('img');i.src=u.avatar;i.alt='Profile icon of '+n;d.append(i)}else d.textContent=n[0].toUpperCase();return d}
function mascot(){const i=document.createElement('img');i.src='images/logo.svg';i.alt='ShieldBot, the friendly security robot';i.className='mascot';return i}
function avatarCard(){const c=h('div','card'),f=document.createElement('input'),m=h('div','msg'),bad=t=>{m.className='msg bad';m.textContent=t};
 f.type='file';f.accept='image/png,image/jpeg,image/webp';f.setAttribute('aria-label','Upload profile icon');
 c.append(h('h3',null,'🖼️ Profile icon'),h('p','sub','PNG, JPG or WebP, up to 3 MB. It is resized and saved in this browser only.'),f);
 f.onchange=()=>{const fl=f.files[0];if(!fl)return;if(!/^image\/(png|jpeg|webp)$/.test(fl.type))return bad('Please choose a PNG, JPG or WebP image.');if(fl.size>3e6)return bad('That image is larger than 3 MB.');
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const cv=document.createElement('canvas'),q=Math.min(im.width,im.height);cv.width=cv.height=160;
   cv.getContext('2d').drawImage(im,(im.width-q)/2,(im.height-q)/2,q,q,0,0,160,160);const us=store.get('users',{});us[me.n].avatar=cv.toDataURL('image/jpeg',.85);store.set('users',us);route('profile')};
   im.onerror=()=>bad('That file could not be read as an image.');im.src=r.result};r.readAsDataURL(fl)};
 if((store.get('users',{})[me.n]||{}).avatar){const rm=h('button','btn r','Remove icon');rm.style.marginTop='10px';rm.onclick=()=>{const us=store.get('users',{});delete us[me.n].avatar;store.set('users',us);route('profile')};c.append(rm)}
 c.append(m);return c}

/* ---- Video library ---- */
const FEATURED=[['gx0vlRpdFnc','Introduction to computer security and the CIA triad'],['SBcDGb9l6yo','The CIA Triad (Professor Messer, Security+ SY0-701)']];
const CHANNELS=[['Professor Messer','https://www.youtube.com/@professormesser','Free CompTIA Security+ video courses'],['Computerphile','https://www.youtube.com/@Computerphile','Short explainers on computing and security'],['NetworkChuck','https://www.youtube.com/@NetworkChuck','Beginner-friendly IT and cybersecurity'],['Microsoft Security','https://www.youtube.com/@MicrosoftSecurity','Microsoft security concepts and products'],['CISA: Secure Our World','https://www.cisa.gov/secure-our-world','Practical tips from the US cyber agency'],['Microsoft Learn Training','https://learn.microsoft.com/en-us/training/','Free learning paths including security']];
function ytId(v){v=v.trim();try{const u=new URL(v);let id=null;if(u.hostname==='youtu.be')id=u.pathname.slice(1);else if(/(^|\.)youtube\.com$/.test(u.hostname))id=u.searchParams.get('v')||u.pathname.split('/')[2];return id&&/^[\w-]{11}$/.test(id.slice(0,11))?id.slice(0,11):null}catch(e){return /^[\w-]{11}$/.test(v)?v:null}}
function videos(){app.append(h('h2',null,'Video library'),h('p','sub','Watch suggested lessons, or paste any YouTube link to watch it here.'));
 const c=h('div','card'),box=h('div'),ttl=h('h3'),m=h('div','msg');c.style.marginTop='16px';
 const play=(id,t)=>{box.replaceChildren();const w=h('div','video'),f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+id;f.title=t;f.allowFullscreen=true;f.referrerPolicy='strict-origin-when-cross-origin';f.sandbox='allow-scripts allow-same-origin allow-presentation';w.append(f);
  const a=h('a','lnk','Open on YouTube ↗');a.href='https://www.youtube.com/watch?v='+id;a.target='_blank';a.rel='noopener noreferrer';ttl.textContent=t;box.append(w,a)};
 const row=h('div','row');row.style.margin='12px 0';FEATURED.forEach(([id,t])=>{const b=h('button','btn g',t);b.onclick=()=>play(id,t);row.append(b)});
 const inp=h('input'),go=h('button','btn','Watch');inp.placeholder='Paste a YouTube link, e.g. https://www.youtube.com/watch?v=...';inp.maxLength=200;
 go.onclick=()=>{const id=ytId(inp.value);if(!id){m.className='msg bad';m.textContent='That does not look like a YouTube link.';return}m.textContent='';play(id,'Your video')};
 c.append(ttl,box,row,inp,go,m);app.append(c);play(FEATURED[0][0],FEATURED[0][1]);
 const l=h('div','card');l.append(h('h3',null,'Suggested channels and websites'));const u=h('ul','links');
 CHANNELS.forEach(([n,url,d])=>{const li=h('li'),a=h('a',null,n);a.href=url;a.target='_blank';a.rel='noopener noreferrer';li.append(a,' – '+d);u.append(li)});l.append(u);app.append(l)}

/* ---- About, FAQ, Contact ---- */
function about(){const c=h('div','card');c.append(h('span','pill','ABOUT'),h('h2',null,'About ShieldBot'),
 h('p',null,'ShieldBot is an e-learning platform for ITA 216 Platform Security. Learners choose a course, read the material, and pass a short quiz after every topic before the next one unlocks. Completing a course earns a badge.'),
 h('p',null,'The platform practices what it teaches: salted password hashing, login lockout, session timeout, a Content Security Policy and input handling that blocks script injection.'));
 const g=h('div','grid');g.style.margin='16px 0';
 [['🎯','Our goal','Make platform security concepts clear, practical and testable.'],['📚','Content',COURSES.length+' courses covering fundamentals, Windows, cloud, mobile, boot security, risk and patching.'],['👥','Project team','Midterm group project (add your three member names here).']].forEach(([i,a,b])=>{const k=h('div','card');k.append(h('div','ico',i),h('b',null,a),h('div','sub',b));g.append(k)});app.append(c,g)}
function faq(){app.append(h('h2',null,'Frequently Asked Questions'));const l=h('div');l.style.marginTop='16px';
 [['Do I need an account?','Yes. Learning materials are available only to logged-in users so your progress and badges are saved to your account.'],
 ['How do I unlock the next topic?','Pass the quiz at the end of the current topic. The pass mark is 75%. You can review the material and retry as many times as you need.'],
 ['How do I earn a badge?','Pass the quiz of every topic in a course. The badge appears on the course page, your dashboard and your profile.'],
 ['Can I take more than one course?','Yes. Enroll in as many courses from the catalog as you like and learn at your own pace.'],
 ['How do I turn on 2FA?','Open your Profile, choose Set up 2FA, add the key to an authenticator app and confirm with a 6-digit code. After that every login asks for a code.'],
 ['Can I log in with Google?','Not right now. Google sign-in is not available yet, so please sign up with your email, username and a password.'],
 ['What makes a password acceptable here?','At least 10 characters with upper and lower case letters, a number and a symbol, and not a common password.'],
 ['Why was I locked out of logging in?','After 3 failed attempts the form locks for 30 seconds to slow down password guessing. You are also logged out after 5 minutes of inactivity.'],
 ['How do educators add material?','Create an educator account with the access code, open Educator Studio and publish a topic with its quiz into any course.'],
 ['Where is my data stored?','In your browser on this device only. Nothing is sent to a server in this demo.']].forEach(([q,a])=>{const d=h('details');d.append(h('summary',null,q),h('p',null,a));l.append(d)});app.append(l)}
function contact(){const c=h('div','card');c.style.maxWidth='560px';c.append(h('h2',null,'Contact us'),h('p','sub','Questions or feedback about the course? Send us a message.'));
 const n=h('input'),e=h('input'),t=h('textarea'),m=h('div','msg');n.placeholder='Your name';e.placeholder='Email address';e.type='email';t.placeholder='Your message';t.rows=5;n.maxLength=60;e.maxLength=80;t.maxLength=1000;
 const sb=h('button','btn','Send message');sb.onclick=()=>{if(!n.value.trim()||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.value)||t.value.trim().length<10){m.className='msg bad';m.textContent='Enter your name, a valid email and a message of at least 10 characters.';return}
  const l=store.get('messages',[]);l.push({n:n.value.trim(),e:e.value.trim(),t:t.value.trim(),at:Date.now()});store.set('messages',l);n.value=e.value=t.value='';m.className='msg okc';m.textContent='Thanks! Your message was saved (demo: no server sends it).'};
 c.append(n,e,t,sb,m);app.append(c)}

try{const sv=JSON.parse(sessionStorage.getItem('sl')||'null'),us=store.get('users',{});if(sv&&us[sv.n]&&us[sv.n].role===sv.role){me=sv;resetIdle()}}catch(e){}
route('home');
