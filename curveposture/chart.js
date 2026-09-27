const COLORS = {
  background: "#06111c",
  panel: "#0c1c2b",
  text: "#e4eef5",
  muted: "#8ba6bb",
  grid: "#22394d",
  vix: "#e4eef5",
  vx30: "#7fd4e8",
  vx60: "#f0895c",
  front: "#ef6262",
  back: "#69c5a5",
  positive: "#69c5a5",
  negative: "#ef6262"
};
const PREVIEW_END = Date.parse("2026-10-05T00:00:00Z");

const formatNumber = value => value.toFixed(2);
const formatSigned = (value, suffix = "") =>
  `${value >= 0 ? "+" : ""}${value.toFixed(1)}${suffix}`;

function setLatest(latest) {
  const [date, vix, vx30, vx60] = latest;
  const front = (vx30 / vix - 1) * 100;
  const back = (vx60 / vx30 - 1) * 100;
  const belly = vx30 - (vix + vx60) / 2;
  document.querySelector("#as-of").textContent = date;
  document.querySelector("#stat-vix").textContent = formatNumber(vix);
  document.querySelector("#stat-vx30").textContent = formatNumber(vx30);
  document.querySelector("#stat-vx60").textContent = formatNumber(vx60);
  document.querySelector("#stat-front").textContent = formatSigned(front, "%");
  document.querySelector("#stat-back").textContent = formatSigned(back, "%");
  document.querySelector("#stat-belly").textContent = formatSigned(belly);
}

function buildChart(rows) {
  const dates = rows.map(row => row[0]);
  const vix = rows.map(row => row[1]);
  const vx30 = rows.map(row => row[2]);
  const vx60 = rows.map(row => row[3]);
  const front = rows.map((row, index) => (vx30[index] / vix[index] - 1) * 100);
  const back = rows.map((row, index) => (vx60[index] / vx30[index] - 1) * 100);
  const belly = rows.map((row, index) => vx30[index] - (vix[index] + vx60[index]) / 2);
  const start = new Date(`${dates.at(-1)}T00:00:00Z`);
  start.setUTCFullYear(start.getUTCFullYear() - 2);

  const line = (values, name, color, axis, template) => ({
    x: dates,
    y: values,
    name,
    type: "scatter",
    mode: "lines",
    xaxis: axis,
    yaxis: axis.replace("x", "y"),
    line: {color, width: 2},
    hovertemplate: template
  });

  const data = [
    line(vix, "VIX spot", COLORS.vix, "x", "VIX %{y:.2f}<extra></extra>"),
    line(vx30, "VX30", COLORS.vx30, "x", "VX30 %{y:.2f}<extra></extra>"),
    line(vx60, "VX60", COLORS.vx60, "x", "VX60 %{y:.2f}<extra></extra>"),
    line(front, "Front premium", COLORS.front, "x2", "Front %{y:+.2f}%<extra></extra>"),
    line(back, "Back slope", COLORS.back, "x2", "Back %{y:+.2f}%<extra></extra>"),
    {
      x: dates,
      y: belly,
      name: "30-day belly",
      type: "bar",
      xaxis: "x3",
      yaxis: "y3",
      marker: {color: belly.map(value => value >= 0 ? COLORS.positive : COLORS.negative)},
      hovertemplate: "Belly %{y:+.2f} points<extra></extra>"
    }
  ];

  const axis = {
    color: COLORS.muted,
    gridcolor: COLORS.grid,
    linecolor: COLORS.grid,
    tickfont: {family: "ui-monospace, monospace", size: 11},
    zeroline: false
  };
  const xAxis = {...axis, type: "date", showgrid: false};
  const yAxis = {...axis, fixedrange: true, titlefont: {size: 11}};
  const layout = {
    autosize: true,
    height: window.innerWidth < 640 ? 900 : 820,
    paper_bgcolor: COLORS.background,
    plot_bgcolor: COLORS.panel,
    font: {family: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif", color: COLORS.text},
    margin: {l: window.innerWidth < 640 ? 48 : 64, r: 20, t: 54, b: 54},
    hovermode: "x unified",
    hoversubplots: "axis",
    hoverlabel: {bgcolor: "#102435", bordercolor: COLORS.grid, font: {color: COLORS.text}},
    legend: {orientation: "h", x: 0, y: 1.08, font: {size: 12}},
    bargap: 0,
    xaxis: {...xAxis, anchor: "y", domain: [0, 1], matches: "x3", showticklabels: false},
    yaxis: {...yAxis, domain: [0.61, 1], title: "Index level"},
    xaxis2: {...xAxis, anchor: "y2", domain: [0, 1], matches: "x3", showticklabels: false},
    yaxis2: {...yAxis, domain: [0.29, 0.53], title: "Percent", ticksuffix: "%", zeroline: true, zerolinecolor: COLORS.muted},
    xaxis3: {
      ...xAxis,
      anchor: "y3",
      domain: [0, 1],
      range: [start.toISOString().slice(0, 10), dates.at(-1)],
      rangeselector: {
        x: 0,
        y: 1.16,
        bgcolor: COLORS.panel,
        activecolor: COLORS.vx30,
        bordercolor: COLORS.grid,
        borderwidth: 1,
        font: {color: COLORS.text, size: 11},
        buttons: [
          {count: 3, label: "3M", step: "month", stepmode: "backward"},
          {count: 6, label: "6M", step: "month", stepmode: "backward"},
          {count: 1, label: "1Y", step: "year", stepmode: "backward"},
          {count: 3, label: "3Y", step: "year", stepmode: "backward"},
          {label: "All", step: "all"}
        ]
      }
    },
    yaxis3: {...yAxis, domain: [0, 0.20], title: "Points", zeroline: true, zerolinecolor: COLORS.muted},
    annotations: [
      {text: "Curve levels", x: 0, y: 1.015, xref: "paper", yref: "paper", showarrow: false, xanchor: "left", font: {size: 12, color: COLORS.muted}},
      {text: "Term premiums", x: 0, y: 0.55, xref: "paper", yref: "paper", showarrow: false, xanchor: "left", font: {size: 12, color: COLORS.muted}},
      {text: "30-day belly", x: 0, y: 0.215, xref: "paper", yref: "paper", showarrow: false, xanchor: "left", font: {size: 12, color: COLORS.muted}}
    ]
  };

  Plotly.newPlot("curve-chart", data, layout, {
    displaylogo: false,
    responsive: true,
    scrollZoom: true,
    modeBarButtonsToRemove: ["lasso2d", "select2d"]
  });
}

if (Date.now() >= PREVIEW_END) {
  document.querySelector("#curve-chart").innerHTML =
    '<p class="chart-error">This preview ended on October 5, 2026.</p>';
} else {
  fetch("data.json", {cache: "no-store"})
    .then(response => {
      if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
      return response.json();
    })
    .then(payload => {
      if (payload.schema !== 1 || !payload.observations?.length) {
        throw new Error("Curve data is empty or incompatible");
      }
      setLatest(payload.observations.at(-1));
      buildChart(payload.observations);
    })
    .catch(error => {
      console.error(error);
      document.querySelector("#curve-chart").innerHTML =
        '<p class="chart-error">Curve history could not be loaded.</p>';
    });
}