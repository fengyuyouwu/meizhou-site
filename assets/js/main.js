/* ==========================================================
   客韵·百年 —— 交互脚本
   功能：滚动进度条 / 入场动效 / 数据计数 / 导航高亮 /
        声音占位提示 / 客家话翻牌 / 留言板（localStorage）
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 滚动进度条 ---------- */
  const progressBar = document.getElementById('progressBar');
  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 入场动效（IntersectionObserver） ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));


  /* ---------- 数据计数：终值常驻 DOM（曾用计数动画，为避免中间态错值已移除，
     数字来源见页脚「数据与图片来源」） ---------- */

  /* ---------- 导航高亮（顶部 + 侧边） ---------- */
  const sections = document.querySelectorAll('.chapter, .hero');
  const topLinks = document.querySelectorAll('.topbar__nav a');
  const sideLinks = document.querySelectorAll('.side-nav a');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      topLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
      sideLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navObserver.observe(s));

  /* ---------- 壹章 · 迁徙自动轮播 ---------- */
  const mcBox = document.getElementById('migrateCarousel');
  if (mcBox) {
    const track = document.getElementById('mcTrack');
    const dotsBox = document.getElementById('mcDots');
    const slides = track.children.length;
    let mcIdx = 0, mcTimer = null;
    for (let i = 0; i < slides; i++) {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', '迁徙第' + (i + 1) + '段');
      dot.addEventListener('click', () => { mcGo(i); mcPlay(); });
      dotsBox.appendChild(dot);
    }
    const dots = [...dotsBox.children];
    function mcGo(i) {
      mcIdx = (i + slides) % slides;
      track.style.transform = 'translateX(-' + mcIdx * 100 + '%)';
      dots.forEach((d, k) => d.classList.toggle('is-active', k === mcIdx));
      mcBox.dispatchEvent(new CustomEvent('mcchange', { detail: { index: mcIdx } }));
    }
    const mcPlay = () => { if (reduce) return; clearInterval(mcTimer); mcTimer = setInterval(() => mcGo(mcIdx + 1), 4500); };
    mcBox.addEventListener('mouseenter', () => clearInterval(mcTimer));
    mcBox.addEventListener('mouseleave', mcPlay);
    mcBox.addEventListener('mcgoto', (e) => { mcGo(e.detail.index); mcPlay(); });
    mcGo(0);
    mcPlay();
  }

  /* ---------- 陆章 · 节庆迷你轮播（多卡错开节奏） ---------- */
  document.querySelectorAll('.mini-slider').forEach((slider, sIdx) => {
    let imgs = [];
    try { imgs = JSON.parse(slider.dataset.images || '[]'); } catch { imgs = []; }
    if (!imgs.length) return;
    imgs.forEach((src, i) => {
      const layer = document.createElement('div');
      layer.className = 'ms__img' + (i === 0 ? ' is-on' : '');
      layer.dataset.bg = src;
      slider.appendChild(layer);
    });
    const layers = [...slider.children];
    let msIdx = 0;
    if (reduce) return;
    setInterval(() => {
      msIdx = (msIdx + 1) % layers.length;
      layers.forEach((el, k) => el.classList.toggle('is-on', k === msIdx));
    }, 3200 + sIdx * 450);
  });

  /* ---------- 声音按钮：播放本地音频（再次点击暂停），缺失时提示 ---------- */
  const toast = document.getElementById('toast');
  let toastTimer = null;
  let currentAudio = null;
  const showToast = (text) => {
    toast.textContent = text;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-show'), 2400);
  };
  document.querySelectorAll('.sound-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.audio;
      if (!src) { showToast('🎵 ' + btn.dataset.sound); return; }
      if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        showToast('⏸ 已暂停「' + btn.dataset.title + '」');
        return;
      }
      if (!currentAudio) currentAudio = new Audio(src);
      const audio = currentAudio;
      audio.loop = false;
      audio.play()
        .then(() => showToast('🎵 正在播放「' + btn.dataset.title + '」…再点一次可暂停'))
        .catch(() => showToast('🎵 播放失败：' + btn.dataset.sound));
    });
  });

  /* ---------- 客家话小词典（点击翻牌） ---------- */
  document.querySelectorAll('.flip').forEach((card) => {
    const char = card.querySelector('.flip__char');
    const front = char.textContent;
    card.addEventListener('click', () => {
      card.classList.toggle('is-flipped');
      char.textContent = card.classList.contains('is-flipped')
        ? card.dataset.mean
        : front;
    });
  });

  /* ---------- 留言板（localStorage 彩蛋） ---------- */
  const KEY = 'keyun-messages';
  const form = document.getElementById('boardForm');
  const input = document.getElementById('boardInput');
  const list = document.getElementById('boardList');

  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  };
  const render = () => {
    const msgs = load();
    list.innerHTML = '';
    msgs.slice(-6).forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      list.appendChild(li);
    });
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const msgs = load();
    msgs.push(text);
    try { localStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch { /* 隐私模式下静默降级 */ }
    input.value = '';
    render();
    showToast('已存入本机浏览器（不会公开）· 可在「名片工坊」生成名片带走');
  });
  render();
});
