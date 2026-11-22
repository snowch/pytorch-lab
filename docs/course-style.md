# Shared style in PyTorch Lab

The [shared course design guide](https://github.com/snowch/cuda-python-lab/blob/main/docs/course-design-guide.md) is the standard for reading, navigation, typography, optional resources, completion and references. Link to that guide instead of maintaining a competing copy.

Learners need basic Python. Browser experiments run real PyTorch in a CPU-only, single-threaded WebAssembly build. Notebook exports provide the path to a separate native Python environment, CUDA and native profiling. Never imply that the browser uses the learner’s GPU or that browser timing predicts native performance.

The bare URL opens the course introduction and grouped outline. Existing `?lesson=<id>` links open the same lessons as before. The original matrix illustration sits beside the introduction above 900 px and below it at smaller widths; its caption explains the matching inner dimensions. The header offers Code runner, App status and theme. A combined course row supplies the outline control, saved completion count and breadcrumbs.

Lessons retain their concrete question, prepared starter, optional saved prediction, complete editable program, printed result or loss curve, follow-up experiment and explanation. Python errors and intentional assertions stay in Console. Runtime asset failures use a separate recovery dialog. References identify the actual PyTorch operations and ask a question that gives the documentation a purpose. References require internet access; essential lesson explanations stay visible or in the existing answer disclosure after the question.

Manual completion remains explicit and reversible, independent of successful execution. Previous/next cards name their destination. A first or final lesson links back to the overview. Restore starter has Undo; exports remain available. Existing local-storage prefix `pytorch-lab/v1/` and lesson IDs are unchanged.

Fonts are locally bundled IBM Plex Sans and Mono under the OFL. Functional icons use official Material Symbols Rounded under Apache 2.0. Inspect 320, 390, 900, 901 and 1440 px in both themes, keyboard navigation and curve labels. Passing functional tests does not establish learning effectiveness.
