const panel = document.getElementById("chart-panel");
const canvas = document.getElementById("chart");
const legend = document.getElementById("legend");
const data = document.getElementById("chart-data");
const lightColors = ["#3e46a9", "#b44332", "#0f7859", "#7951a4", "#315d8c", "#956400"];
const palette=()=>document.documentElement.dataset.theme==='dark'?["#a6b9ff", "#ffb4a5", "#91dbc0", "#d7b8ff", "#93d2fb", "#f0d18b"]:lightColors;
const prefix = "LAB_CURVE ";
let current;

export function clearCurve() {
  panel.hidden = true;
  current = undefined;
  data.replaceChildren();
  legend.replaceChildren();
}

export function showCurve(line, axis) {
  if (!line.startsWith(prefix)) return false;
  let series;
  try {
    series = JSON.parse(line.slice(prefix.length));
  } catch {
    return false;
  }
  if (!Array.isArray(series) || series.length < 1 || series.length > lightColors.length ||
      !series.every(entry => entry && typeof entry.label === "string" &&
        Array.isArray(entry.values) && entry.values.length > 1 &&
        entry.values.length <= 500 && entry.values.every(Number.isFinite))) return false;

  current = { series, axis };
  panel.hidden = false;
  legend.replaceChildren(...series.map(({ label }, i) => {
    const item = document.createElement("li");
    const swatch = document.createElement("span");
    swatch.style.background = palette()[i];
    item.append(swatch, label);
    return item;
  }));
  const table = document.createElement("table");
  const header = table.createTHead().insertRow();
  for (const title of [axis, ...series.map(({ label }) => label)]) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = title;
    header.append(th);
  }
  const body = table.createTBody();
  const count = Math.max(...series.map(entry => entry.values.length));
  for (let step = 0; step < count; step++) {
    const row = body.insertRow();
    row.insertCell().textContent = step;
    for (const { values } of series) {
      row.insertCell().textContent = values[step]?.toPrecision(5) ?? "—";
    }
  }
  data.replaceChildren(table);
  draw();
  return true;
}

function draw() {
  if (!current || panel.hidden) return;
  const { series, axis } = current;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width < 100) return;
  const pixel = devicePixelRatio || 1;
  canvas.width = Math.round(width * pixel);
  canvas.height = Math.round(height * pixel);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(pixel, pixel);
  legend.querySelectorAll("li span").forEach((swatch,i)=>swatch.style.background=palette()[i]);
  const left = 55;
  const right = width - 15;
  const top = 15;
  const bottom = height - 47;
  const points = series.flatMap(entry => entry.values);
  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const span = max - min || 1;
  const steps = Math.max(...series.map(entry => entry.values.length)) - 1;
  ctx.font = "13px IBM Plex Sans, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const y = top + i * (bottom - top) / 4;
    ctx.strokeStyle = "#dce0eb";
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim()||"#414969";
    ctx.fillText((min + span * (1 - i / 4)).toPrecision(2), left - 7, y);
  }
  ctx.textAlign = "center";
  for (const step of new Set([0, Math.round(steps / 2), steps])) {
    ctx.fillText(step, left + step / steps * (right - left), bottom + 14);
  }
  ctx.fillText(axis, (left + right) / 2, bottom + 34);
  series.forEach(({ values }, index) => {
    ctx.beginPath();
    ctx.strokeStyle = palette()[index];
    ctx.lineWidth = 2.4;
    values.forEach((value, step) => {
      const x = left + step / steps * (right - left);
      const y = bottom - (value - min) / span * (bottom - top);
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
}

if ("ResizeObserver" in window) new ResizeObserver(draw).observe(canvas);
else window.addEventListener("resize", draw);

export const snapshotCurve=()=>current?JSON.parse(JSON.stringify(current)):null;
export function restoreCurve(saved){clearCurve();if(saved)showCurve(prefix+JSON.stringify(saved.series),saved.axis);}
new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
