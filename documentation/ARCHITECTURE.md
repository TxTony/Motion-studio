# Architecture and migration contracts

The studio uses the Vue 3 Composition API, Vite, and strict TypeScript. A single Studio view owns session state locally. Adding a router or global store would require a separate use case. The viewers own DOM refs. Session data is testable without rendering or a camera.

## Dependencies

`views → components/domain + composables → application → domain`

Adapters in `infrastructure/` implement ports from `application/` or `domain/`. The composition root injects them. The domain runs independently of Vue, Three.js, MediaPipe, and the DOM. The session runs independently of the components. Three.js objects, streams, and canvases stay outside deep Vue reactivity.

## Data

`domain/studio.ts` defines eleven joints, XYZW quaternion tuples, XYZ translation, `PoseSample`, and JSON v1. Inference timestamps use milliseconds. Clips and playback use seconds. `AnimationRecorder` samples at 15 or 30 Hz for up to 300 s and copies poses. `AnimationPlayer` takes an injected `PoseInterpolator` and owns time lookup and looping. The Three.js adapter preserves the original lerp and slerp. The serializer validates unknown data before returning the domain type. The migration preserves the format and existing math library.

## Engine and session boundaries

Capture exposes `start(facing)`, `sample(nowMs)`, `stop()`, and `dispose()`. It requests video only. `undefined` means no new frame, `null` means no body was detected, and a pose value means a new sample is available.

Rendering exposes `apply(pose)`, `render()`, `resetView()`, `loadGLB(bytes)`, and `dispose()`. Only the retargeting adapter accesses the renderer's rig. Retargeting exposes `solve(sample, rig, dtSeconds)` and `reset()`, and uses the reference constants for smoothing and root translation. The procedural character is one implementation of the rig contract.

The session receives ports for the source, character, pose resolution, clock, and files. It owns the library, selection, live and playback modes, recorder, player, and control availability. Tests exercise its commands independently of the components. The viewers mount and dispose of their adapters. The composable cancels the session loop and removes listeners on unmount.

## UI composition

The shared primitives are `core/StudioButton`, `core/StudioPanel`, `forms/StudioTextField`, `forms/StudioRangeField`, `forms/StudioCheckbox`, `forms/StudioFileInput`, and `selectors/StudioSelect`. Studio-specific components reuse these primitives and emit typed actions. `views/StudioView.vue` composes the panels. Vue bindings handle markup and state, with DOM access scoped to each component.

## Checks

The Vue and TypeScript ESLint flat configuration enforces a maximum of four parameters and 500 lines. Repository checks cover consistent naming, responsibility headers, dependency boundaries, and file placement. Vitest preserves the characterization tests and covers new commands with a controlled clock and fake ports. Component tests use Vue Test Utils. Browser acceptance covers desktop and a mobile-sized viewport. Physical phone testing is a separate step.

See the [Vue Composition API and TypeScript guide](https://vuejs.org/guide/typescript/composition-api), [Vue testing guide](https://vuejs.org/guide/scaling-up/testing.html), [ESLint Vue guide](https://eslint.vuejs.org/user-guide/), and [repository contribution guidelines](../AGENTS.md).
