/* ==========================================================
   交互细节（渐进增强）
   - 背景图懒加载：data-bg 属性 + 进入视口才拉取 + onload 渐显
   - 卡片 3D 微倾：鼠标跟随轻倾斜 + 高光（触屏/减少动态不启用）
   - 离开页面彩蛋：切走时标题变为「𠊎在等你翻回来」
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 背景图懒加载 ---------- */
  /* WebP 支持探测：只探一次，避免每张图重复建 canvas */
  const webpOK = (() => {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 1;
      return c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch (e) { return false; }
  })();
  const pickBg = (src) => {
    if (!webpOK || !src) return src;
    return src.replace(/\.jpe?g$/i, '.webp');
  };

  const lazyBgs = document.querySelectorAll('[data-bg]');
  if ('IntersectionObserver' in window && lazyBgs.length) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        obs.unobserve(el);
        const src = pickBg(el.dataset.bg);
        if (!src) return;
        const probe = new Image();
        probe.onload = () => {
          el.style.backgroundImage = 'url("' + src + '")';
          el.classList.add('bg-loaded');
        };
        probe.onerror = () => { el.classList.add('bg-missing'); };
        probe.src = src;
      });
    }, { rootMargin: '300px 0px' });
    lazyBgs.forEach((el) => {
      el.classList.add('js-lazy');
      io.observe(el);
    });
  }

  /* ---------- 卡片 3D 微倾 ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card, .food, .h-card').forEach((el) => {
      if (el.dataset.tiltAttached) return;
      el.dataset.tiltAttached = '1';
      el.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform .1s ease-out';
        el.style.transform =
          'perspective(900px) rotateX(' + (-py * 6).toFixed(2) + 'deg)' +
          ' rotateY(' + (px * 6).toFixed(2) + 'deg) translateY(-4px)';
        el.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform .45s ease';
        el.style.transform = '';
      });
    });
  }

  /* ---------- 离开页面彩蛋 ---------- */
  const REAL_TITLE = '弦歌出围屋 —— 从围屋到大学堂';
  const awayTitle = () => {
    setTimeout(() => { document.title = '𠊎在等你翻回来 · 弦歌出围屋'; }, 0);
  };
  const backTitle = () => {
    setTimeout(() => { document.title = REAL_TITLE; }, 0);
  };
  document.addEventListener('visibilitychange', () => {
    /* Chromium 在 visibilitychange 分发期间会推迟 title 赋值，需 setTimeout 脱离 */
    document.hidden ? awayTitle() : backTitle();
  });
  window.addEventListener('blur', awayTitle);
  window.addEventListener('focus', backTitle);

  /* ---------- 陆章 · 点亮花灯 ---------- */
  document.querySelectorAll('[data-lantern]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.card');
      const lit = card.classList.toggle('is-lit');
      btn.textContent = lit ? '✦ 花灯已点亮' : '✦ 点亮花灯';
    });
  });

  /* ---------- 陆章 · 甜粄补天（拖拽小游戏） ---------- */
  document.querySelectorAll('[data-mend]').forEach((box) => {
    const pad = box.querySelector('[data-caiban]');
    const gap = box.querySelector('.mend-sky__gap');
    if (!pad || !gap) return;
    let dragging = false, sx = 0, sy = 0, baseX = 0, baseY = 0;
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dragging = true;
      try { pad.setPointerCapture(e.pointerId); } catch { /* 合成事件无活跃指针时忽略 */ }
      sx = e.clientX; sy = e.clientY;
      baseX = parseFloat(pad.style.left || getComputedStyle(pad).left);
      baseY = parseFloat(pad.style.top || getComputedStyle(pad).top);
      pad.style.transition = 'none';
    });
    pad.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      e.preventDefault();
      pad.style.left = (baseX + e.clientX - sx) + 'px';
      pad.style.top = (baseY + e.clientY - sy) + 'px';
    });
    pad.addEventListener('pointerup', () => {
      dragging = false;
      const pr = pad.getBoundingClientRect();
      const gr = gap.getBoundingClientRect();
      const boxR = box.getBoundingClientRect();
      const d = Math.hypot(
        pr.left + pr.width / 2 - gr.left - gr.width / 2,
        pr.top + pr.height / 2 - gr.top - gr.height / 2
      );
      if (d < 56) {
        pad.style.left = (gr.left + gr.width / 2 - pr.width / 2 - boxR.left) + 'px';
        pad.style.top = (gr.top + gr.height / 2 - pr.height / 2 - boxR.top) + 'px';
        gap.textContent = '天 已 补';
        gap.classList.add('is-mended');
        pad.textContent = '成';
      } else {
        pad.style.transition = 'left .4s ease, top .4s ease';
        pad.style.left = ''; pad.style.top = '';
      }
    });
  });

  /* ---------- 贰章 · 围龙屋空间导览（提案 A） ---------- */
  const plan = document.querySelector('.plan');
  if (plan) {
    const INFO = {
      pond: '半月池塘：聚水为鉴，也聚财气；水面倒影让围屋「前低后高」的格局成立。',
      ping: '禾坪：晒谷、议事、孩童奔跑的地方——围屋的公共广场。',
      hall: '堂屋：上堂祭祖、中堂议事、下堂迎客——中轴线是整座围屋的脊梁。',
      huatai: '化胎：隆起的龟背土台，客家人说它承「龙气」、化育子孙。',
      long: '围龙间：弧形房间环抱一族，房间数随族丁增减，人丁旺则围龙长。'
    };
    const infoText = plan.querySelector('.plan-info__text');
    const parts = plan.querySelectorAll('.plan__hot');
    const setActive = (key) => {
      parts.forEach((g) => g.classList.toggle('is-active', g.dataset.part === key));
      if (infoText && INFO[key]) infoText.textContent = INFO[key];
    };
    parts.forEach((g) => {
      g.addEventListener('pointerenter', () => setActive(g.dataset.part));
      g.addEventListener('pointerleave', () => g.classList.remove('is-active'));
      g.addEventListener('focus', () => setActive(g.dataset.part));
      g.addEventListener('click', () => setActive(g.dataset.part));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActive(g.dataset.part);
        }
      });
    });
  }

  /* ---------- 柒章 · 文化名片生成器 ---------- */
  const cardBox = document.querySelector('.card-maker');
  if (cardBox) {
    const input = cardBox.querySelector('#cardText');
    const makeBtn = cardBox.querySelector('#makeCard');
    const dl = cardBox.querySelector('#cardDownload');
    const preview = cardBox.querySelector('#cardPreview');

    function drawCard(text) {
      const c = document.createElement('canvas');
      c.width = 1080; c.height = 608;
      const x = c.getContext('2d');
      x.fillStyle = '#F7F2E7'; x.fillRect(0, 0, 1080, 608);
      x.strokeStyle = '#A0714F';
      x.lineWidth = 3; x.strokeRect(26, 26, 1028, 556);
      x.lineWidth = 1; x.strokeRect(40, 40, 1000, 528);
      /* 远山淡影 */
      x.fillStyle = 'rgba(62, 74, 82, 0.12)';
      x.beginPath();
      x.moveTo(60, 470); x.bezierCurveTo(240, 380, 420, 430, 600, 400);
      x.bezierCurveTo(760, 376, 900, 420, 1020, 396);
      x.lineTo(1020, 500); x.lineTo(60, 500); x.closePath(); x.fill();
      /* 半月池与围屋剪影 */
      x.fillStyle = 'rgba(124, 147, 160, 0.5)';
      x.beginPath(); x.ellipse(330, 500, 210, 26, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#2B3138';
      x.beginPath(); x.arc(330, 462, 132, Math.PI, Math.PI * 2); x.closePath(); x.fill();
      x.fillStyle = '#F7F2E7';
      x.beginPath(); x.arc(330, 462, 100, Math.PI, Math.PI * 2); x.closePath(); x.fill();
      x.fillStyle = '#2B3138';
      x.fillRect(300, 372, 60, 92);
      x.beginPath(); x.moveTo(288, 374); x.lineTo(330, 350); x.lineTo(372, 374); x.closePath(); x.fill();
      /* 主文案 */
      x.fillStyle = '#2B2B2B';
      x.font = '42px "LXGW WenKai", KaiTi, serif';
      const per = 11;
      const lines = [];
      for (let i = 0; i < text.length; i += per) lines.push(text.slice(i, i + per));
      lines.slice(0, 3).forEach((line, i) => x.fillText(line, 560, 214 + i * 64));
      x.font = '22px "LXGW WenKai", KaiTi, serif';
      x.fillStyle = '#6B6257';
      x.fillText('—— 写于广州大学', 560, 214 + Math.min(lines.length, 3) * 64 + 14);
      const d = new Date();
      x.fillText(d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日', 720, 524);
      /* 竖排站名 */
      x.fillStyle = '#2B2B2B';
      x.font = '32px "LXGW WenKai", KaiTi, serif';
      '弦歌出围屋'.split('').forEach((ch, i) => x.fillText(ch, 972, 104 + i * 44));
      /* 印章 */
      x.fillStyle = '#C3272B';
      x.fillRect(62, 96, 56, 96);
      x.fillStyle = '#F7F2E7';
      x.font = '26px "LXGW WenKai", KaiTi, serif';
      x.fillText('客', 90, 136); x.fillText('韵', 90, 172);
      return c;
    }

    makeBtn.addEventListener('click', () => {
      let text = (input.value || '').trim();
      if (!text) {
        try {
          const msgs = JSON.parse(localStorage.getItem('keyun-messages') || '[]');
          if (msgs.length) text = msgs[msgs.length - 1];
        } catch { text = ''; }
      }
      if (!text) text = '𠊎系客家人，四海为家。';
      const canvas = drawCard(text);
      const url = canvas.toDataURL('image/png');
      preview.src = url;
      preview.hidden = false;
      dl.href = url;
      dl.hidden = false;
      preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
});
