import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { copyFile, mkdir, readFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const curl = promisify(execFile);
const cache = ".cache/runtime";
const pyodide = "node_modules/pyodide";
const version = "314.0.2";
const cdn = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`;
const manifest = JSON.parse(await readFile("scripts/torch-build-manifest.json", "utf8"));
const lock = JSON.parse(await readFile(join(pyodide, "pyodide-lock.json"), "utf8"));
const torchRelease = manifest.configuration.release.tag;

const filelock = {
  name: "filelock-3.32.0-py3-none-any.whl",
  sha256: "d396bea984af47333ef05e50eae7eff88c84256de6112aea0ec48a233c064fe3",
  url: "https://files.pythonhosted.org/packages/06/79/b4c714bef36bc4ec2beeae1e0c124f0223888cd8c6feb1cdc56038116920/filelock-3.32.0-py3-none-any.whl",
};
const torchWheel = {
  name: manifest.wheel.filename,
  sha256: manifest.wheel.sha256,
  url: `https://github.com/mmtftr/pyodide-pytorch/releases/download/${torchRelease}/${encodeURIComponent(manifest.wheel.filename)}`,
};
export const packages = ["numpy", "typing-extensions", "sympy", "networkx", "jinja2", "fsspec"];
export const customWheels = [filelock.name, torchWheel.name];

function packageAssets(names, found = new Map()) {
  for (const name of names) {
    if (found.has(name)) continue;
    const info = lock.packages[name];
    if (!info) throw new Error(`Missing ${name} in the Pyodide package lock`);
    found.set(name, {
      name: info.file_name,
      sha256: info.sha256,
      url: new URL(info.file_name, cdn).href,
    });
    packageAssets(info.depends, found);
  }
  return [...found.values()];
}

async function digest(path) {
  try {
    return createHash("sha256").update(await readFile(path)).digest("hex");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return null;
  }
}

async function stage(asset, target) {
  const file = join(cache, asset.name);
  if (await digest(file) !== asset.sha256) {
    const partial = `${file}.${process.pid}.tmp`;
    await curl("curl", ["-fsSL", "--retry", "3", "--max-time", "120", "-o", partial, asset.url]);
    if (await digest(partial) !== asset.sha256) {
      throw new Error(`Checksum mismatch for ${asset.name}`);
    }
    await rename(partial, file);
  }
  await copyFile(file, join(target, asset.name));
}

export async function stageRuntime(target) {
  await Promise.all([mkdir(cache, { recursive: true }), mkdir(target, { recursive: true })]);
  await Promise.all([
    ...["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"]
      .map(name => copyFile(join(pyodide, name), join(target, name))),
    ...[...packageAssets(packages), filelock, torchWheel].map(asset => stage(asset, target)),
    copyFile("scripts/torch-build-manifest.json", join(target, "torch-build-manifest.json")),
  ]);
}
