(function(){
'use strict';
var CATS=['Posts','Xiaohongshu','Stories','Reels & video','Ads','Email','In-store','Google','Brand digital','Print','Menu','Website'];
var rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var grid=document.getElementById('grid'), chips=document.getElementById('chips'), items=[], current='All';

function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function esc(s){return s.replace(/&/g,'&amp;')}
var PLAY='<svg viewBox="0 0 10 12" width="10" height="12" aria-hidden="true"><path d="M0 0l10 6-10 6z" fill="currentColor"/></svg>';

function build(data){
  data.forEach(function(d){ d.cat=d.t; d.kind=d.vid?'film':'photo'; d.name=d.n; d.thumb=d.th; d.view=d.v; d.full=d.f; d.file=d.fn; items.push(d); });
  var nv=items.filter(function(i){return i.vid}).length;
  document.getElementById('counts').textContent=(items.length-nv)+' images · '+nv+' videos · '+CATS.length+' types';
  items.forEach(function(it,n){
    var li=el('li','card'); it.li=li; li.dataset.cat=it.cat;
    var b=el('button','open'); b.type='button';
    b.setAttribute('aria-label','Open '+it.name+(it.kind==='film'?' video':''));
    var th=el('div','thumb'); var ar=it.w/it.h; if(it.h/it.w>1.8) ar=1/1.8; th.style.aspectRatio=ar;
    var im=new Image(); im.src=it.thumb; im.alt=it.name; im.loading=n<8?'eager':'lazy'; im.decoding='async'; im.width=it.w; im.height=it.h; th.appendChild(im);
    if(it.kind==='film'){
      th.insertAdjacentHTML('beforeend','<span class="badge lbl">Video</span><span class="play">'+PLAY+'</span>');
      var v=null;
      var start=function(){ if(rm||v)return; v=document.createElement('video'); v.muted=true;v.loop=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.src=it.view;
        th.appendChild(v); v.play().then(function(){v.classList.add('on')}).catch(function(){}); };
      var stop=function(){ if(v){v.remove();v=null} };
      b.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')start()});
      b.addEventListener('pointerleave',stop);
      b.addEventListener('focus',start); b.addEventListener('blur',stop);
    }
    b.appendChild(th);
    var cap=el('div','cap'); cap.innerHTML='<span class="c lbl">'+esc(it.cat)+'</span><span class="n">'+esc(it.name)+'</span>'+(it.c?'<span class="alt">'+esc(it.c)+'</span>':'');
    b.appendChild(cap); li.appendChild(b); grid.appendChild(li);
    b.addEventListener('click',function(){openLb(it)});
  });
  ['All'].concat(CATS).forEach(function(c){
    var n=c==='All'?items.length:items.filter(function(i){return i.cat===c}).length;
    if(!n)return;
    var bt=el('button','chip',esc(c)+'<span>'+n+'</span>'); bt.type='button'; bt.dataset.cat=c; bt.setAttribute('aria-pressed',c==='All');
    bt.addEventListener('click',function(){filter(c)}); chips.appendChild(bt);
  });
  updateShown();
}
function visible(){return items.filter(function(i){return current==='All'||i.cat===current})}
function updateShown(){document.getElementById('shown').textContent='Showing '+visible().length+' of '+items.length}
function filter(c){
  if(c===current)return; current=c;
  [].forEach.call(chips.children,function(b){b.setAttribute('aria-pressed',b.dataset.cat===c)});
  var lis=items.map(function(i){return i.li});
  var useFlip=!rm&&window.gsap&&window.Flip;
  var state=null;
  if(useFlip){gsap.registerPlugin(Flip);state=Flip.getState(lis)}
  items.forEach(function(i){i.li.hidden=!(c==='All'||i.cat===c)});
  updateShown();
  if(useFlip){
    Flip.from(state,{duration:.6,ease:'power2.inOut',absolute:true,
      onEnter:function(e){return gsap.fromTo(e,{opacity:0,scale:.92},{opacity:1,scale:1,duration:.5,delay:.15})},
      onLeave:function(e){return gsap.to(e,{opacity:0,scale:.92,duration:.3})}});
  }
}

/* lightbox */
var lb=document.getElementById('lb'), stage=document.getElementById('lbStage'), idx=0, list=[], opener=null;
function openLb(it){
  list=visible(); idx=list.indexOf(it); opener=document.activeElement;
  lb.hidden=false; document.documentElement.style.overflow='hidden'; show();
  document.getElementById('lbClose').focus();
}
function show(){
  var it=list[idx]; stage.innerHTML='';
  if(it.kind==='film'){
    var v=document.createElement('video'); v.controls=true; v.autoplay=true; v.muted=true; v.loop=true; v.playsInline=true; v.poster=it.thumb; v.src=it.view; stage.appendChild(v);
    v.play().catch(function(){});
  } else {
    var im=new Image(); im.alt=it.name; im.src=it.view; stage.appendChild(im);
  }
  document.getElementById('lbCount').textContent=(idx+1)+' / '+list.length+' · '+it.cat;
  document.getElementById('lbCat').textContent=it.cat+(it.c?' · '+it.c:'');
  document.getElementById('lbName').textContent=it.name+' · '+it.file;
  var dl=document.getElementById('lbDl'); dl.textContent=/\.pdf$/.test(it.file)?'Download PDF':it.kind==='film'?'Download video':'Download'; dl.href=it.full; dl.setAttribute('download',it.file);
  var d2=document.getElementById('lbDl2'); if(it.alt){d2.hidden=false;d2.href=it.alt;d2.setAttribute('download',it.alt.split('/').pop())}else d2.hidden=true;
  lb.setAttribute('aria-label',it.name+' preview');
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
    var f=[].filter.call(lb.querySelectorAll('button,a[href]'),function(x){return x.offsetParent!==null||x.getClientRects().length});
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
