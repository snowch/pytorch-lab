# Managed PyTorch runtime

One module worker per reading window owns Pyodide and the CPU-based PyTorch installation. Query navigation and Back/Forward retain the worker. Every experiment gets a fresh Python namespace; variables from an earlier run do not become lesson inputs. Tabs own independent runtimes.

Code runner shows Stopped, Starting, Running or Ready. Start runner prepares PyTorch without executing learner code and acknowledges the CPU/memory explanation. The next Run does not show a duplicate introduction. An implicit first Run opens a persistent native modal before loading the runtime; Escape cancels without starting it. Runner settings remain in the header. Navigating away while this explanation is open cancels its pending run; returning to the lesson cannot execute that abandoned request.

Free memory terminates the worker while preserving code, predictions, completion, printed output and plotted series. The default idle timeout is 30 minutes with saved 5/15/30/60-minute choices. Elapsed wall-clock time is checked when a suspended tab returns. A running experiment is never stopped merely because the idle timeout expires. Startup and execution each have a two-minute safety deadline; Stop interrupts immediately and restores the previous result.

Python exceptions keep the warm runtime and show the actual traceback. Startup fetches explicitly reject HTTP errors, including failures Pyodide’s initializer otherwise swallows. Startup failures and a stalled startup deadline terminate the failed worker and open a persistent recovery dialog. Reload saves the current window before navigating; unavailable storage blocks it. No automatic code execution occurs after reload. Browsers cannot reliably report portable per-runner CPU percentage or total memory; do not invent these figures.

`worker.js` accepts the original `{source}` message and the additional `{type:'prepare'}` request. This preserves older open tabs during the first deployment. Runtime dependencies resolve relative to the immutable worker/module release after adoption. The build retains two verified preceding releases for older tabs that have not started PyTorch yet.
