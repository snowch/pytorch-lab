import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { lessons } from "../dist/course.js";
import { runSource, startRuntime } from "../dist/engine.js";

const ids = lessons.map(({ id }) => id);
assert.equal(new Set(ids).size, ids.length);
assert.deepEqual((await readdir("examples")).sort(), ids.map(id => `${id}.py`).sort());
const runtime = await startRuntime(() => {}, fileURLToPath(new URL("../dist/runtime/", import.meta.url)));
assert.match(runtime.runPython("torch.__version__"), /^2\.13\.0\+pyodide/);
assert.equal(runtime.runPython("torch.cuda.is_available()"), false);

for (const lesson of lessons) {
  const base = `dist/downloads/${lesson.id}`;
  const source = await readFile(`${base}.py`, "utf8");
  const notebook = JSON.parse(await readFile(`${base}.ipynb`, "utf8"));
  assert.equal(notebook.cells.find(cell => cell.cell_type === "code").source.join(""), source);
  const curves = [];
  runtime.setStdout({
    batched(line) {
      if (line.startsWith("LAB_CURVE ")) curves.push(...JSON.parse(line.slice("LAB_CURVE ".length)));
    },
  });
  await runSource(runtime, source);
  if (lesson.plot) {
    assert(curves.length > 0);
    assert(curves.every(curve => curve.values.length > 1 && curve.values.every(Number.isFinite)));
  }
  console.log(`Passed in WebAssembly: ${lesson.title}`);
}
