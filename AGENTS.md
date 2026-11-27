# Motion Studio — contribution rules

## Read first and stay within scope

Read `documentation/INDEX.md`, the owning issue in `documentation/issues/`, then only the relevant contracts and files. A functional unit describes a verifiable outcome, not a file. Developers must consult the coordinator when information is missing or contradictory; the coordinator checks the sources and asks the PO when needed. Never invent behavior, contracts or product decisions.

The immutable reference is tag `reference/poc-v0.1`, commit `63d03ec348618f39890652803398a463b3de578d`. Never change or move that tag, its comparison worktree or the reference image. Work on `refactor/vue3-studio`; do not replace the reference Pages deployment without a PO decision.

## Language and product identity

All maintained source code, identifiers, responsibility headers, intent comments, tests, UI copy and documentation must be in English. Keep product and engine terminology independent of the current sample character. Treat the procedural model as an interchangeable default character. Its geometry is an asset detail, not a domain concept. Mascot design is a separate, deferred task. Imported user content and immutable historical artifacts retain their original data.

## Required architecture

- Vue 3, Composition API, `<script setup lang="ts">`, Vite and strict TypeScript.
- `src/domain/`: data, rules and ports; no Vue, Three.js, MediaPipe or DOM imports.
- `src/infrastructure/`: browser, camera, MediaPipe, Three.js and file adapters. Implement the ports and release streams, listeners, observers and GPU resources.
- `src/application/`: testable sessions and use cases with injected dependencies. Keep large data and engine objects outside deep reactivity.
- `src/composables/`: Vue connections and lifecycle; no mixins or implicit session singleton.
- `src/views/`: page composition, without business rules or direct engine initialization.
- `src/components/core/`: reusable primitives such as buttons, panels and badges.
- `src/components/forms/`: form fields and controls, always here, never copied into a view.
- `src/components/selectors/`: value/option selectors, always here.
- `src/components/domain/`: studio-specific viewers and controls, including Scene3DViewer, capture and timeline.
- Views and business components use StudioButton and the form/selector wrappers. Explain any primitive exception in its issue.
- Put tests, doubles and fixtures under `tests/`; product sources must not import them. Do not create empty directories to simulate architecture.

## Contracts and quality

Start every source file with a short responsibility description. Explain the intent of every named/public function and method; include units, limits and side effects where useful. Trivial callbacks inherit the surrounding function's explanation. Use explicit business names: PascalCase components/types, `useX` composables and camelCase variables/functions.

Limit TypeScript/Vue files to 500 lines and functions to four parameters. ESLint enforces these limits and Vue/TypeScript conventions; architecture checks enforce file placement, boundaries and responsibility headers. An options object must not hide excessive responsibilities. Do not disable rules to bypass constraints without the coordinator's documented justification. Reuse based on actual needs; do not add a global store or router without a real consumer.

## Delivery cycle

1. The coordinator scopes the issue: outcome, invariants, contracts, assigned files and acceptance checks.
2. For new behavior: meaningful failing test → minimal implementation → green tests → refactor. Record RED/GREEN evidence. For migration: preserve or characterize existing behavior before moving it.
3. Run `npm run check`: architecture, ESLint, formatting, types, tests and build. Distinguish static reading, automated checks and human observations.
4. Test the functional unit in the browser against documentation/DESIGN.md and the reference. Correct discrepancies and repeat the relevant checks. Desktop emulation does not validate a real phone.
5. Update the issue with work, decisions, exact evidence, defects, limitations and next steps. Keep the global index limited to status, links and active constraints.
6. The coordinator reviews and integrates. Use In review when PO/human acceptance remains pending; use Done only when the criteria and required verdict are satisfied. Include issue IDs in commits. Never claim an unexecuted test passed.

## Sub-agents

Role mandates live in `.agents/roles/`. The coordinator explicitly passes the role file, issue and scope at launch; Markdown mandates are instructions, not automatic runtime configuration.

- Coordinator: `.agents/roles/coordinator.md`.
- Developer: `.agents/roles/developer.md`.
- Designer: `.agents/roles/designer.md`.
- Optional document summarizer: `.agents/roles/summarizer.md`.

Parallelize independent work only, without concurrent writes to the same file. Developers must not delegate or commit without a mandate. Reuse existing agents. The coordinator owns integration and index updates. Keep documentation concise and factual, without promotional explanations for technology choices.
