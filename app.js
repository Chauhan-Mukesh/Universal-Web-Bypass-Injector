(function(){
  'use strict';

  // 1) Your universal bypass function
  function universalBypass(){
    const BLOCKED_HOSTS = [
      'sb\\.scorecardresearch\\.com',
      'analytics\\.google\\.com',
      'google-analytics\\.com',
      'stats\\.g\\.doubleclick\\.net',
      'securepubads\\.g\\.doubleclick\\.net',
      'ads\\.pubmatic\\.com',
      'bat\\.bing\\.com',
      'analytics\\.tiktok\\.com',
      'connect\\.facebook\\.net',
      'static\\.ads-twitter\\.com',
      'ads\\.reddit\\.com',
      'sp\\.analytics\\.yahoo\\.com',
      'chartbeat\\.com',
      'chartbeat_mab\\.js',
      'imasdk\\.googleapis\\.com',
      'c\\.amazon-adsystem\\.com',
      'jsc\\.mgid\\.com',
      'comscore\\.(js|cloud)',
      'i\\.clean\\.gg',
      'm\\.stripe\\.network',
      'browser\\.sentry-cdn\\.com',
      'cdn\\.optimizely\\.com',
      'survey\\.survicate\\.com',
      'cdn\\.siftscience\\.com',
      'b-code\\.liadm\\.com',
      'impactcdn\\.com',
      'hb-scribd\\.s3\\.us-east-2\\.amazonaws\\.com',
      's-f\\.scribdassets\\.com'
    ].map(p=>new RegExp(p,'i'));

    // mute repetitive noise
    const SUPPRESS = [/^\[GET_CSS\]: result/, /net::ERR_BLOCKED_BY_CLIENT/];
    ['log','warn','error'].forEach(level=>{
      const orig=console[level];
      console[level]=(...args)=>{
        if(args.some(a=>SUPPRESS.some(rx=>rx.test(String(a))))) return;
        orig.apply(console,args);
      };
    });

    // patch fetch
    const _fetch=window.fetch;
    window.fetch=(req,init)=>{
      const url=(req&&req.url)||req;
      if(BLOCKED_HOSTS.some(rx=>rx.test(url))) return new Promise(()=>{}); 
      return _fetch(req,init);
    };

    // patch XHR
    (function(){
      const proto=XMLHttpRequest.prototype;
      const o=proto.open, s=proto.send;
      proto.open=function(m,u){ this.__b=BLOCKED_HOSTS.some(rx=>rx.test(u)); return o.apply(this,arguments); };
      proto.send=function(b){ if(this.__b) return; return s.apply(this,arguments); };
    })();

    // purge sneaked-in tags
    ['script','iframe','img'].forEach(tag=>{
      document.querySelectorAll(`${tag}[src]`).forEach(el=>{
        if(BLOCKED_HOSTS.some(rx=>rx.test(el.src))) el.remove();
      });
    });

    // remove common overlays/paywalls
    [
      '.adblock-overlay','.disable-adblock','.paywall','.overlay',
      '[class*=paywall]','[id*=paywall]','[data-ad]','iframe[src*="ads"]'
    ].forEach(sel=>{
      document.querySelectorAll(sel).forEach(e=>e.remove());
    });

    // restore scrolling/visibility
    const style=document.createElement('style');
    style.textContent='html,body{overflow:auto!important;filter:none!important}';
    document.head.appendChild(style);
  }

  // 2) Open new tab and inject on load
  const newWin = window.open(location.href);
  newWin.onload = () => {
    try {
      // serialize and run
      newWin.eval('('+universalBypass.toString()+')()');
    } catch (err) {
      console.error('Bypass injection failed:', err);
    }
  };
})();
