# Third-party software

The lesson text, Python exercises, sample data generators, and lab interface are
original to this repository. Links to other courses are references. The build
stages unmodified upstream distributions of the following runtime software.

- Pyodide 314.0.2, Mozilla Public License 2.0. Source is available at
  https://github.com/pyodide/pyodide/tree/314.0.2. See licenses/pyodide.txt.
  Its distribution also includes CPython under the Python Software Foundation
  license (licenses/cpython.txt, https://docs.python.org/3.14/license.html) and
  Emscripten under MIT or NCSA (licenses/emscripten.txt,
  https://github.com/emscripten-core/emscripten/tree/5.0.3).
- PyTorch, BSD 3-Clause, see licenses/pytorch.txt and
  https://github.com/pytorch/pytorch/tree/cf30153c4c131c8164ee7798e5022d810682e2cb.
  The exact browser wheel is built by PyTorch for Pyodide, an independent project.
  Its builder and patches are MIT-licensed, see licenses/torch-build.txt and
  https://github.com/mmtftr/pyodide-pytorch/tree/c87b392618b0ae88be444fddd06b07f28a368018.
  Its complete release manifest is available in runtime/torch-build-manifest.json.
- Pyodide packages and their dependencies are recorded with versions and hashes
  in runtime/pyodide-lock.json. This lab distributes the subset staged by
  scripts/runtime-assets.mjs from the official Pyodide release. Package licenses
  and notices are retained inside the upstream archives. The build recipes,
  package source URLs, and license metadata are available from
  https://github.com/pyodide/pyodide-recipes.
- filelock 3.32.0, MIT. The distribution retains its notice. Source
  and metadata are available at https://pypi.org/project/filelock/3.32.0/.

The third-party licenses apply to their respective components.
