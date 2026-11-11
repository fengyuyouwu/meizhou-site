/* ==========================================================
   背景微动效（渐进增强，全站三主题）
   - ember  香火微尘：深色照片底（序章），暖色上浮
   - firefly 萤火：暗色终章，微光明灭游移
   - ink    墨尘：浅色宣纸章节，深色微粒缓缓沉降
   - 滚出视口自动暂停 / 切后台暂停 / 尊重「减少动效」
   - 粒子数按面积缩放，DPR 上限 2
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.HTMLCanvasElement) return;

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const rand = (a, b) => a + Math.random() * (b - a);

  const THEMES = {
    ember: {
      max: 60, density: 20000,
      spawn: (rand, init, W, H) => ({
        x: rand(0, W),
        y: init ? rand(0, H) : H + rand(4, 30),
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
    },
    firefly: {
      max: 34, density: 32000,
      spawn: (rand, init, W, H) => ({
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
    },
    ink: {
      max: 42, density: 28000,
      spawn: (rand, init, W, H) => ({
        x: rand(0, W),
        y: init ? rand(0, H) : rand(-40, -6),
        r: rand(0.8, 2.1),
        vy: rand(0.06, 0.22),
        phase: rand(0, Math.PI * 2),
        alpha: rand(0.16, 0.34),
        color: Math.random() < 0.34 ? '#A0714F' : (Math.random() < 0.5 ? '#6B6257' : '#3E4A52')
      }),
      step: (p, dt, rand, W, H, now) => {
        p.y += p.vy * dt;
        p.x += Math.sin(now * 0.0006 + p.phase) * 0.14 * dt;
        if (p.y > H + 10) { p.y = -10; p.x = rand(0, W); }
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      },
      draw: (ctx, p, now) => {
        const breathe = 0.82 + 0.18 * Math.sin(now * 0.002 + p.phase);
        ctx.globalAlpha = p.alpha * breathe;
        ctx.shadowBlur = 2;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }
  };

  function makeField(canvas, theme, handle) {
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
      const n = Math.min(theme.max, Math.max(6, Math.round((W * H) / theme.density)));
      parts = Array.from({ length: n }, () => theme.spawn(rand, true, W, H));
      handle.count = parts.length;
    }

    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (now - last < 30) return;            /* 30fps 节流：慢速漂移足够，主线程减负 */
      const dt = Math.min((now - last) / 16.7, 3);
      last = now;
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        theme.step(p, dt, rand, W, H, now);
        theme.draw(ctx, p, now);
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
      let rt = null;
      window.addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => { resize(); if (running) { pause(); play(); } }, 200);
      });
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

  document.querySelectorAll('[data-fx]').forEach((host, i) => {
    try {
      const theme = THEMES[host.dataset.fx];
      if (!theme) {
        window.__ambientSkip = (window.__ambientSkip || []).concat([(host.id || i) + ':no-theme:' + host.dataset.fx]);
        return;
      }
      let canvas = host.querySelector('canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'fx-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        host.prepend(canvas);
      }
      const handle = { running: false, count: 0 };
      window.__ambientFx = window.__ambientFx || {};
      window.__ambientFx[host.dataset.fx + '_' + i] = handle;
      makeField(canvas, theme, handle);
    } catch (e) {
      window.__ambientErrors = window.__ambientErrors || [];
      window.__ambientErrors.push((host.id || i) + ': ' + e.message);
      console.error('[ambient]', host.id || i, e);
    }
  });
});
