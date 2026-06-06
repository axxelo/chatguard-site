/**
 * ChatGuard — shared behaviour for all pages
  *
   * Copyright (c) 2024–2026 AXTRADE SAS. All rights reserved.
    *
     * PROPRIETARY AND CONFIDENTIAL
      * This file is part of the ChatGuard software suite owned by AXTRADE SAS.
       * Unauthorised copying, modification, distribution, or use of this file,
        * via any medium, is strictly prohibited without the prior written consent
         * of AXTRADE SAS.
          *
           * For licensing enquiries: legal@chatguard.co
            */

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

  // contact form: posts to a Formspree endpoint if set (data-endpoint),
  // otherwise falls back to opening a pre-filled email. No page reload.
  var form=document.getElementById('contactForm');
  if(form){
    var get=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
    var status=document.createElement('p');
    status.className='form-msg';status.setAttribute('role','status');
    form.appendChild(status);
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var d={name:get('cfName'),firm:get('cfFirm'),email:get('cfEmail'),interest:get('cfInterest'),message:get('cfMsg')};
      if(!d.name||!d.email){status.textContent='Please add your name and a work email.';status.className='form-msg err';return;}
      var endpoint=(form.getAttribute('data-endpoint')||'').trim();
      if(endpoint){
        status.textContent='Sending…';status.className='form-msg';
        fetch(endpoint,{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json'},body:JSON.stringify(d)})
          .then(function(r){
            if(r.ok){form.reset();status.textContent='Thanks — we\u2019ll be in touch shortly.';status.className='form-msg ok';}
            else{throw new Error('bad');}
          })
          .catch(function(){status.textContent='Something went wrong. Please email info@chatguard.co.';status.className='form-msg err';});
      }else{
        var subject='ChatGuard enquiry — '+(d.firm||d.name||'website');
        var body='Name: '+d.name+'\nFirm: '+d.firm+'\nEmail: '+d.email+'\nInterested in: '+d.interest+'\n\n'+d.message;
        window.location.href='mailto:info@chatguard.co?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
        status.textContent='Opening your email app…';status.className='form-msg ok';
      }
    });
  }
});
