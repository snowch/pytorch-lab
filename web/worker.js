import { runSource, startRuntime } from "./engine.js";

let runtime;
let running = false;

self.onmessage = async ({ data: { source } }) => {
  if (running) return;
  running = true;
  try {
    if (!runtime) {
      self.postMessage({ type: "status", text: "Loading the PyTorch runtime…" });
      runtime = await startRuntime();
    }
    self.postMessage({ type: "status", text: "Running Python…" });
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
