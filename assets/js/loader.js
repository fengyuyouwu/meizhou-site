/* ==========================================================
   动效加载器（渐进增强的核心）
   - 用户开启「减少动效」→ 完全不加载 GSAP/ScrollTrigger，
     页面 0 动画循环、0 字节动效库，所有内容静态可读
   - 正常情况 → 按序加载 gsap → ScrollTrigger → narrative，
     并在就绪后启动滚动叙事
   ========================================================== */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const load = (src) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error('load fail: ' + src));
    document.head.appendChild(s);
  });

  load('assets/lib/gsap/gsap.min.js')
    .then(() => load('assets/lib/gsap/ScrollTrigger.min.js'))
    .then(() => load('assets/js/narrative.js?v=6'))
    .then(() => { if (window.__initNarrative) window.__initNarrative(); })
    .catch(() => { /* 加载失败：页面保持静态可读，不阻断任何内容 */ });
})();
