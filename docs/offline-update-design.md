# Offline use and updates in PyTorch Lab

The reusable design follows the [CUDA Python offline/update contract](https://github.com/snowch/cuda-python-lab/blob/main/docs/offline-update-design.md). The implementation shares the verified release manifests, immutable assets, network-first online navigation, complete offline-copy validation, resumable transfers and two-phase restart protocol used by the Foundry and CUDA labs.

## User states

- Online without a saved copy: “Up to date online. Not saved for offline use.” App status offers Save offline copy.
- A complete verified copy: “Downloaded and ready to use offline.” Normal online reloads still read published pages.
- A newer course: Update offline copy saves and checks the complete new release, then offers Restart to update. Reading online does not require downloading the complete course.
- Interrupted download: retain verified files and the previous complete copy; resume without claiming readiness.
- Missing/corrupt cached files: show repair state rather than claiming the course is ready.

Automatic checks fetch small metadata, not the whole runtime. Browser storage overhead is additional. External documentation needs a connection. Notebooks executed outside this browser require separate Python/PyTorch tools and suitable hardware for CUDA.

## Release and storage boundaries

`web/` is authored source; `dist/` is generated. `npm run build` starts with a clean output directory, stages pinned runtime assets and exact example/notebook pairs, then emits the manifest, service worker and immutable release tree. Wheels are copied as downloaded and hash-checked, not rebuilt. Python wheel local-version labels contain a literal `+`; the manifest allows that safe filename character and the service worker canonicalizes `%2B` to the same cache key. Encoded separators and traversal are not allowed by the manifest contract.

The published site retains the two preceding exact-byte-verified release trees. All imports, package wheels and example downloads resolve relative to `import.meta.url`, preserving an open document’s runtime release. Root worker URLs and the original `{source}` protocol remain compatible for tabs opened before this mechanism existed.

The existing `pytorch-lab/v1/<lesson>/source`, `/notes` and `/done` keys remain unchanged. Results add `/result`, including bounded printed output and structured loss-series data. Each tab saves its current URL query, scroll position, disclosures, in-memory drafts, prediction, result and Undo restore state into its own verified session snapshot before a reload. PREPARE_RESTART asks every controlled tab to save; typing, loading, running or unavailable snapshot storage vetoes restart. COMMIT reloads only after all windows acknowledge. ABORT unlocks them without changing their work. Restoring a snapshot never runs Python.

## Failure recovery

HTTP 503, unavailable runtime dependencies and startup exceptions are infrastructure failures. A persistent dimmed recovery modal explains Reload lesson and Stay on lesson. Reload is blocked if preserving work fails. Pyodide 314’s initializer can swallow an instantiation error and never settle after HTTP 503. During startup, a worker-local fetch wrapper checks response status and races failures against initialization; it is removed after startup. A two-minute startup deadline also opens recovery if initialization stalls. The failed worker is terminated, so pending loader promises cannot contaminate the next attempt. Ordinary Python exceptions and deliberate assertion failures belong in Console and do not invoke this modal. A failed or cancelled run retains the previous valid result. A source-file load failure must also allow a safe reload; it must not leave the restart guard permanently waiting for a lesson that cannot load.

## Verification

Run all 26 examples and validate exported notebooks against their Python source. Browser journeys exercise explicit startup followed by Run, implicit startup cancellation, warm reuse between lessons, Stop, idle release, ordinary exceptions, plots and saved work. Save the entire real runtime, disconnect the browser context and open an unvisited lesson in a fresh tab, then execute it. Exercise old-tab first Run after deployment, a two-tab update/restart, blocked saving, interrupted/corrupt downloads and runtime HTTP 503. Check navigation, both themes and phone/desktop sizes. Readiness means all manifest files passed verification, not just that a progress bar reached 100%.
