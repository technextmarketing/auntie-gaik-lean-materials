(function(){
  if(document.documentElement.classList.contains('static'))[].forEach.call(document.images,function(i){i.loading='eager'});
  var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els=[].slice.call(document.querySelectorAll('.rv'));
  if(rm||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});}
  else{
    var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    els.forEach(function(e){io.observe(e)});
  }
  var t=document.getElementById('toast'),tm;
  function toast(m){t.textContent=m;t.classList.add('on');clearTimeout(tm);tm=setTimeout(function(){t.classList.remove('on')},1800)}
  function copy(h){
    if(navigator.clipboard&&navigator.clipboard.writeText){return navigator.clipboard.writeText(h)}
    return new Promise(function(ok,no){try{var a=document.createElement('textarea');a.value=h;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();ok()}catch(e){no(e)}})
  }
  document.querySelectorAll('.sw').forEach(function(b){
    b.addEventListener('click',function(){var h=b.dataset.hex;copy(h).then(function(){toast('Copied '+h)},function(){toast(h)})});
  });
})();
