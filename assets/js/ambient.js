/* ==========================================================
   背景微动效（渐进增强）
   - 序章：香火微尘（暖色微粒缓缓上浮，呼应火龙与香火）
   - 柒章：萤火（暗夜中的微光明灭，呼应"月照客都"）
   - 尊重系统"减少动态"；滚出视口/切后台自动暂停；粒子数按面积缩放
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.HTMLCanvasElement) return;

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const rand = (a, b) => a + Math.random() * (b - a);
  window.__ambientFx = window.__ambientFx || {};

  function makeField(canvas, config, handle) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0, parts = [], raf = 0, running = false, last = 0;

    function resize() {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const n = Math.min(config.max, Math.max(8, Math.round((W * H) / config.density)));
      parts = Array.from({ length: n }, () => config.spawn(rand, true, W, H));
      handle.count = parts.length;
    }

    function frame(now) {
      if (!running) return;
      const dt = Math.min((now - last) / 16.7, 3);
      last = now;
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        config.step(p, dt, rand, W, H, now);
        config.draw(ctx, p, now);
      });
      raf = requestAnimationFrame(frame);
    }

    function play() {
      if (running) return;
      running = true;
      handle.running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function pause() {
      running = false;
      handle.running = false;
      cancelAnimationFrame(raf);
    }

    function start() {
      resize();
      play();
      window.addEventListener('resize', () => { resize(); if (running) { pause(); play(); } });
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? play() : pause()));
      }, { threshold: 0.02 });
      io.observe(canvas);
      document.addEventListener('visibilitychange', () => {
        document.hidden ? pause() : play();
      });
    }
    start();
  }

  /* ---------- 序章 · 香火微尘 ---------- */
  const heroCanvas = document.querySelector('.hero__fx');
  if (heroCanvas) {
    window.__ambientFx.hero = { running: false, count: 0 };
    makeField(heroCanvas, {
      max: 60,
      density: 20000,
      spawn: (rand, initial, W, H) => ({
        x: rand(0, W),
        y: initial ? rand(0, H) : H + rand(4, 30),
        r: rand(0.6, 2.4),
        vy: rand(0.18, 0.6),
        sway: rand(0.4, 1.4),
        phase: rand(0, Math.PI * 2),
        alpha: rand(0.12, 0.5),
        color: Math.random() < 0.14 ? '#D66A5A' : (Math.random() < 0.5 ? '#E8B27D' : '#D9A05E')
      }),
      step: (p, dt, rand, W, H, now) => {
        p.y -= p.vy * dt;
        p.x += Math.sin(now * 0.001 * p.sway + p.phase) * 0.18 * dt;
        if (p.y < -12) { p.y = H + rand(6, 24); p.x = rand(0, W); }
      },
      draw: (ctx, p, now) => {
        const flicker = 0.72 + 0.28 * Math.sin(now * 0.004 + p.phase);
        ctx.globalAlpha = p.alpha * flicker;
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }, window.__ambientFx.hero);
  }

  /* ---------- 柒章 · 萤火 ---------- */
  const finalCanvas = document.querySelector('.final-fx');
  if (finalCanvas) {
    window.__ambientFx.final = { running: false, count: 0 };
    makeField(finalCanvas, {
      max: 34,
      density: 32000,
      spawn: (rand, initial, W, H) => ({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(1, 2.3),
        vx: rand(-0.16, 0.16),
        vy: rand(-0.12, 0.12),
        freq: rand(0.5, 1.3),
        phase: rand(0, Math.PI * 2),
        baseAlpha: rand(0.35, 0.75)
      }),
      step: (p, dt, rand, W, H) => {
        p.vx += rand(-0.014, 0.014) * dt;
        p.vy += rand(-0.014, 0.014) * dt;
        p.vx = Math.max(-0.3, Math.min(0.3, p.vx));
        p.vy = Math.max(-0.3, Math.min(0.3, p.vy));
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -8) p.x = W + 8; if (p.x > W + 8) p.x = -8;
        if (p.y < -8) p.y = H + 8; if (p.y > H + 8) p.y = -8;
      },
      draw: (ctx, p, now) => {
        const glow = Math.abs(Math.sin(now * 0.0011 * p.freq + p.phase));
        ctx.globalAlpha = p.baseAlpha * (0.2 + 0.8 * glow);
        ctx.shadowBlur = 9;
        ctx.shadowColor = '#F2E3C2';
        ctx.fillStyle = '#F2E3C2';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.8 + 0.35 * glow), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }, window.__ambientFx.final);
  }
});
