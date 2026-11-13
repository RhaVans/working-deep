# Working Deep

An interactive laboratory for eight principles of sustained deep work. The
manual's rules, numbers and templates are the source material; the interface
teaches them by letting you manipulate the mechanism, not by explaining it.

Live: <https://working-deep.vercel.app/>

## The four experiences

| Hash | What it is |
| --- | --- |
| `#explore` | A navigable system map: eight rule nodes, labelled edges, node detail, jump into an experiment. |
| `#sim/01` … `#sim/08` | One experiment per rule. Each is a model with state, consequences and a visible end condition. |
| `#bench/a` `b` `c` | The three templates as tools: daily timeline, project kickoff board with trust boundaries and STRIDE threats, research workspace. |
| `#progress` | What has been seen, tried and finished, plus export/import/print/erase in Data. |

## The eight experiments

1. **Size** — drill a project block down to a next action; a three-check forge scores whether a written action is concrete.
2. **Continuity** — two focus curves over the same 45 minutes; filling the four breadcrumb lines lifts the second one.
3. **Modes** — a twelve-slot workday you can reshape; the mixed preset produces the manual's 11 switches, the grouped one 2.
4. **Slices** — 4 layers x 5 features played back in two orders; the first end-to-end feature arrives at step 16 or step 4, and a security row shows which order leaves features live without a check.
5. **Belief** — sources with decreasing impact move a confidence reading; the stop rule closes when the reading crosses it.
6. **Flow** — a draggable point on challenge x skill, with the adaptation that follows from the state.
7. **Attention** — 1 to 5 active projects and the n(n-1)/2 edges between them, plus the 5/80/5/20 block rail and a parking lot.
8. **Diagnosis** — input drought versus fatigue, and the four-rung ladder that answers each.

## Run it

```bash
npm start          # http://localhost:3000
npm run check      # node --check on every module
```

No build step, no dependencies, no backend. Plain ES modules, custom SVG, CSS
transitions. `server.mjs` is a static file server; on Vercel the project serves
the repository root directly (framework preset "Other", build command empty).

Stylesheets are split by surface: `main.css` (shell, forms, map, sheet),
`lab.css` (experiments 01-04), `tools.css` (workbench, progress, motion, print),
`fixes.css` (the later screens) and `layout.css` (mobile composition).

## Data

Everything lives in `localStorage` under `working-deep:v1` — the same key the
previous text version used, so old entries (belief log, parking lot, template
fields, threat slices) are read and kept. `Data -> Export` writes one JSON file;
`Import` accepts it, or an older `working-deep-notes.json`.

## Honesty about the models

- **From the manual** — wording, counts and distinctions: 11 vs 2 switches, 16 vs 4, 0/1/3/6/10 pairs, 5 + 80 + 5 + 20, the four-rung ladder and its times.
- **Simulation** — the decreasing source-impact bars, the two focus curves, the flow bands and the re-entry cost per switch. These are models that encode a claim; they are not measurements.
- **Interpretation** — the edges on the system map, the flow thresholds, the security-placement rule in experiment 04.

## Accessibility and performance

Hash routing, labels on every control, `aria-pressed` on toggles, a dialog-style
sheet with Escape and scrim dismissal, and a `prefers-reduced-motion` path that
removes every transition. Mobile is the primary target: 360/390/430 px, no
horizontal overflow, no hover-only interaction. On phones the visualization
comes first and the experiment rail sits below it. Animation is limited to state
changes on short-lived elements; nothing runs continuously except explicit
playback.
