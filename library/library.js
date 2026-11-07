(function(){
'use strict';
var rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var lib=document.getElementById('lib'), chips=document.getElementById('chips'), sections=[], all=[];
var ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
var PLAY='<svg viewBox="0 0 10 12" width="10" height="12" aria-hidden="true"><path d="M0 0l10 6-10 6z" fill="currentColor"/></svg>';

function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}

function prep(it,sec,grp){
  it.sec=sec; it.grp=grp; it.kind=it.vid?'film':'photo'; all.push(it); sec.items.push(it); return it;
}

function thumb(it,eager){
  var th=el('div','thumb'); var ar=it.ar||(it.w/it.h); th.style.aspectRatio=ar; th.style.setProperty('--ar',ar);
  var im=new Image(); im.src=it.th; im.alt=it.n; im.loading=eager?'eager':'lazy'; im.decoding='async'; im.width=it.w; im.height=it.h; th.appendChild(im);
  if(it.kind==='film') th.insertAdjacentHTML('beforeend','<span class="badge lbl">Video</span><span class="play">'+PLAY+'</span>');
  return th;
}

function hover(btn,it){
  if(it.kind!=='film')return;
  var th=btn.querySelector('.thumb'), v=null;
  var start=function(){ if(rm||v)return; v=document.createElement('video'); v.muted=true;v.loop=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.src=it.v;
    th.appendChild(v); v.play().then(function(){v.classList.add('on')}).catch(function(){}); };
  var stop=function(){ if(v){v.remove();v=null} };
  btn.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')start()});
  btn.addEventListener('pointerleave',stop); btn.addEventListener('focus',start); btn.addEventListener('blur',stop);
}

function card(it,eager){
  var li=el('li','card');
  var b=el('button','open'); b.type='button'; b.setAttribute('aria-label','Open '+it.n+' ('+it.fmt+')');
  b.appendChild(thumb(it,eager));
  b.appendChild(el('div','cap','<span class="n">'+esc(it.n)+'</span><span class="alt">'+esc(it.fmt)+(it.sz?' · '+esc(it.sz):'')+'</span>'));
  b.addEventListener('click',function(){openLb(it)}); hover(b,it);
  li.appendChild(b); return li;
}

function setCard(set,sec,grp,eager){
  var li=el('li','card set');
  li.appendChild(el('p','set-h','<span class="lbl">'+esc(set.label)+'</span><span class="n">'+esc(set.name)+'</span>'));
  var pair=el('div','pair');
  set.items.forEach(function(it){
    prep(it,sec,grp);
    var b=el('button','open'); b.type='button'; b.setAttribute('aria-label','Open '+it.n+' ('+it.fmt+')');
    b.appendChild(thumb(it,eager)); b.appendChild(el('span','alt',esc(it.fmt)));
    b.addEventListener('click',function(){openLb(it)});
    pair.appendChild(b);
  });
  li.appendChild(pair); return li;
}

function build(data){
  data.forEach(function(s,si){
    var sec={id:s.id,title:s.title,items:[],el:null}; sections.push(sec);
    var wrap=el('section','sec'); wrap.id='s-'+s.id; sec.el=wrap;
    var head=el('header','sec-h');
    head.innerHTML='<span class="sec-no" aria-hidden="true">'+ROMAN[si]+'</span><div><p class="lbl eyebrow">'+String(si+1).padStart(2,'0')+' · <span class="sec-count"></span></p><h2 class="disp">'+esc(s.title)+'</h2><p class="body sec-d">'+esc(s.desc||'')+'</p></div>';
    wrap.appendChild(head);
    s.groups.forEach(function(g){
      var n=(g.items||[]).length+(g.sets||[]).length;
      if(!n)return;
      var gw=el('div','grp'); gw.style.setProperty('--h',g.h+'px'); gw.style.setProperty('--hm',(g.hm||g.h)+'px');
      gw.appendChild(el('h3','grp-h lbl',esc(g.name)+' <span>'+n+'</span>'));
      var ul=el('ul','row');
      (g.sets||[]).forEach(function(set){ ul.appendChild(setCard(set,sec,g.name,si<1)); });
      (g.items||[]).forEach(function(it){ prep(it,sec,g.name); ul.appendChild(card(it,si<1)); });
      gw.appendChild(ul); wrap.appendChild(gw);
    });
    head.querySelector('.sec-count').textContent=sec.items.length+(sec.items.length===1?' file':' files');
    lib.appendChild(wrap);
  });
  var nVid=all.filter(function(i){return i.vid}).length;
  document.getElementById('counts').textContent=(all.length-nVid)+' images · '+nVid+' videos · '+sections.length+' categories';
  [{id:'all',title:'All',n:all.length}].concat(sections.map(function(s){return {id:s.id,title:s.title,n:s.items.length}})).forEach(function(c){
    var bt=el('button','chip',esc(c.title)+'<span>'+c.n+'</span>'); bt.type='button'; bt.dataset.id=c.id; bt.setAttribute('aria-pressed',c.id==='all');
    bt.addEventListener('click',function(){filter(c.id)}); chips.appendChild(bt);
  });
}

function filter(id){
  [].forEach.call(chips.children,function(b){b.setAttribute('aria-pressed',b.dataset.id===id)});
  sections.forEach(function(s){ s.el.hidden=!(id==='all'||s.id===id); });
  var top=lib.getBoundingClientRect().top+window.scrollY-(chips.offsetHeight+12);
  window.scrollTo({top:top,behavior:rm?'auto':'smooth'});
}

/* lightbox: steps through the section the item belongs to */
var lb=document.getElementById('lb'), stage=document.getElementById('lbStage'), idx=0, list=[], opener=null;
function openLb(it){
  list=it.sec.items; idx=list.indexOf(it); opener=document.activeElement;
  lb.hidden=false; document.documentElement.style.overflow='hidden'; show();
  document.getElementById('lbClose').focus();
}
function show(){
  var it=list[idx]; stage.innerHTML='';
  if(it.kind==='film'){
    var v=document.createElement('video'); v.controls=true; v.autoplay=true; v.muted=true; v.loop=true; v.playsInline=true; v.poster=it.th; v.src=it.v; stage.appendChild(v);
    v.play().catch(function(){});
  } else {
    var im=new Image(); im.alt=it.n; im.src=it.v; stage.appendChild(im);
  }
  document.getElementById('lbCount').textContent=(idx+1)+' / '+list.length+' · '+it.sec.title;
  document.getElementById('lbCat').textContent=it.sec.title+' · '+it.grp;
  document.getElementById('lbName').textContent=it.n+' · '+it.fmt+(it.sz?' · '+it.sz:'');
  var dl=document.getElementById('lbDl'); dl.textContent=/\.pdf$/i.test(it.fn)?'Download PDF':it.kind==='film'?'Download video':'Download'; dl.href=it.f; dl.setAttribute('download',it.fn);
  var d2=document.getElementById('lbDl2'); if(it.alt){d2.hidden=false;d2.href=it.alt;d2.setAttribute('download',it.altfn||it.alt.split('/').pop())}else d2.hidden=true;
  lb.setAttribute('aria-label',it.n+' preview');
}
function step(d){idx=(idx+d+list.length)%list.length;show()}
function closeLb(){lb.hidden=true;stage.innerHTML='';document.documentElement.style.overflow='';if(opener&&opener.focus)opener.focus()}
document.getElementById('lbClose').addEventListener('click',closeLb);
document.getElementById('lbPrev').addEventListener('click',function(){step(-1)});
document.getElementById('lbNext').addEventListener('click',function(){step(1)});
document.addEventListener('keydown',function(e){
  if(lb.hidden)return;
  if(e.key==='Escape')closeLb();
  else if(e.key==='ArrowLeft')step(-1);
  else if(e.key==='ArrowRight')step(1);
  else if(e.key==='Tab'){
    var f=[].filter.call(lb.querySelectorAll('button,a[href]'),function(x){return x.getClientRects().length});
    if(!f.length)return; var a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
    else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
  }
});
var sx=null,sy=null;
lb.addEventListener('touchstart',function(e){if(e.touches.length===1){sx=e.touches[0].clientX;sy=e.touches[0].clientY}},{passive:true});
lb.addEventListener('touchend',function(e){
  if(sx==null)return; var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy; sx=null;
  if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)step(dx<0?1:-1);
},{passive:true});
lb.addEventListener('click',function(e){if(e.target===stage||e.target===lb)closeLb()});

fetch('items.json').then(function(r){return r.json()}).then(build);
})();
