/* ==========================================================
   GSAP 滚动叙事（渐进增强）
   - gsap.min.js 加载失败或用户开启"减少动态效果"时，整页照常运行
   - 与 main.js 的 IntersectionObserver 入场分工：本文件只做
     序章视差、叁章祖训对开、柒章时间轴错落与结语逐行四组叙事
   ========================================================== */

/* 启动入口：由 loader.js 在 GSAP 就绪后调用（渐进增强，仅非 reduce 环境） */
window.__initNarrative = function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- 序章：照片视差 + 文案缓出 ---------- */
  gsap.to('.hero__photo', {
    yPercent: 14,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__content', {
    opacity: 0.12, y: -70,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '62% top', scrub: true }
  });
  gsap.to('.hero__hint, .hero__credit', {
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '30% top', scrub: true }
  });

  /* ---------- 各章大字：编号左入、标题右入（替代通用上浮，更有书写感） ---------- */
  gsap.utils.toArray('.chapter').forEach((sec) => {
    const no = sec.querySelector('.chapter__no');
    const title = sec.querySelector('.chapter__title');
    if (no) {
      gsap.from(no, {
        x: -40, opacity: 0, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: no, start: 'top 88%' }
      });
    }
    if (title) {
      gsap.from(title, {
        x: 30, opacity: 0, duration: 0.9, delay: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: title, start: 'top 88%' }
      });
    }
  });

  /* ---------- 叁章祖训：两行对开 ---------- */
  const motto = document.querySelector('.motto');
  if (motto) {
    gsap.from('.motto .line', {
      xPercent: (i) => (i ? 7 : -7),
      opacity: 0, duration: 1, stagger: 0.16, ease: 'power2.out',
      scrollTrigger: { trigger: motto, start: 'top 72%' }
    });
  }

  /* ---------- 肆章童谣：逐行浮现 ---------- */
  const nursery = document.querySelector('.nursery');
  if (nursery) {
    gsap.from('.nursery blockquote p', {
      y: 20, opacity: 0, duration: 0.9, stagger: 0.22, ease: 'power2.out',
      scrollTrigger: { trigger: nursery, start: 'top 75%' }
    });
  }

  /* ---------- 柒章双时间轴：左列右列错落，书桌桥居中亮起 ---------- */
  const dual = document.querySelector('.dual');
  if (dual) {
    const cols = dual.querySelectorAll('.dual__col');
    gsap.from(cols[0] ? cols[0].querySelectorAll('.timeline li') : [], {
      x: -44, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out',
      scrollTrigger: { trigger: dual, start: 'top 68%' }
    });
    gsap.from(cols[1] ? cols[1].querySelectorAll('.timeline li') : [], {
      x: 44, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out',
      scrollTrigger: { trigger: dual, start: 'top 68%' }
    });
    gsap.from(dual.querySelector('.dual__bridge'), {
      opacity: 0, scale: 0.85, duration: 1, ease: 'power2.out',
      scrollTrigger: { trigger: dual, start: 'top 58%' }
    });
  }

  /* ---------- 柒章结语：三行逐行浮现（全站情绪落点） ---------- */
  const closing = document.querySelector('.closing');
  if (closing) {
    gsap.from('.closing__text .line', {
      y: 26, opacity: 0, duration: 1, stagger: 0.3, ease: 'power2.out',
      scrollTrigger: { trigger: closing, start: 'top 72%' }
    });
  }

  /* ---------- 贰章 · 围屋营造（入视口自动播放 + 可重播） ----------
     说明：曾用 pin+scrub 滚动驱动，但多图懒加载与字体 swap 引发的
     布局漂移会让触发位置失准。改为播放式后与滚动位置完全解耦，
     答辩演示也更可控。 */
  const plan = document.querySelector('.plan');
  if (plan) {
    const STEPS = [
      '「取土挖塘」— 半月池塘聚水为鉴',
      '「夯土铺坪」— 禾坪晒谷亦议事',
      '「立柱架梁」— 中轴堂屋敬祖先',
      '「垒土成胎」— 化胎隆起承龙气',
      '「围合成龙」— 弧形围龙护一族'
    ];
    const stepEl = plan.querySelector('.plan-step');
    const dots = plan.querySelectorAll('.plan-dot');
    let played = false;

    const tl = gsap.timeline({
      paused: true,
      onUpdate: () => {
        const p = tl.progress();
        const idx = p < 0.2 ? 0 : p < 0.4 ? 1 : p < 0.6 ? 2 : p < 0.8 ? 3 : 4;
        if (stepEl) stepEl.textContent = STEPS[idx];
        dots.forEach((d, k) => d.classList.toggle('is-on', k <= idx));
      }
    });
    tl.from('.plan__pond', { opacity: 0, y: 16, duration: 0.8 })
      .from('.plan__ping', { opacity: 0, y: 12, duration: 0.8 }, '+=0.25')
      .from('.plan__hall', { opacity: 0, y: 10, duration: 0.8, stagger: 0.45 }, '+=0.25')
      .from('.plan__huatai', { opacity: 0, y: 10, duration: 0.8 }, '+=0.25')
      .from('.plan__long', { opacity: 0, y: 10, duration: 0.9 }, '+=0.25')
      .from('.plan__labels text', { opacity: 0, stagger: 0.14, duration: 0.55 }, '+=0.2');

    const replay = plan.querySelector('.plan-replay');
    if (replay) {
      replay.addEventListener('click', () => tl.restart());
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !played) {
          played = true;
          io.disconnect();
          tl.play();
        }
      });
    }, { threshold: 0.45 });
    io.observe(plan);
  }

  /* ---------- 水墨长卷：sticky 横向运镜 ---------- */
  const paintSec = document.querySelector('.scroll-painting');
  const strip = document.getElementById('paintingStrip');
  if (paintSec && strip) {
    const setX = gsap.quickSetter(strip, 'x', 'px');
    const setFar = gsap.quickSetter('#pFar', 'x', 'px');
    ScrollTrigger.create({
      trigger: paintSec,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4,
      onUpdate: (self) => {
        const travel = Math.max(0, strip.scrollWidth - window.innerWidth + 60);
        setX(-travel * self.progress);
        setFar(-travel * self.progress * 0.35);
      }
    });
  }

  /* ---------- 滚动速度 → 文字微斜（获奖站手感能力） ---------- */
  const proxy = { skew: 0 };
  const skewSetter = gsap.quickSetter('.chapter__inner', 'skewY', 'deg');
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = gsap.utils.clamp(-4, 4, self.getVelocity() / -900);
      if (Math.abs(v) > Math.abs(proxy.skew)) {
        proxy.skew = v;
        gsap.to(proxy, { skew: 0, duration: 0.8, ease: 'power3.out', overwrite: true, onUpdate: () => skewSetter(proxy.skew) });
      }
    }
  });

  /* 图片/字体加载会改变文档高度，就绪后校准全部触发位置
     （banner 已固定高度占位，加载不再引起布局漂移，故无需再监听） */
  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
};
