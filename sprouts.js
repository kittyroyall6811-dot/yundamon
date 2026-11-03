// 첫 화면 아래쪽: 손가락·마우스가 지나간 자리에 엿기름(싹 틔운 보리) 싹이 수채화처럼 돋아난다.
(() => {
  const canvas = document.querySelector('.sprouts');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX = 60;
  const GROW_MS = 1500;
  const sprouts = [];
  let w = 0, h = 0, raf = 0, last = null;

  const rand = (a, b) => a + Math.random() * (b - a);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  }

  // 자리는 화면 너비에 대한 비율로 기억한다(창 크기가 바뀌어도 제자리)
  function add(x, delay = 0) {
    const tall = Math.min(h * 0.85, 150);
    sprouts.push({
      fx: x / w,
      off: rand(4, h * 0.18),
      len: rand(tall * 0.35, tall),
      bend: rand(-0.35, 0.35),
      born: performance.now() + delay,
      leaves: [
        { at: rand(0.3, 0.45), side: Math.random() < 0.5 ? -1 : 1, size: rand(14, 30) },
        { at: rand(0.55, 0.75), side: 0, size: rand(10, 22) },
      ].map((l, i, all) => (i === 1 ? { ...l, side: -all[0].side } : l)),
      jitter: Array.from({ length: 3 }, () => [rand(-1.4, 1.4), rand(-1.4, 1.4)]),
      hue: rand(0, 1),
      fade: 1,
    });
    if (sprouts.length > MAX) sprouts.slice(0, sprouts.length - MAX).forEach((s) => { s.dying = true; });
    start();
  }

  // 줄기의 t 지점 좌표 (2차 곡선)
  function point(s, t) {
    const x0 = s.x, y0 = s.y;
    const x2 = s.x + s.bend * s.len, y2 = s.y - s.len;
    const x1 = s.x + s.bend * s.len * 0.15, y1 = s.y - s.len * 0.55;
    const u = 1 - t;
    return [u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2];
  }

  function drawSprout(s, p) {
    const a = s.fade;
    const green = s.hue < 0.5 ? '98,128,40' : '128,152,52';
    // 씨앗: 쌀알 같은 보리알
    ctx.fillStyle = `rgba(214,192,140,${0.55 * a})`;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 2, 4.2, 2.6, s.bend, 0, Math.PI * 2);
    ctx.fill();
    // 줄기: 살짝 어긋난 붓질을 세 번 겹쳐 번진 느낌
    const steps = Math.max(2, Math.ceil(24 * p));
    s.jitter.forEach(([jx, jy], i) => {
      ctx.strokeStyle = `rgba(${green},${(0.38 - i * 0.08) * a})`;
      ctx.lineWidth = 2 - i * 0.45;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let k = 0; k <= steps; k++) {
        const [px, py] = point(s, (k / steps) * p);
        k ? ctx.lineTo(px + jx, py + jy) : ctx.moveTo(px + jx, py + jy);
      }
      ctx.stroke();
    });
    // 잎: 줄기가 그 높이까지 자라면 펼쳐진다
    s.leaves.forEach((l) => {
      const open = Math.min(1, Math.max(0, (p - l.at) / 0.3));
      if (!open) return;
      const [bx, by] = point(s, l.at);
      const len = l.size * open;
      const tx = bx + l.side * len * 0.9, ty = by - len * 0.75;
      ctx.fillStyle = `rgba(${green},${0.22 * a})`;
      for (let i = 0; i < 2; i++) {
        const o = i * 1.2;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + l.side * len * 0.2 + o, by - len * 0.7, tx + o, ty);
        ctx.quadraticCurveTo(bx + l.side * len * 0.75, by - len * 0.1 - o, bx, by);
        ctx.fill();
      }
    });
    // 싹 끝의 연두 물방울
    if (p > 0.95) {
      const [tx, ty] = point(s, 1);
      ctx.fillStyle = `rgba(195,207,140,${0.5 * a})`;
      ctx.beginPath();
      ctx.arc(tx, ty, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw(now) {
    ctx.clearRect(0, 0, w, h);
    let busy = false;
    for (let i = sprouts.length - 1; i >= 0; i--) {
      const s = sprouts[i];
      if (s.dying) {
        s.fade -= 0.02;
        if (s.fade <= 0) { sprouts.splice(i, 1); continue; }
        busy = true;
      }
    }
    sprouts.forEach((s) => {
      s.x = s.fx * w;
      s.y = h - s.off;
      const t = reduce ? 1 : (now - s.born) / GROW_MS;
      if (t < 1) busy = true;
      if (t <= 0) return;
      const p = 1 - Math.pow(1 - Math.min(1, t), 3);
      drawSprout(s, p);
    });
    return busy;
  }

  function tick(now) {
    raf = draw(now) ? requestAnimationFrame(tick) : 0;
  }
  function start() { if (!raf) raf = requestAnimationFrame(tick); }

  function local(e) {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  canvas.addEventListener('pointermove', (e) => {
    const [x] = local(e);
    if (last === null || Math.abs(x - last) > 26) { add(x); last = x; }
  });
  canvas.addEventListener('pointerdown', (e) => {
    const [x] = local(e);
    add(x); add(x + rand(-18, 18), 120);
    last = x;
  });
  canvas.addEventListener('pointerleave', () => { last = null; });

  // 처음 한 번: 화면 아래에 싹 몇 개가 차례로 돋는다
  let greeted = false;
  function greet() {
    if (greeted || !w || !h) return;
    greeted = true;
    const first = Math.max(6, Math.round(w / 140));
    for (let i = 0; i < first; i++) add(((i + rand(0.2, 0.8)) / first) * w, reduce ? 0 : 300 + i * 160);
  }

  new ResizeObserver(() => { resize(); greet(); }).observe(canvas);
})();
