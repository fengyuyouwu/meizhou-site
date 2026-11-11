/* ==========================================================
   壹章迁徙地图（渐进增强）
   - 四段迁徙路线流动动画，与迁徙轮播双向联动
   - echarts（1MB）与地图数据（371KB）改为滚近才加载：不跟首屏图片抢带宽
   - 加载失败 / 超时 → 换成静态路线说明 + 重试按钮，绝不停在"加载中"
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const box = document.getElementById('migrationMap');
  const stage = document.getElementById('mapStage');
  const carousel = document.getElementById('migrateCarousel');
  if (!box) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LOAD_TIMEOUT = 15000;

  let chart = null;
  let current = 0;
  let state = 'idle'; // idle | loading | ready | failed

  function fallback(note, retry) {
    box.innerHTML =
      '<p class="map-fallback">迁徙路线示意：中原（洛阳）→ 江南（建康）→ 赣南、闽西 → 梅州 → 出海下南洋。<br>' +
      note +
      (retry ? '<br><button type="button" class="map-retry">重新加载地图</button>' : '') +
      '</p>';
    state = 'failed';
    if (retry) {
      const btn = box.querySelector('.map-retry');
      if (btn) btn.addEventListener('click', () => {
        state = 'idle';
        box.innerHTML = '<p class="map-fallback">迁徙地图加载中……</p>';
        start();
      });
    }
  }

  /* 减少动效：交互地图整体停用，给出静态路线说明（0 动画循环） */
  if (reduce) {
    if (stage) stage.style.display = 'none';
    fallback('当前系统开启「减少动效」，交互地图已停用。', false);
    return;
  }

  /* 迁徙路线（示意）：中原 → 江南 → 赣南闽西 → 梅州 → 出海南洋 */
  const ROUTES = [
    { points: [[112.45, 34.62], [114.3, 30.5], [118.78, 32.06]] },
    { points: [[118.78, 32.06], [116.0, 28.6], [114.93, 25.83], [116.36, 25.85]] },
    { points: [[116.36, 25.85], [116.12, 24.29]] },
    { points: [[116.12, 24.29], [116.68, 23.35], [117.9, 18.2], [114.2, 10.2], [109.4, 1.6]] }
  ];
  /* 镜头：陆上阶段聚焦闽粤赣，下南洋阶段拉远看海路 */
  const VIEW = [
    { center: [112.8, 27.2], zoom: 1.75 },
    { center: [112.8, 27.2], zoom: 1.75 },
    { center: [112.8, 27.2], zoom: 1.75 },
    { center: [110.8, 13.0], zoom: 0.92 }
  ];
  const CITIES = [
    { name: '洛阳', coord: [112.45, 34.62], pos: 'right' },
    { name: '建康', coord: [118.78, 32.06], pos: 'right' },
    { name: '赣州', coord: [114.93, 25.83], pos: 'left' },
    { name: '汀州', coord: [116.36, 25.85], pos: 'top' },
    { name: '梅州', coord: [116.12, 24.29], pos: 'left' },
    { name: '汕头出海', coord: [116.68, 23.35], pos: 'right' },
    { name: '南洋 · 坤甸', coord: [109.4, 1.6], pos: 'left' }
  ];

  function buildSeries(hl) {
    const lines = ROUTES.map((r, i) => ({
      type: 'lines',
      coordinateSystem: 'geo',
      polyline: true,
      clip: false,
      lineStyle: {
        color: i === hl ? '#C3272B' : '#A0714F',
        width: i === hl ? 3.5 : 1.6,
        opacity: i === hl ? 0.95 : 0.28,
        curveness: 0.15,
        shadowColor: i === hl ? 'rgba(195,39,43,.5)' : 'transparent',
        shadowBlur: i === hl ? 8 : 0
      },
      effect: (i === hl && !reduce)
        ? { show: true, period: 5, trailLength: 0.4, symbol: 'arrow', symbolSize: 7.5, color: '#C3272B' }
        : { show: false },
      data: [{ coords: r.points }]
    }));
    const cities = {
      type: reduce ? 'scatter' : 'effectScatter',
      coordinateSystem: 'geo',
      clip: false,
      symbolSize: 7,
      itemStyle: { color: '#C3272B' },
      label: {
        show: true,
        position: 'right',
        distance: 6,
        formatter: (p) => p.name,
        color: '#5B4A38',
        fontFamily: 'LXGW WenKai, KaiTi, serif',
        fontSize: 13
      },
      data: CITIES.map((c) => ({
        name: c.name,
        value: c.coord,
        label: { position: c.pos }
      }))
    };
    if (!reduce) cities.rippleEffect = { brushType: 'stroke', scale: 3 };
    return lines.concat([cities]);
  }

  function render(hl) {
    if (!chart) return;
    const view = VIEW[hl] || VIEW[0];
    chart.setOption({
      animation: !reduce,
      backgroundColor: 'transparent',
      geo: {
        map: 'china',
        roam: false,
        zoom: view.zoom,
        center: view.center,
        label: { show: false },
        itemStyle: { areaColor: '#F1E8D6', borderColor: '#C9B68C', borderWidth: 0.6 },
        emphasis: { disabled: true },
        select: { disabled: true }
      },
      series: buildSeries(hl)
    }, { notMerge: true });
  }

  function setHighlight(i) {
    current = (i + ROUTES.length) % ROUTES.length;
    if (stage) {
      stage.querySelectorAll('.map-stage__btn').forEach((b, k) => {
        b.classList.toggle('is-active', k === current);
      });
    }
    render(current);
  }

  function init() {
    window.echarts.registerMap('china', window.CHINA_GEO);
    box.innerHTML = '';
    chart = window.echarts.init(box, null, { renderer: 'canvas' });
    state = 'ready';
    setHighlight(current);
    window.addEventListener('resize', () => chart && chart.resize());
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.onload = resolve;
      el.onerror = () => reject(new Error(src));
      document.head.appendChild(el);
    });
  }

  function start() {
    if (state === 'loading' || state === 'ready') return;
    state = 'loading';
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      fallback('地图资源加载超时（可能是网速较慢），可继续向下阅读文字版迁徙故事。', true);
    }, LOAD_TIMEOUT);

    loadScript('assets/lib/echarts/echarts.min.js')
      .then(() => loadScript('assets/data/china-geo.js'))
      .then(() => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (!window.echarts || !window.CHINA_GEO) throw new Error('globals missing');
        init();
      })
      .catch(() => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        fallback('交互地图未能加载，可继续向下阅读文字版迁徙故事。', true);
      });
  }

  /* 惰性初始化：滚到附近才下载 1.4MB 的地图资源，不跟首屏图片抢带宽 */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          io.disconnect();
          start();
        }
      });
    }, { rootMargin: '800px 0px' });
    io.observe(box);
  } else {
    start();
  }

  /* 与轮播双向联动：轮播换页 → 地图高亮；点击阶段按钮 → 轮播跳转 */
  if (carousel) {
    carousel.addEventListener('mcchange', (e) => setHighlight(e.detail.index));
  }
  if (stage) {
    stage.querySelectorAll('.map-stage__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        setHighlight(idx);
        if (carousel) {
          carousel.dispatchEvent(new CustomEvent('mcgoto', { detail: { index: idx } }));
        }
      });
    });
  }
});
