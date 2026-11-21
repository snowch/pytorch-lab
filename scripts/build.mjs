import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { lessons, modules } from "../web/course.js";
import { customWheels, packages, stageRuntime } from "./runtime-assets.mjs";

const output = "dist";
await mkdir(`${output}/downloads`, { recursive: true });
await Promise.all([
  cp("web", output, { recursive: true }),
  cp("THIRD_PARTY.md", `${output}/notices.txt`),
  cp("licenses", `${output}/licenses`, { recursive: true }),
  stageRuntime(`${output}/runtime`),
]);

function notebook(lesson, source) {
  const lines = text => text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
      language_info: { name: "python" },
    },
    cells: [
      {
        id: "investigation", cell_type: "markdown", metadata: {},
        source: lines(`# ${lesson.title}\n\n${lesson.intro}\n\n${lesson.concept}\n\n**Predict**\n\n${lesson.predict}\n\nInstall PyTorch in the active Python environment before running the cell.\n`),
      },
      {
        id: "experiment", cell_type: "code", metadata: {}, outputs: [],
        execution_count: null, source: lines(source),
      },
      {
        id: "practice", cell_type: "markdown", metadata: {},
        source: lines(`## Try it\n\n${lesson.tryIt}\n\n<details><summary>Hint</summary>\n\n${lesson.hint}\n\n</details>\n\n<details><summary>Explanation</summary>\n\n${lesson.answer}\n\n</details>\n`),
      },
    ],
  };
}

await Promise.all(lessons.map(async lesson => {
  const source = await readFile(`examples/${lesson.id}.py`, "utf8");
  await Promise.all([
    writeFile(`${output}/downloads/${lesson.id}.py`, source),
    writeFile(`${output}/downloads/${lesson.id}.ipynb`, JSON.stringify(notebook(lesson, source), null, 2)),
  ]);
}));
const outline = modules.map(module => `<section><h2>${module.title}</h2><ul>${
  module.lessons.map(lesson => `<li><a href="?lesson=${lesson.id}">${lesson.title}</a> · <a href="./downloads/${lesson.id}.py">Python</a> · <a href="./downloads/${lesson.id}.ipynb">Notebook</a></li>`).join("")
}</ul></section>`).join("");
const page = await readFile("web/index.html", "utf8");
await writeFile(`${output}/index.html`, page.replace("<!-- COURSE_OUTLINE -->", outline));
await writeFile(`${output}/runtime-config.js`, `export const packages = ${JSON.stringify(packages)};\nexport const customWheels = ${JSON.stringify(customWheels)};\n`);
console.log(`Built ${lessons.length} lessons, Python scripts, and notebooks in ${output}/`);
