/* Animated implied-volatility surface for the hero.
   Raw SVI (Gatheral) total variance for each maturity slice:
       w(k) = a + b * ( rho*(k-m) + sqrt((k-m)^2 + sigma^2) )
   and the implied vol plotted is sqrt(w/t). On top of that smooth smile sits a
   multi-octave rough field -- log volatility really does behave like fractional
   Brownian motion with a very low Hurst exponent -- plus two drifting event
   peaks, so the surface reads as terrain rather than a plane. */
(function () {
  var canvas = document.getElementById('surface');
  if (!canvas || !canvas.getContext) { return; }
  var ctx = canvas.getContext('2d');

  var NK = 58, NT = 34;
  var K0 = -1.15, K1 = 1.15;   /* log-moneyness */
  var T0 = 0.30,  T1 = 2.40;   /* maturity, years */

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

  /* four octaves of smooth pseudo-noise, roughly -1..1 */
  function rough(k, t, p) {
    var n = 0, amp = 1, norm = 0, fk = 2.3, ft = 1.7, o;
    for (o = 0; o < 4; o++) {
      n += amp * Math.sin(fk * k + 1.7 * o + p * 0.70) *
                 Math.cos(ft * t + 2.3 * o - p * 0.55);
      norm += amp;
      amp *= 0.62; fk *= 2.11; ft *= 1.97;
    }
    return n / norm;
  }

  /* a drifting gaussian peak: the mountain an expiry or an event puts there */
  function bump(k, t, ck, ct, wk, wt, h) {
    var dk = (k - ck) / wk, dt = (t - ct) / wt;
    return h * Math.exp(-(dk * dk + dt * dt));
  }

  function field(k, t, p) {
    var v = sviVol(k, t, p) * (1 + 0.36 * rough(k, t, p));
    v += bump(k, t, -0.36 + 0.54 * Math.sin(p * 0.45),
                    0.78 + 0.42 * Math.sin(p * 0.31 + 1.1),
                    0.24, 0.38, 0.62);
    v += bump(k, t,  0.48 + 0.34 * Math.sin(p * 0.37 + 2.2),
                     1.55 + 0.50 * Math.sin(p * 0.26 + 0.4),
                     0.20, 0.32, 0.38);
    v += bump(k, t, -0.05 + 0.60 * Math.sin(p * 0.23 + 4.0),
                     2.05 + 0.30 * Math.sin(p * 0.41 + 2.7),
                     0.18, 0.30, 0.26);
    return v;
  }

  /* cyan low ground -> coral high ridges, matching the badge */
  function stroke(e, alpha) {
    e = e < 0 ? 0 : (e > 1 ? 1 : e);
    var r = Math.round(127 + (240 - 127) * e);
    var g = Math.round(212 + (137 - 212) * e);
    var b = Math.round(232 + ( 92 - 232) * e);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function frame(ms) {
    var phase = ms * 0.00014;
    var theta = 0.46 + 0.15 * Math.sin(ms * 0.000045);

    var vols = [], lo = 1e9, hi = -1e9, i, j, k, t, v;
    for (j = 0; j < NT; j++) {
      t = T0 + (T1 - T0) * (j / (NT - 1));
      vols[j] = [];
      for (i = 0; i < NK; i++) {
        k = K0 + (K1 - K0) * (i / (NK - 1));
        v = field(k, t, phase);
        vols[j][i] = v;
        if (v < lo) { lo = v; }
        if (v > hi) { hi = v; }
      }
    }
    var span = ((hi - lo) * 0.86) || 1;   /* let the tallest peak saturate rather than crush the rest */

    var ct = Math.cos(theta), st = Math.sin(theta);
    var scale = Math.min(W * 0.95, H * 1.9) * 0.95;
    var lift = H * 0.74;
    var pts = [];
    for (j = 0; j < NT; j++) {
      pts[j] = [];
      var f = j / (NT - 1);
      for (i = 0; i < NK; i++) {
        var nx = i / (NK - 1) - 0.5;
        var ny = 0.5 - f;              /* nearest maturity sits at the front */
        var nz = (vols[j][i] - lo) / span;
        if (nz > 1) { nz = 1; }
        var e = Math.pow(nz, 0.62);    /* raw range is dominated by the short wings */
        var x = nx * ct - ny * st;
        var y = nx * st + ny * ct;
        pts[j][i] = [
          W * 0.5 + x * scale,
          H * 0.86 + y * H * 0.64 - e * lift,
          e
        ];
      }
    }

    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = 'round';

    /* term-structure lines (front to back), kept faint */
    ctx.lineWidth = 0.9;
    for (i = 0; i < NK; i += 2) {
      ctx.beginPath();
      for (j = 0; j < NT; j++) {
        var q = pts[j][i];
        if (j === 0) { ctx.moveTo(q[0], q[1]); } else { ctx.lineTo(q[0], q[1]); }
      }
      ctx.strokeStyle = stroke(pts[(NT / 2) | 0][i][2], 0.20);
      ctx.stroke();
    }

    /* smile lines, one per maturity, drawn back to front and brighter as they advance */
    for (j = NT - 1; j >= 0; j--) {
      var depth = 1 - j / (NT - 1);
      var peak = 0;
      ctx.beginPath();
      for (i = 0; i < NK; i++) {
        var p = pts[j][i];
        if (p[2] > peak) { peak = p[2]; }
        if (i === 0) { ctx.moveTo(p[0], p[1]); } else { ctx.lineTo(p[0], p[1]); }
      }
      ctx.strokeStyle = stroke(peak, 0.16 + 0.46 * depth);
      ctx.lineWidth = 0.8 + 1.0 * depth;
      ctx.stroke();
    }

    if (!reduced) { raf = window.requestAnimationFrame(frame); }
  }

  function start() {
    if (raf) { window.cancelAnimationFrame(raf); raf = null; }
    resize();
    if (reduced) { frame(6600); } else { raf = window.requestAnimationFrame(frame); }
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
