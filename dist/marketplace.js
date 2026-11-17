const $=s=>document.querySelector(s),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const categories=[['all','All'],['sofa','Sofas'],['chair','Chairs'],['table','Tables'],['desk','Desks'],['storage','Storage'],['lamp','Lighting']];
const platforms=[['all','All sources'],['Facebook Marketplace','Facebook Marketplace'],['OfferUp','OfferUp'],['Craigslist','Craigslist']];
const sorts=[['recent','Newest first'],['price-asc','Price: low to high'],['price-desc','Price: high to low'],['nearest','Nearest first'],['savings','Biggest savings']];
const defaults={q:'',category:'all',platform:'all',budget:'1000',distance:'10',available:true,portable:false,sort:'recent'};
const chips=(name,list)=>list.map(([value,label],i)=>`<label class="mk-chip"><input type="radio" name="${name}" value="${escape(value)}"${i?'':' checked'}><span>${escape(label)}</span></label>`).join('');

document.querySelector('.mode-tabs').insertAdjacentHTML('beforeend','<button type="button" id="market-tab" aria-pressed="false">Marketplace</button>');
const section=document.createElement('section');section.id='market-mode';section.hidden=true;document.querySelector('footer').before(section);
section.innerHTML=`<div class="mk-hero"><div><p class="eyebrow">SECONDHAND &amp; UNIQUE FINDS</p><h1>Good pieces. A second chapter.</h1><p class="intro">Browse pre-loved furniture near Austin, compare what you'd save against buying new, and send favorites to your room board.</p></div><p class="mk-disclosure"><b>Demo listings</b> Sample inventory in the style of Facebook Marketplace, OfferUp and Craigslist feeds. Listings and sellers are fictional.</p></div>
<div class="mk-layout"><aside class="mk-filters" id="market-filter-panel"><form id="market-filters" novalidate>
<label class="mk-search"><span class="visually-hidden">Search listings</span><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4.5 4.5"/></svg><input name="q" type="search" placeholder="Walnut, lamp, Zilker…" maxlength="100" autocomplete="off"></label>
<fieldset><legend>Category</legend><div class="mk-chips">${chips('category',categories)}</div></fieldset>
<fieldset><legend>Source</legend><div class="mk-chips mk-chips-stack">${chips('platform',platforms)}</div></fieldset>
<div class="mk-range"><label for="market-budget">Max price</label><output id="market-budget-out" for="market-budget">$1,000</output><input id="market-budget" name="budget" type="range" min="50" max="1000" step="25" value="1000"></div>
<div class="mk-range"><label for="market-distance">Distance</label><output id="market-distance-out" for="market-distance">Within 10 mi</output><input id="market-distance" name="distance" type="range" min="1" max="10" step="1" value="10"></div>
<fieldset class="mk-toggles"><legend class="visually-hidden">Options</legend><label><input name="available" type="checkbox" checked> Available now</label><label><input name="portable" type="checkbox"> Fits in a car or disassembles</label></fieldset>
<button type="button" class="mk-reset" id="market-reset">Reset filters</button>
</form></aside>
<div class="mk-main"><div class="mk-toolbar"><button type="button" class="mk-filter-toggle" id="market-filter-toggle" aria-controls="market-filter-panel" aria-expanded="false">Filters</button><p id="market-status" role="status" aria-live="polite"></p><label class="mk-sort">Sort<select name="sort" form="market-filters">${sorts.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label></div>
<div id="market-active" class="mk-active"></div><div id="market-results" class="mk-grid" aria-busy="false"></div></div></div>
<dialog id="market-dialog" class="mk-dialog" aria-labelledby="market-dialog-title"><div id="market-dialog-body"></div></dialog>`;

const form=$('#market-filters'),results=$('#market-results'),status=$('#market-status'),dialog=$('#market-dialog');
let listings=[],loaded=false,controller,timer;const saved=new Set();

for(const m of ['photo','planner','board'])$('#'+m+'-tab')?.addEventListener('click',()=>{section.hidden=true;$('#market-tab').setAttribute('aria-pressed','false');});
$('#market-tab').onclick=()=>{for(const m of ['photo','planner','board']){const mode=$('#'+m+'-mode'),tab=$('#'+m+'-tab');if(mode)mode.hidden=true;tab?.setAttribute('aria-pressed','false');}section.hidden=false;$('#market-tab').setAttribute('aria-pressed','true');if(!loaded)search();};

function artwork(p){const c=escape(p.color);let shape=p.shape==='lamp'?`<path d="M155 62h50l18 48h-86z" fill="${c}"/><path d="M180 110v90m-32 0h64" stroke="${c}" stroke-width="8"/>`:p.shape==='table'?`<ellipse cx="180" cy="115" rx="100" ry="27" fill="${c}"/><path d="M180 125v75m-45 0h90" stroke="${c}" stroke-width="14"/>`:p.shape==='sofa'||p.shape==='chair'?`<rect x="${p.shape==='chair'?115:65}" y="80" width="${p.shape==='chair'?130:230}" height="100" rx="18" fill="${c}"/><rect x="${p.shape==='chair'?100:50}" y="120" width="30" height="65" rx="10" fill="${c}"/><rect x="${p.shape==='chair'?230:280}" y="120" width="30" height="65" rx="10" fill="${c}"/><path d="M130 180v20m100-20v20" stroke="#67513f" stroke-width="7"/>`:`<rect x="65" y="95" width="230" height="${p.shape==='desk'?18:80}" rx="4" fill="${c}"/><path d="M80 113v85m200-85v85" stroke="${c}" stroke-width="9"/>`;return `<svg viewBox="0 25 360 205" role="img" aria-label="Illustration of ${escape(p.name)}"><rect y="25" width="360" height="205" fill="#ece9df"/><ellipse cx="180" cy="207" rx="125" ry="13" fill="#d8d3c6"/>${shape}</svg>`;}
const savings=p=>p.retail>p.price?Math.round((1-p.price/p.retail)*100):0;
const ago=d=>d===0?'Listed today':d===1?'Listed yesterday':`Listed ${d} days ago`;
const dot=platform=>`<span class="mk-dot" data-platform="${escape(platform)}"></span>`;

function card(p){const off=savings(p),available=p.status==='Available',isSaved=saved.has(p.id);
 return `<article class="mk-card${available?'':' is-pending'}"><button type="button" class="mk-art" data-market-open="${escape(p.id)}" aria-label="View details for ${escape(p.name)}">${artwork(p)}<span class="mk-badge mk-badge-source">${dot(p.platform)}${escape(p.platform)}</span>${!available?'<span class="mk-badge mk-badge-status">Pending</span>':p.posted===0?'<span class="mk-badge mk-badge-new">New today</span>':''}<span class="mk-art-note">Illustration</span></button>
 <div class="mk-body"><div class="mk-price-row"><strong>${money(p.price)}</strong>${off?`<span class="mk-save-pill">${off}% below new</span>`:''}</div><h3><button type="button" class="mk-title" data-market-open="${escape(p.id)}">${escape(p.name)}</button></h3><p class="mk-meta">${escape(p.area.replace(', Austin',''))} · ${p.distance} mi · ${ago(p.posted)}</p><p class="mk-cond">${escape(p.condition)}</p><p class="mk-dims">${p.width}″ W × ${p.depth}″ D × ${p.height}″ H${p.portable?' · <span>Portable</span>':''}</p>
 <div class="mk-actions"><button type="button" class="mk-btn" data-market-open="${escape(p.id)}">Details &amp; pickup</button><button type="button" class="mk-btn mk-btn-primary" data-market-save="${escape(p.id)}" ${!available||isSaved?'disabled':''}>${isSaved?'Saved ✓':available?'Save':'Unavailable'}</button></div></div></article>`;}

function activeChips(){const data=new FormData(form),out=[];
 const add=(key,label)=>out.push(`<button type="button" class="mk-pill" data-clear="${key}">${escape(label)}<span aria-hidden="true">×</span><span class="visually-hidden"> remove filter</span></button>`);
 if(data.get('q').trim())add('q',`“${data.get('q').trim()}”`);if(data.get('category')!=='all')add('category',categories.find(c=>c[0]===data.get('category'))[1]);if(data.get('platform')!=='all')add('platform',data.get('platform'));if(data.get('budget')!==defaults.budget)add('budget','Under '+money(Number(data.get('budget'))));if(data.get('distance')!==defaults.distance)add('distance','Within '+data.get('distance')+' mi');if(!form.elements.available.checked)add('available','Including pending');if(form.elements.portable.checked)add('portable','Portable only');
 $('#market-active').innerHTML=out.length?out.join('')+'<button type="button" class="mk-clear-all" data-clear="all">Clear all</button>':'';
 $('#market-filter-toggle').textContent=out.length?`Filters (${out.length})`:'Filters';}

function syncOutputs(){$('#market-budget-out').textContent=Number(form.elements.budget.value)>=1000?'$1,000+':money(Number(form.elements.budget.value));const d=form.elements.distance.value;$('#market-distance-out').textContent=d==='10'?'Within 10 mi':`Within ${d} mi`;}

async function search(){controller?.abort();controller=new AbortController();const current=controller;syncOutputs();activeChips();
 const params=new URLSearchParams(new FormData(form));for(const name of ['available','portable'])params.set(name,form.elements[name].checked?'true':'false');if(params.get('budget')==='1000')params.set('budget','');
 results.setAttribute('aria-busy','true');if(!loaded){results.innerHTML=Array.from({length:6},()=>'<div class="mk-card mk-skeleton" aria-hidden="true"><div></div><p></p><p></p></div>').join('');status.textContent='Finding pieces…';}else results.classList.add('is-loading');
 try{const response=await fetch('/api/marketplace?'+params,{signal:current.signal});if(!response.ok)throw Error();const data=await response.json();if(current!==controller)return;listings=data.listings;loaded=true;
  status.innerHTML=listings.length?`<b>${listings.length}</b> ${listings.length===1?'piece':'pieces'} near central Austin`:'No matches';
  results.innerHTML=listings.length?listings.map(card).join(''):'<div class="mk-empty"><h2>Nothing matches yet.</h2><p>Try a broader search, another source or a higher price limit. New pieces are listed every day.</p><button type="button" class="mk-btn" data-clear="all">Clear all filters</button></div>';
 }catch(e){if(e.name!=='AbortError'){status.textContent='The marketplace feed could not load.';results.innerHTML='<div class="mk-empty"><h2>We couldn’t load listings.</h2><p>Check your connection and try again.</p><button type="button" class="mk-btn" id="market-retry">Try again</button></div>';}}
 finally{if(current===controller){results.setAttribute('aria-busy','false');results.classList.remove('is-loading');}}}

function save(p,pickupPreference=''){if(!p||p.status!=='Available'||saved.has(p.id))return;window.dispatchEvent(new CustomEvent('roomedit-market-save',{detail:{...p,pickupPreference}}));saved.add(p.id);
 for(const b of document.querySelectorAll(`[data-market-save="${CSS.escape(p.id)}"]`)){b.textContent='Saved ✓';b.disabled=true;}
 status.innerHTML=`<b>${escape(p.name)}</b> saved. Open <button type="button" class="mk-link" id="market-to-board">Room board &amp; move plan</button> to compare costs and fit.`;}

function openDetails(p){const off=savings(p),available=p.status==='Available',isSaved=saved.has(p.id);
 $('#market-dialog-body').innerHTML=`<button type="button" class="mk-close" data-close aria-label="Close">×</button><div class="mk-dialog-grid"><div class="mk-dialog-art">${artwork(p)}<p class="mk-art-caption">Illustration · ask the seller for current photos</p></div><div class="mk-dialog-info"><p class="eyebrow">${dot(p.platform)}${escape(p.platform)} · ${escape(p.status)}</p><h2 id="market-dialog-title">${escape(p.name)}</h2><div class="mk-price-row"><strong>${money(p.price)}</strong>${off?`<span class="mk-save-pill">Save about ${money(p.retail-p.price)} vs. ~${money(p.retail)} new</span>`:''}</div>
 <dl class="mk-facts"><div><dt>Condition</dt><dd>${escape(p.condition)}</dd></div><div><dt>Location</dt><dd>${escape(p.area)} · ${p.distance} mi</dd></div><div><dt>Size</dt><dd>${p.width}″ W × ${p.depth}″ D × ${p.height}″ H</dd></div><div><dt>Moving</dt><dd>${p.portable?'Portable or disassembles':'Needs a truck or van and two people'}</dd></div><div><dt>Seller</dt><dd>${escape(p.seller)} · identity not verified</dd></div><div><dt>Listed</dt><dd>${ago(p.posted)}</dd></div></dl>
 ${available?`<fieldset class="mk-slots"><legend>Proposed pickup window</legend>${p.slots.map((s,i)=>`<label><input type="radio" name="pickup" value="${escape(s)}"${i?'':''}> ${escape(s)}</label>`).join('')}<label><input type="radio" name="pickup" value="" checked> Decide later</label></fieldset>`:'<p class="mk-pending-note">Another buyer has a pending pickup. Check back later.</p>'}
 <button type="button" class="primary" data-dialog-save="${escape(p.id)}" ${!available||isSaved?'disabled':''}>${isSaved?'Saved to room board ✓':available?'Save to room board':'Pending · unavailable'}</button><p class="note">Saving a pickup preference doesn’t book anything. Meet in a public or well-lit place, check the piece in person and pay only after you’ve seen it.</p></div></div>`;
 dialog.showModal();}

form.addEventListener('submit',e=>{e.preventDefault();search();});
form.addEventListener('input',e=>{syncOutputs();clearTimeout(timer);timer=setTimeout(search,e.target.name==='q'?250:120);});
$('#market-reset').onclick=()=>reset();
function reset(key='all'){if(key==='all'||key==='q')form.elements.q.value='';for(const k of ['category','platform'])if(key==='all'||key===k)form.querySelector(`[name=${k}][value="all"]`).checked=true;if(key==='all'||key==='budget')form.elements.budget.value=defaults.budget;if(key==='all'||key==='distance')form.elements.distance.value=defaults.distance;if(key==='all'||key==='available')form.elements.available.checked=true;if(key==='all'||key==='portable')form.elements.portable.checked=false;search();}
$('#market-filter-toggle').onclick=e=>{const panel=$('#market-filter-panel'),open=!panel.classList.contains('is-open');panel.classList.toggle('is-open',open);e.currentTarget.setAttribute('aria-expanded',String(open));};
section.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
 if(t.dataset.clear)return reset(t.dataset.clear);
 if(t.id==='market-retry')return search();
 if(t.id==='market-to-board')return $('#board-tab')?.click();
 if(t.dataset.marketOpen)return openDetails(listings.find(p=>p.id===t.dataset.marketOpen));
 if(t.dataset.marketSave)return save(listings.find(p=>p.id===t.dataset.marketSave));
 if(t.dataset.dialogSave){const p=listings.find(p=>p.id===t.dataset.dialogSave);save(p,dialog.querySelector('[name=pickup]:checked')?.value||'');t.textContent='Saved to room board ✓';t.disabled=true;return;}
 if('close' in t.dataset)dialog.close();});
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
