import { loadPyodide } from "./runtime/pyodide.mjs";
import { customWheels, packages } from "./runtime-config.js";

export async function startRuntime(progress = () => {}, localPath) {
  const indexURL = new URL("./runtime/", import.meta.url);
  const pyodide = await loadPyodide({ indexURL: localPath ?? indexURL.href });
  await pyodide.loadPackage(packages, { messageCallback: progress });
  await pyodide.loadPackage(customWheels.map(wheel => localPath ? localPath + wheel : new URL(wheel, indexURL).href), {
    messageCallback: progress,
  });
  pyodide.runPython("import torch");
  return pyodide;
}

export async function runSource(pyodide, source) {
  const namespace = pyodide.runPython("dict(__name__='__main__')");
  try {
    const result = await pyodide.runPythonAsync(source, { globals: namespace, filename: "exercise.py" });
    result?.destroy?.();
  } finally {
    namespace.destroy();
  }
}
