# Electrical Circuits Interactives

Seven standalone browser tools for learning about circuits, plus an index page. Each tool is one self-contained HTML file. The files need no server, no accounts and no internet connection.

## Put them on your site

Upload everything in `dist/` into one folder on your site:

| File | Tool | Type | Student time |
| --- | --- | --- | --- |
| `index.html` | Landing page that links all seven tools | Page | — |
| `series-parallel-sorter.html` | Series vs. Parallel Sorter | Interactive | 3–5 min |
| `remove-a-bulb.html` | Remove a Bulb: Series vs. Parallel | Animation + interactive | about 1 min per circuit |
| `breadboard-schematic-mapper.html` | Breadboard-to-Schematic Mapper | Interactive | 2–3 min |
| `multimeter-placement-lab.html` | Multimeter Placement Lab | Interactive | 3–5 min |
| `ohms-law-explorer.html` | Ohm's Law Explorer | Interactive | about 5 min |
| `current-at-a-junction.html` | Current at a Junction | Animation | about 40 s |
| `walk-the-voltage-loop.html` | Walk the Voltage Loop | Animation + interactive | 2–3 min |

Each tool also works on its own, for example as a single linked file. The only thing that breaks is the small "Electrical Circuits Interactives" link back to `index.html`.

Every tool has an "About this tool" panel at the bottom with teacher notes: what it teaches, the numbers behind it, and a suggested tie-in to a breadboard build.

## Edit and rebuild

The source is in `src/`. Shared code lives in `src/shared/` (styles, circuit solver, schematic and breadboard drawing, current dots, UI pieces). Each tool's page lives in `src/tools/`. The build inlines the shared code into each tool:

```bash
node build.mjs
```

Checks (optional; the second one needs Playwright):

```bash
node tests/engine.test.mjs
```

```bash
node tests/qa.mjs
```
