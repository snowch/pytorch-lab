import { runSource, startRuntime } from "./engine.js";

let runtime;
let running = false;

async function prepareRuntime() {
  // Pyodide 314's instantiateWasm hook logs some load failures without
  // rejecting loadPyodide(). Race explicit worker-local fetch failures so a
  // 503 cannot leave the learner waiting for an initializer that never settles.
  const originalFetch=self.fetch;
  let rejectFailure;
  const failure=new Promise((_,reject)=>{rejectFailure=reject;});
  self.fetch=async(input,options)=>{
    try {
      const response=await originalFetch.call(self,input,options);
      if(!response.ok){
        const path=new URL(typeof input==='string'?input:input.url||String(input),self.location.href).pathname.split('/').pop();
        throw Error(`Could not load ${path} (HTTP ${response.status}).`);
      }
      return response;
    } catch(error){rejectFailure(error);throw error;}
  };
  try{return await Promise.race([startRuntime(),failure]);}
  finally{self.fetch=originalFetch;}
}

self.onmessage = async ({ data: { source, type } }) => {
  if (running) return;
  running = true;
  try {
    if (!runtime) {
      self.postMessage({ type: "status", stage:"loading", text: "Loading the PyTorch runtime…" });
      runtime = await prepareRuntime();
    }
    if(type === "prepare"){self.postMessage({type:"ready"});return;}
    self.postMessage({ type: "status", stage:"running", text: "Running Python…" });
    let sent = 0;
    const limit = 18000;
    const output = {
      batched(text) {
        if (sent >= limit) return;
        self.postMessage({ type: "output", text: text.slice(0, limit - sent) });
        sent += text.length + 1;
      },
    };
    runtime.setStdout(output);
    runtime.setStderr(output);
    await runSource(runtime, source);
    self.postMessage({ type: "done" });
  } catch (error) {
    self.postMessage({ type: "error", text: error.message, startup: !runtime });
  } finally {
    running = false;
  }
};
