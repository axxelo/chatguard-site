/* ChatGuard — shared behaviour for all pages */
(function(){
  // ---- theme: apply saved preference ASAP ----
  try{
    var saved=localStorage.getItem('cg-theme');
    if(saved)document.documentElement.setAttribute('data-theme',saved);
  }catch(e){}

  document.addEventListener('DOMContentLoaded',function(){
    // nav border on scroll
    var hdr=document.getElementById('hdr');
    if(hdr){
      var onScroll=function(){hdr.classList.toggle('scrolled',window.scrollY>10);};
      window.addEventListener('scroll',onScroll);onScroll();
    }

    // theme toggle
    var toggle=document.getElementById('themeToggle');
    if(toggle){
      toggle.addEventListener('click',function(){
        var cur=document.documentElement.getAttribute('data-theme')==='light'?'dark':'light';
        if(cur==='light')document.documentElement.setAttribute('data-theme','light');
        else document.documentElement.removeAttribute('data-theme');
        try{localStorage.setItem('cg-theme',cur);}catch(e){}
      });
    }

    // reveal on scroll
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){
        es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
      },{threshold:.15});
      document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
    }else{
      document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in');});
    }

    // count-up
    function animateCount(el){
      var target=parseFloat(el.dataset.count);
      var prefix=el.dataset.prefix||'';
      var suffix=el.dataset.suffix||'';
      var decimals=(el.dataset.count.split('.')[1]||'').length;
      var dur=1300,start=performance.now();
      function tick(now){
        var p=Math.min((now-start)/dur,1);
        var eased=1-Math.pow(1-p,3);
        var val=(target*eased).toFixed(decimals);
        el.textContent=prefix+Number(val).toLocaleString('en-GB',{minimumFractionDigits:decimals,maximumFractionDigits:decimals})+suffix;
        if(p<1)requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    if('IntersectionObserver' in window){
      var sio=new IntersectionObserver(function(es){
        es.forEach(function(e){if(e.isIntersecting){animateCount(e.target);sio.unobserve(e.target);}});
      },{threshold:.6});
      document.querySelectorAll('.num[data-count]').forEach(function(el){sio.observe(el);});
    }
  });
})();

/* mobile menu + contact form */
document.addEventListener('DOMContentLoaded',function(){
  var burger=document.getElementById('navBurger');
  var menu=document.getElementById('mobileMenu');
  if(burger&&menu){
    var toggle=function(){
      var open=menu.classList.toggle('open');
      burger.setAttribute('aria-expanded',open?'true':'false');
    };
    burger.addEventListener('click',toggle);
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){menu.classList.remove('open');burger.setAttribute('aria-expanded','false');});
    });
    window.addEventListener('resize',function(){
      if(window.innerWidth>880){menu.classList.remove('open');burger.setAttribute('aria-expanded','false');}
    });
  }

  // contact form -> opens a pre-filled email (works with no backend)
  var form=document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var get=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
      var name=get('cfName'),firm=get('cfFirm'),email=get('cfEmail'),interest=get('cfInterest'),msg=get('cfMsg');
      var subject='ChatGuard enquiry — '+(firm||name||'website');
      var body='Name: '+name+'\nFirm: '+firm+'\nEmail: '+email+'\nInterested in: '+interest+'\n\n'+msg;
      window.location.href='mailto:info@chatguard.co?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    });
  }
});
