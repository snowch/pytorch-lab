import { lessons, modules } from "./course.js";
import { clearCurve, showCurve, snapshotCurve, restoreCurve } from "./chart.js";

import {execute,stopRunner,runnerBusy,runnerIdentity,runtimeRecovery} from './course-controls.mjs';
import {restoreReadingState} from './experiment-state.mjs';
import {references} from './references.mjs';
import {materialSymbol} from './material-symbols.mjs';
const get = id => document.getElementById(id);
const source = get("source");
const notes = get("notes");
const progress = get("progress");
const runButton = get("run");
const stopButton = get("stop");
const output = get("output");
const status = get("status");
const storageStatus = get("storage-status");
const downloads = new URL("./downloads/",import.meta.url);
const prefix = "pytorch-lab/v1/";
const session = new Map();
const lessonById = new Map(lessons.map(lesson => [lesson.id, lesson]));
const lessonLinks = new Map();

let current;
let showingHome;
let starter;
let undoSource;
let previousResult;
let busy = false;
let runGeneration=0;
let loadId = 0;
let loading=false;
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
    get("completion-note").textContent="Saved in this browser. Completion is your choice and does not grade your code.";
  } catch {
    storageStatus.textContent = "Browser storage is unavailable. Export your code before reloading or closing this page.";
    get("completion-note").textContent="Browser storage is unavailable. Completion changes will be lost when this page is reloaded or closed.";
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
  const group=document.createElement("section");group.id="group-"+modules.indexOf(module);
  const list = document.createElement("ul");
  for (const lesson of module.lessons) {
    const item = document.createElement("li");
    const link = lessonAnchor(lesson);
    const check = document.createElement("span");
    check.className = "lesson-check";
    check.setAttribute("aria-hidden", "true");
    const number=document.createElement("span");number.className="lesson-number";number.textContent=String(lessons.indexOf(lesson)+1).padStart(2,"0");link.prepend(number);
    link.append(check);
    item.append(link);
    list.append(item);
    lessonLinks.set(lesson.id, { link, check, module: module.title });
  }
  group.append(title,list);get("course-nav").append(group);
}

function updateProgress() {
  let completed = 0;
  for (const lesson of lessons) {
    const { link, check } = lessonLinks.get(lesson.id);
    const done = read(lesson.id + "/done") === "true";
    if (done) completed += 1;
    check.innerHTML = done ? materialSymbol("check") : "";
    if (done) link.setAttribute("aria-label", lesson.title + ", complete");
    else link.removeAttribute("aria-label");
    if (lesson === current && new URL(location.href).searchParams.has("lesson")) link.setAttribute("aria-current", "page");
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

function dismissWorker() {stopRunner();runGeneration++;setBusy(false);}

function outputLine(message) {
  const limit = 18000;
  if (outputLength >= limit) return;
  const remaining = limit - outputLength;
  output.append(document.createTextNode(message.slice(0, remaining) + "\n"));
  outputLength += message.length + 1;
  if (outputLength >= limit) output.append(document.createTextNode("[Output truncated]\n"));
}

function setPager(id, lesson, label) {
  const link=get(id);link.hidden=false;link.href=lesson?lessonURL(lesson):'./';
  link.querySelector('small').textContent=lesson?label:'Course overview';link.querySelector('strong').textContent=lesson?lesson.title:'Choose a lesson';
  link.setAttribute('aria-label',lesson?label+' '+lesson.title:'Course overview');
}
function setOutline(open){get('outline').hidden=!open;get('course-toggle').setAttribute('aria-expanded',String(open));}
get('course-toggle').onclick=()=>setOutline(get('outline').hidden);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!get('outline').hidden&&!document.querySelector('dialog:modal')){setOutline(false);get('course-toggle').focus();}});
function resultSnapshot(){return {text:output.textContent,status:status.textContent,kind:status.className,curve:snapshotCurve()};}
function restoreResult(saved){clearCurve();if(saved){output.textContent=saved.text;outputLength=saved.text.length;status.textContent=saved.status;status.className=saved.kind;restoreCurve(saved.curve);}}
function saveResult(){save(current.id+'/result',JSON.stringify(resultSnapshot()));}
function renderReferences(){
 const entries=references[current.id];get('reference-topics').textContent=entries.map(([title])=>title).join(', ');
 const list=document.createElement('ul');for(const[title,path,question]of entries){const li=document.createElement('li'),link=document.createElement('a'),context=document.createElement('p');link.href='https://docs.pytorch.org/docs/stable/'+path;link.textContent=title+' (new tab)';link.target='_blank';link.rel='noopener';context.textContent=question;li.append(link,context);list.append(li);}get('reference-links').replaceChildren(list);
}
async function getDownload(id, extension) {
  const response = await fetch(new URL(`${id}.${extension}`,downloads));
  if (!response.ok) throw new Error("The exercise file could not be loaded.");
  return response;
}

async function selectLesson(lesson, { focus = false } = {}) {
  const home=!new URL(location.href).searchParams.has('lesson');
  if (lesson === current && starter !== undefined && home === showingHome) return;
  showingHome=home;
  const selection = ++loadId;
  if (busy) dismissWorker();
  if(current&&starter!==undefined)saveResult();
  current = lesson;undoSource=undefined;get('undo-reset').hidden=true;
  document.querySelector('.hero').hidden=!home;get('lesson').hidden=home;setOutline(home);
  const module=modules.find(group=>group.lessons.includes(lesson));get('breadcrumbs').replaceChildren();
  if(!home){const separator=document.createElement('span');separator.textContent='/';const group=document.createElement('a');group.href='#group-'+modules.indexOf(module);group.textContent=module.title;group.onclick=event=>{event.preventDefault();setOutline(true);get(group.getAttribute('href').slice(1)).scrollIntoView({block:'nearest'});};const currentText=document.createElement('span');currentText.textContent=lesson.title;currentText.setAttribute('aria-current','page');get('breadcrumbs').append(separator,group,separator.cloneNode(true),currentText);}
  document.title=home?'PyTorch Lab':lesson.title+' · PyTorch Lab';renderReferences();
  starter = undefined;loading=true;
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
    if(!home)setOutline(false);
    if(!home){get("lesson").focus({ preventScroll: true });get("lesson").scrollIntoView({ block: "start" });}
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
    output.textContent = "Run the starter to see its printed output.";
    try{restoreResult(JSON.parse(read(current.id+'/result')));}catch{}
    loading=false;restoreReadingState();
  } catch (error) {
    if (selection !== loadId) return;
    loading=false;status.textContent = "Load failed";
    status.className = "status error";
    output.textContent = error.message;runtimeRecovery.open();
  }
}

async function run() {
 if(busy||starter===undefined)return;
 const request=++runGeneration;previousResult=resultSnapshot();setBusy(true);status.className='status';status.textContent='Preparing run…';
 let started=false;
 try{await execute({source:source.value},({type,...data})=>{
  if(request!==runGeneration)return;
  if(type==='status'){
   status.textContent=data.text;
   if(data.stage==='running'&&!started){started=true;clearCurve();output.textContent='';outputLength=0;}
  }
  if(type==='output'){if(!(current.plot&&showCurve(data.text,current.plot)))outputLine(data.text);}
  if(type==='done'){status.textContent='Finished';status.className='status success';if(outputLength===0&&get('chart-panel').hidden)outputLine('Finished without printed output.');setBusy(false);saveResult();}
  if(type==='error'){
   if(data.startup){restoreResult(previousResult);status.textContent='Runner files could not be loaded. Your previous result is kept.';}
   else{status.textContent='Python stopped with an error';outputLine(data.text);}
   status.className='status error';setBusy(false);if(!data.startup)saveResult();
  }
  if(type==='cancelled'){restoreResult(previousResult);status.textContent=data.message||'Run stopped. Your previous result is kept.';setBusy(false);}
 });}catch(error){restoreResult(previousResult);status.textContent=error.message;status.className='status error';setBusy(false);}
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
document.querySelector(".hero-action").addEventListener("click",followLesson);
document.querySelector(".course-home").addEventListener("click",followLesson);
document.querySelector(".brand").addEventListener("click",followLesson);
function followLesson(event) {
  const link = event.target.closest("a[href]");
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const id = new URL(link.href).searchParams.get("lesson");
  if(!id){event.preventDefault();history.pushState(null,'',link.href);selectLesson(lessons[0],{focus:true});return;}
  if (!lessonById.has(id)) return;
  event.preventDefault();
  if (new URL(location.href).searchParams.get("lesson") !== id) history.pushState(null, "", link.href);
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
  undoSource=source.value;get("undo-reset").hidden=false;source.value = starter;
  save(current.id + "/source", null);
  source.focus();
});
get("undo-reset").onclick=()=>{if(undoSource!==undefined){source.value=undoSource;save(current.id+"/source",undoSource);get("undo-reset").hidden=true;undoSource=undefined;source.focus();}};
runButton.addEventListener("click", run);
stopButton.addEventListener("click", () => {
  dismissWorker();
  status.textContent = "Run stopped. Your previous result is kept.";
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

window.pytorchApp={busy:()=>busy||runnerBusy()||loading,
 snapshot:()=>({session:[...session],source:starter===undefined?read(current.id+"/source"):source.value,notes:notes.value,result:starter===undefined?null:resultSnapshot(),undoSource}),
 restore(saved){if(!saved)return;for(const[key,value]of saved.session||[])session.set(key,value);if(saved.source!=null)source.value=saved.source;notes.value=saved.notes;if(saved.result)restoreResult(saved.result);undoSource=saved.undoSource;get('undo-reset').hidden=undoSource===undefined;updateProgress();},runnerIdentity};
window.addEventListener('storage',event=>{if(event.key?.startsWith(prefix)){session.delete(event.key.slice(prefix.length));updateProgress();}});
get('references').querySelector('[data-material]').innerHTML=materialSymbol('menu_book');
selectLesson(selectedFromURL());

get('course-toggle').querySelector('span').innerHTML=materialSymbol('expand_more');get('references').querySelector('.resource-chevron').innerHTML=materialSymbol('chevron_right');
