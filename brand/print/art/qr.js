document.querySelectorAll('[data-qr]').forEach(function(el){
  var q=qrcode(0,'M');q.addData(el.dataset.qr);q.make();var n=q.getModuleCount(),p='';
  for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))p+='M'+c+' '+r+'h1v1h-1z';
  el.innerHTML='<svg viewBox="-4 -4 '+(n+8)+' '+(n+8)+'" shape-rendering="crispEdges"><rect x="-4" y="-4" width="'+(n+8)+'" height="'+(n+8)+'" fill="#fff"/><path d="'+p+'" fill="'+(el.dataset.fg||'#0c1433')+'"/></svg>';
});
