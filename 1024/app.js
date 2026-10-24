const $=s=>document.querySelector(s);
let articles=[],region='전체',category='전체',savedOnly=false,limit=14,loading=false,saved=new Map();
try{saved=new Map(JSON.parse(localStorage.getItem('world-headlines-saved')||'[]').filter(x=>Array.isArray(x)&&x[1]?.url?.startsWith('https://')));}catch{}
$('#date').textContent=new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'long',timeZone:'Asia/Seoul'}).format(new Date())+' · SEOUL';
function persist(){try{localStorage.setItem('world-headlines-saved',JSON.stringify([...saved]));}catch{}$('#savedCount').textContent=saved.size;}
function filters(values,target,value,select){$(target).replaceChildren(...values.map(v=>{const b=document.createElement('button');b.textContent=v;b.className=v===value?'active':'';b.setAttribute('aria-pressed',v===value);b.onclick=()=>{select(v);limit=14;draw();render();};return b;}));}
function draw(){filters(['전체','아시아','유럽','미주','중동','아프리카'],'#regions',region,v=>region=v);filters(['전체','세계','경제','테크','환경','문화'],'#categories',category,v=>category=v);}
function safe(url){try{const u=new URL(url);return u.protocol==='https:'?u.href:null;}catch{return null;}}
function ago(value){const m=Math.max(0,Math.floor((Date.now()-Date.parse(value))/60000));return m<1?'방금 전':m<60?m+'분 전':m<1440?Math.floor(m/60)+'시간 전':Math.floor(m/1440)+'일 전';}
function notice(message){$('#notice').textContent=message;$('#notice').hidden=!message;}
function render(){
 const query=$('#search').value.trim().toLowerCase();
 const list=(savedOnly?[...saved.values()]:articles).filter(a=>(region==='전체'||a.region===region)&&(category==='전체'||a.category===category)&&(!query||`${a.title} ${a.source}`.toLowerCase().includes(query))).sort((a,b)=>($('#sort').value==='latest'?-1:1)*(Date.parse(a.published)-Date.parse(b.published)));
 $('#count').textContent=(savedOnly?'저장한 기사 ':'헤드라인 ')+list.length+'개';$('#articles').replaceChildren();
 for(const a of list.slice(0,limit)){
  const card=document.createElement('article');card.className='article';const image=document.createElement('a');image.className='image';image.href=safe(a.url);image.target='_blank';image.rel='noopener noreferrer';image.setAttribute('aria-label',a.title+' 원문 보기 (새 탭)');
  const fallback=()=>{const f=document.createElement('div');f.className='placeholder';f.textContent='◎';f.setAttribute('aria-hidden','true');image.replaceChildren(f);};
  if(safe(a.image)){const img=document.createElement('img');img.src=a.image;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.onerror=fallback;image.append(img);}else fallback();
  const tags=document.createElement('div');tags.className='tags';tags.textContent=a.category;const r=document.createElement('span');r.textContent=a.region;tags.append(r);
  const h=document.createElement('h3'),link=document.createElement('a');link.href=safe(a.url);link.target='_blank';link.rel='noopener noreferrer';link.textContent=a.title;h.append(link);
  const meta=document.createElement('div');meta.className='meta';const source=document.createElement('b');source.textContent=a.source;const time=document.createElement('time');time.dateTime=a.published;time.textContent=ago(a.published);time.title=new Date(a.published).toLocaleString('ko-KR');meta.append(source,document.createTextNode('· '),time);
  const b=document.createElement('button');b.className='bookmark';const active=saved.has(a.url);b.textContent=active?'▣':'▢';b.setAttribute('aria-pressed',active);b.setAttribute('aria-label',(active?'저장 취소: ':'기사 저장: ')+a.title);b.onclick=()=>{saved.has(a.url)?saved.delete(a.url):saved.set(a.url,a);persist();render();};card.append(image,tags,h,meta,b);$('#articles').append(card);
 }
 if(!list.length){const p=document.createElement('div');p.className='empty';p.textContent=savedOnly?'저장된 기사 또는 조건에 맞는 기사가 없습니다.':'조건에 맞는 뉴스가 없습니다.';const b=document.createElement('button');b.textContent='전체 뉴스 보기';b.onclick=()=>{region=category='전체';savedOnly=false;$('#search').value='';$('#savedView').setAttribute('aria-pressed','false');draw();render();};p.append(document.createElement('br'),b);$('#articles').append(p);}
 $('#more').hidden=list.length<=limit;
}
async function load(){if(loading)return;loading=true;$('#refresh').disabled=true;$('#refresh').textContent='↻ 불러오는 중';try{const response=await fetch('./news.json?t='+Date.now(),{cache:'no-store'});if(!response.ok)throw Error('connection');const data=await response.json();if(!Array.isArray(data.articles))throw Error('data');articles=data.articles.filter(a=>safe(a.url)&&typeof a.title==='string'&&!isNaN(Date.parse(a.published)));const date=new Date(data.updatedAt);$('#updated').textContent='수집 '+date.toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'})+' KST';notice((Date.now()-date)>10800000?'뉴스 수집이 지연되고 있습니다. 마지막으로 수집된 헤드라인을 표시합니다.':data.feedErrors?.length?'일부 피드 연결이 지연되어 수집에 성공한 소식을 표시합니다.':'');render();}catch{notice('뉴스를 불러오지 못했습니다. 잠시 후 새로고침을 눌러주세요.');if(!articles.length){$('#articles').innerHTML='<p class="empty">뉴스 연결을 기다리고 있습니다.<br>인터넷 연결을 확인하고 다시 시도해 주세요.</p>';$('#count').textContent='연결 대기';}}finally{loading=false;$('#refresh').disabled=false;$('#refresh').textContent='↻ 새로고침';}}
$('#savedView').onclick=()=>{savedOnly=!savedOnly;limit=14;$('#savedView').setAttribute('aria-pressed',savedOnly);render();$('#news').scrollIntoView({behavior:'smooth'});};$('#search').oninput=()=>{limit=14;render();};$('#sort').onchange=render;$('#refresh').onclick=load;$('#more').onclick=()=>{limit+=12;render();};persist();draw();load();setInterval(load,600000);

