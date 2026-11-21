import { lessons, modules } from "./course.js";
import { clearCurve, showCurve } from "./chart.js";

const get = id => document.getElementById(id);
const source = get("source");
const notes = get("notes");
const progress = get("progress");
const runButton = get("run");
const stopButton = get("stop");
const output = get("output");
const status = get("status");
const storageStatus = get("storage-status");
const downloads = "./downloads/";
const prefix = "pytorch-lab/v1/";
const session = new Map();
const lessonById = new Map(lessons.map(lesson => [lesson.id, lesson]));
const lessonLinks = new Map();
const smallScreen = matchMedia("(max-width: 760px)");
let current;
let starter;
let worker;
let busy = false;
let loadId = 0;
let outputLength = 0;

function read(key) {
  if (session.has(key)) return session.get(key);
  try {
    return localStorage.getItem(prefix + key);
  } catch {
    return null;
  }
}

function save(key, value) {
  session.set(key, value);
  try {
    if (value === null) localStorage.removeItem(prefix + key);
    else localStorage.setItem(prefix + key, value);
    storageStatus.textContent = "";
  } catch {
    storageStatus.textContent = "Browser storage is unavailable. Changes will last until this page closes.";
  }
}

function lessonURL(lesson) {
  return "?lesson=" + encodeURIComponent(lesson.id);
}

function selectedFromURL() {
  return lessonById.get(new URL(location.href).searchParams.get("lesson")) ?? lessons[0];
}

function lessonAnchor(lesson) {
  const link = document.createElement("a");
  link.href = lessonURL(lesson);
  link.textContent = lesson.title;
  return link;
}

for (const module of modules) {
  const title = document.createElement("h2");
  title.textContent = module.title;
  const list = document.createElement("ul");
  for (const lesson of module.lessons) {
    const item = document.createElement("li");
    const link = lessonAnchor(lesson);
    const check = document.createElement("span");
    check.className = "lesson-check";
    check.setAttribute("aria-hidden", "true");
    link.append(check);
    item.append(link);
    list.append(item);
    lessonLinks.set(lesson.id, { link, check, module: module.title });
  }
  get("course-nav").append(title, list);
}

function updateProgress() {
  let completed = 0;
  for (const lesson of lessons) {
    const { link, check } = lessonLinks.get(lesson.id);
    const done = read(lesson.id + "/done") === "true";
    if (done) completed += 1;
    check.textContent = done ? "✓" : "";
    if (done) link.setAttribute("aria-label", lesson.title + ", complete");
    else link.removeAttribute("aria-label");
    if (lesson === current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  get("complete").checked = read(current.id + "/done") === "true";
  progress.max = lessons.length;
  progress.value = completed;
  get("progress-label").textContent = `${completed} of ${lessons.length} complete`;
}

function setBusy(value) {
  busy = value;
  runButton.disabled = value || starter === undefined;
  stopButton.hidden = !value;
}

function dismissWorker() {
  worker?.terminate();
  worker = undefined;
  setBusy(false);
}

function outputLine(message) {
  const limit = 18000;
  if (outputLength >= limit) return;
  const remaining = limit - outputLength;
  output.append(document.createTextNode(message.slice(0, remaining) + "\n"));
  outputLength += message.length + 1;
  if (outputLength >= limit) output.append(document.createTextNode("[Output truncated]\n"));
}

function setPager(id, lesson, label) {
  const link = get(id);
  link.hidden = !lesson;
  if (lesson) {
    link.href = lessonURL(lesson);
    link.setAttribute("aria-label", label + " " + lesson.title);
  } else {
    link.removeAttribute("href");
  }
}

async function getDownload(id, extension) {
  const response = await fetch(`${downloads}${id}.${extension}`);
  if (!response.ok) throw new Error("The exercise file could not be loaded.");
  return response;
}

async function selectLesson(lesson, { focus = false } = {}) {
  if (lesson === current && starter !== undefined) return;
  const selection = ++loadId;
  if (busy) dismissWorker();
  current = lesson;
  starter = undefined;
  setBusy(false);
  source.disabled = true;
  get("reset").disabled = true;
  get("download-python").disabled = true;
  get("download-notebook").disabled = true;
  get("lesson-body").hidden = false;
  get("module-title").textContent = lessonLinks.get(lesson.id).module;
  get("lesson-title").textContent = lesson.title;
  get("lesson-intro").textContent = lesson.intro;
  get("concept").textContent = lesson.concept;
  get("predict").textContent = lesson.predict;
  get("try-it").textContent = lesson.tryIt;
  get("hint").textContent = lesson.hint;
  get("answer").textContent = lesson.answer;
  get("hint-box").open = false;
  get("answer-box").open = false;
  storageStatus.textContent = "";
  notes.value = read(lesson.id + "/notes") ?? "";
  get("filename").textContent = lesson.id + ".py";
  const related = get("related");
  related.hidden = !lesson.link;
  if (lesson.link) [related.textContent, related.href] = lesson.link;
  const index = lessons.indexOf(lesson);
  setPager("previous", lessons[index - 1], "Previous lesson");
  setPager("next", lessons[index + 1], "Next lesson");
  updateProgress();

  clearCurve();
  source.value = "";
  output.textContent = "";
  status.className = "status";
  status.textContent = "Loading exercise…";
  if (focus) {
    if (smallScreen.matches) get("outline").open = false;
    get("lesson").focus({ preventScroll: true });
    get("lesson").scrollIntoView({ block: "start" });
  }
  try {
    const text = await (await getDownload(lesson.id, "py")).text();
    if (selection !== loadId) return;
    starter = text;
    source.value = read(lesson.id + "/source") ?? starter;
    source.disabled = false;
    get("reset").disabled = false;
    get("download-python").disabled = false;
    get("download-notebook").disabled = false;
    runButton.disabled = false;
    status.textContent = "Ready";
    output.textContent = "Run the exercise to see its result.";
  } catch (error) {
    if (selection !== loadId) return;
    status.textContent = "Load failed";
    status.className = "status error";
    output.textContent = error.message + " Reload the page to try again.";
  }
}

function run() {
  if (busy || starter === undefined) return;
  setBusy(true);
  clearCurve();
  output.textContent = "";
  outputLength = 0;
  status.className = "status";
  status.textContent = worker ? "Running Python…" : "Starting PyTorch…";
  try {
    if (!worker) {
      worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
      worker.onmessage = ({ data }) => {
        switch (data.type) {
          case "status":
            status.textContent = data.text;
            break;
          case "output":
            if (current.plot && showCurve(data.text, current.plot)) break;
            outputLine(data.text);
            break;
          case "done":
            status.textContent = "Finished";
            status.className = "status success";
            if (outputLength === 0 && get("chart-panel").hidden) outputLine("Finished without printed output.");
            setBusy(false);
            break;
          case "error":
            status.textContent = data.startup ? "Runtime could not start" : "Python error";
            status.className = "status error";
            outputLine(data.text);
            if (data.startup) dismissWorker();
            else setBusy(false);
            break;
        }
      };
      worker.onerror = () => {
        status.textContent = "Runtime could not start";
        status.className = "status error";
        outputLine("Try Run again, or download the exercise to use native PyTorch.");
        dismissWorker();
      };
    }
    worker.postMessage({ source: source.value });
  } catch (error) {
    status.textContent = "Runtime could not start";
    status.className = "status error";
    outputLine(error.message);
    dismissWorker();
  }
}

function download(filename, contents, type) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

get("course-nav").addEventListener("click", followLesson);
document.querySelector(".pager").addEventListener("click", followLesson);
function followLesson(event) {
  const link = event.target.closest("a[href]");
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const id = new URL(link.href).searchParams.get("lesson");
  if (!lessonById.has(id)) return;
  event.preventDefault();
  if (id !== current.id) history.pushState(null, "", link.href);
  selectLesson(lessonById.get(id), { focus: true });
}

window.addEventListener("popstate", () => selectLesson(selectedFromURL(), { focus: true }));
source.addEventListener("input", () => save(current.id + "/source", source.value));
notes.addEventListener("input", () => save(current.id + "/notes", notes.value));
source.addEventListener("keydown", event => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    run();
  }
});
get("reset").addEventListener("click", () => {
  source.value = starter;
  save(current.id + "/source", null);
  source.focus();
});
runButton.addEventListener("click", run);
stopButton.addEventListener("click", () => {
  dismissWorker();
  status.textContent = "Stopped";
  runButton.focus();
});
get("complete").addEventListener("change", event => {
  save(current.id + "/done", String(event.target.checked));
  updateProgress();
});
get("download-python").addEventListener("click", () => {
  download(current.id + ".py", source.value, "text/x-python");
});
get("download-notebook").addEventListener("click", async () => {
  const { id } = current;
  const code = source.value;
  try {
    const notebook = await (await getDownload(id, "ipynb")).json();
    notebook.cells.find(cell => cell.cell_type === "code").source = code.match(/[^\n]*\n|[^\n]+$/g) ?? [];
    download(id + ".ipynb", JSON.stringify(notebook, null, 2), "application/x-ipynb+json");
  } catch (error) {
    if (current.id === id) {
      status.textContent = "Notebook download failed";
      status.className = "status error";
      outputLine(error.message);
    }
  }
});

if (smallScreen.matches) get("outline").open = false;
selectLesson(selectedFromURL());
