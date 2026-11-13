# Working Deep

An interactive field manual for sustaining complex research and software work.
Eight rules, three templates, and a visual model for each idea.

Built from *Working deep, without burning out* (November 2026). No build step,
no dependencies, no backend, no network calls.

## Run it

```bash
npm start          # → http://localhost:3000
```

Node 18+ (uses `import.meta.dirname`, Node 20.11+). To use another port:

```bash
PORT=8080 npm start
```

Any static file server works, but the modules need `http://`, not `file://`.
`npm run check` runs a syntax check over every JavaScript file.

## Structure

```
index.html          shell, header, footer, the data tools
css/main.css        design tokens, layout, components, print styles
js/core.js          DOM helper, local store, motion, shared components
js/app.js           contents, scroll state, export/import, mounting
js/intro.js         the opening: project → next action, session map
js/rules-a.js       Rules 01–04
js/rules-b.js       Rules 05–08 (exports the belief log used by Template C)
js/templates.js     Templates A, B, C
sw.js               offline cache
server.mjs          the static server behind `npm start`
```

## What is interactive

| Section | Interaction |
| --- | --- |
| Opening | Decompose a project one level at a time; counts follow the manual's auth example |
| 01 | Expandable decomposition tree; a four-test validator for your own next action |
| 02 | Cold-start vs breadcrumb output shapes; a breadcrumb composer that saves |
| 03 | Build a day from twelve slots; switch count recomputes; 11 vs 2 presets |
| 04 | Twenty-item construction simulator, layer-by-layer vs slice-by-slice, step/play/scrub |
| 05 | Belief log (add, edit, delete) shared with Template C; source-impact chart with the stop rule; a rabbit-hole budget |
| 06 | Challenge and skill sliders with a flow model and advice |
| 07 | Block anatomy scrubber; 1–5 project switch network; parking lot shared with Template A |
| 08 | Four-stage diagnostic ladder with input-drought/fatigue recommendation |
| Templates | Daily rail with per-block mode and next action, spec and STRIDE threat model with clickable arrows and slice plan, question tree, time-box, stop rule, adversarial prompt |

Every chapter ends with one concept check that explains the answer.

## Your data

- Stored in this browser under the localStorage key `working-deep:v1`.
- **Export** writes `working-deep-notes.json`; **Import** restores one.
- **Erase my entries** in the footer clears everything.
- Nothing leaves the device. There is no account and no sync.

localStorage was chosen over IndexedDB deliberately: the app stores a few
kilobytes of text, and the synchronous API removes a whole async layer. If the
notes ever grow to something like a real document store, move it to IndexedDB.

## Offline

`sw.js` caches the app shell. It is **cache-first**, so bump `CACHE` in `sw.js`
whenever you ship a change, otherwise returning visitors keep the old files.

## Source fidelity

- `From the manual` — the source's wording, numbers and distinctions.
- `Simulation` — a model built to make a statement visible. Not measured data.
- `Interpretation` — added explanation (e.g. the flow-model bands, the five-line
  breadcrumb reading).

## Testing performed

Run in Chromium against the dev server after a clean cache:

- `node --check` on every module: passes.
- No console or page errors on load or after interaction.
- No horizontal overflow at 360, 390, 430, 768 and 1366 px.
- 10 sections, 16 figures, 8 quizzes, 3 templates render.
- Interactions verified: intro decompose, tree toggle, next-action validator
  (3/4 → passes all four), breadcrumb scenario toggle and saved composer,
  day builder (11 mixed, 2 separated), slice simulator (first path at 16
  layer-by-layer and 4 slice-by-slice), belief add/edit, source-impact stop
  rule, flow states (anxiety/flow/boredom), block stage readout, five-project
  network (10 pairs), diagnostic recommendation, Template B arrow inspection,
  Template C sub-question status, quiz feedback, contents navigation, export.
- Persistence after reload: Template A fields and block mode, parking lot
  (shared with Rule 07), Template B spec and an added slice, breadcrumb,
  belief log in both Rule 05 and Template C.

Not verified: print output, Firefox and Safari, screen readers, and real
low-end Android hardware. Pointer interaction on the very long template section
was verified by dispatching events rather than synthetic clicks, because the
automation scroll helper deadlocked on the reveal transitions.

## Known limitations

- JavaScript is required: the page renders entirely on the client.
- The offline worker caches aggressively; bump `CACHE` on release.
- Print styles exist for the templates but were not visually checked.
- Rule 06's bands and the Rule 02 minute values are illustrative, and labelled
  as such in the interface.
