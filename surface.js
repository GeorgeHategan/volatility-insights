/* Animated implied-volatility surface for the hero.
   Raw SVI (Gatheral) total variance for each maturity slice:
       w(k) = a + b * ( rho*(k-m) + sqrt((k-m)^2 + sigma^2) )
   and the implied vol plotted is sqrt(w/t). Parameters breathe slowly so the
   smile steepens and flattens the way a real surface does through the day. */
(function () {
  var canvas = document.getElementById('surface');
  if (!canvas || !canvas.getContext) { return; }
  var ctx = canvas.getContext('2d');

  var NK = 44, NT = 30;
  var K0 = -1.25, K1 = 1.25;   /* log-moneyness */
  var T0 = 0.10,  T1 = 2.30;   /* maturity, years */

  var W = 0, H = 0, raf = null;
  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width  = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function sviVol(k, t, p) {
    var a   =  0.010 + 0.028 * t;
    var b   =  0.118 + 0.060 * Math.exp(-1.2 * t) + 0.020 * Math.sin(p * 0.9);
    var rho = -0.58  + 0.16  * Math.sin(p * 0.6);
    var m   = -0.020 - 0.050 * t;
    var sg  =  0.175 + 0.130 * t;
    var d = k - m;
    var w = a + b * (rho * d + Math.sqrt(d * d + sg * sg));
    if (w < 1e-6) { w = 1e-6; }
    return Math.sqrt(w / t);
  }

  /* cyan low ground -> coral high ridges, matching the badge */
  function stroke(nz, alpha) {
    var e = Math.pow(nz < 0 ? 0 : (nz > 1 ? 1 : nz), 1.35);
    var r = Math.round(127 + (240 - 127) * e);
    var g = Math.round(212 + (137 - 212) * e);
    var b = Math.round(232 + ( 92 - 232) * e);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function frame(ms) {
    var phase = ms * 0.00022;
    var theta = 0.46 + 0.15 * Math.sin(ms * 0.00007);

    var vols = [], lo = 1e9, hi = -1e9, i, j, k, t, v;
    for (j = 0; j < NT; j++) {
      t = T0 + (T1 - T0) * (j / (NT - 1));
      vols[j] = [];
      for (i = 0; i < NK; i++) {
        k = K0 + (K1 - K0) * (i / (NK - 1));
        v = sviVol(k, t, phase);
        vols[j][i] = v;
        if (v < lo) { lo = v; }
        if (v > hi) { hi = v; }
      }
    }
    var span = (hi - lo) || 1;

    var ct = Math.cos(theta), st = Math.sin(theta);
    var scale = Math.min(W, H * 1.6) * 0.92;
    var pts = [];
    for (j = 0; j < NT; j++) {
      pts[j] = [];
      for (i = 0; i < NK; i++) {
        var nx = i / (NK - 1) - 0.5;
        var ny = j / (NT - 1) - 0.5;
        var nz = (vols[j][i] - lo) / span;
        var x = nx * ct - ny * st;
        var y = nx * st + ny * ct;
        pts[j][i] = [
          W * 0.5 + x * scale,
          H * 0.58 + y * scale * 0.40 - nz * H * 0.34,
          nz,
          y
        ];
      }
    }

    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';

    /* term-structure lines (front to back), kept faint */
    for (i = 0; i < NK; i += 2) {
      ctx.beginPath();
      for (j = 0; j < NT; j++) {
        var q = pts[j][i];
        if (j === 0) { ctx.moveTo(q[0], q[1]); } else { ctx.lineTo(q[0], q[1]); }
      }
      ctx.strokeStyle = stroke(pts[(NT / 2) | 0][i][2], 0.16);
      ctx.stroke();
    }

    /* smile lines, one per maturity, brighter as they come forward */
    for (j = 0; j < NT; j++) {
      var depth = 0.30 + 0.70 * (j / (NT - 1));
      var peak = 0;
      ctx.beginPath();
      for (i = 0; i < NK; i++) {
        var p = pts[j][i];
        if (p[2] > peak) { peak = p[2]; }
        if (i === 0) { ctx.moveTo(p[0], p[1]); } else { ctx.lineTo(p[0], p[1]); }
      }
      ctx.strokeStyle = stroke(peak, 0.13 + 0.34 * depth);
      ctx.lineWidth = 0.7 + 0.7 * depth;
      ctx.stroke();
    }

    if (!reduced) { raf = window.requestAnimationFrame(frame); }
  }

  function start() {
    if (raf) { window.cancelAnimationFrame(raf); raf = null; }
    resize();
    if (reduced) { frame(4200); } else { raf = window.requestAnimationFrame(frame); }
  }

  var t0 = null;
  window.addEventListener('resize', function () {
    window.clearTimeout(t0);
    t0 = window.setTimeout(start, 140);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (raf) { window.cancelAnimationFrame(raf); raf = null; }
    } else if (!reduced && !raf) {
      raf = window.requestAnimationFrame(frame);
    }
  });

  start();
})();
