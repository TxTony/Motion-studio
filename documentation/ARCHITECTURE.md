# Architecture and migration contracts

The studio uses the Vue 3 Composition API, Vite, and strict TypeScript. A single Studio view owns session state locally. Adding a router or global store would require a separate use case. The viewers own DOM refs. Session data is testable without rendering or a camera.

## Dependencies

`views → components/domain + composables → application → domain`

Adapters in `infrastructure/` implement ports from `application/` or `domain/`. The composition root injects them. The domain runs independently of Vue, Three.js, MediaPipe, and the DOM. The session runs independently of the components. Three.js objects, streams, and canvases stay outside deep Vue reactivity.

## Data

`domain/studio.ts` defines eleven joints, XYZW quaternion tuples, XYZ translation, `PoseSample`, and JSON v1. Inference timestamps use milliseconds. Clips and playback use seconds. `AnimationRecorder` samples at 15 or 30 Hz for up to 300 s and copies poses. `AnimationPlayer` takes an injected `PoseInterpolator` and owns time lookup and looping. The Three.js adapter preserves the original lerp and slerp. The serializer validates unknown data before returning the domain type. The migration preserves the format and existing math library.

## Engine and session boundaries

Capture exposes `start(facing)`, `sample(nowMs)`, `stop()`, and `dispose()`. It requests video only, preferring portrait 720 × 960 at 24 FPS. MS-009 adopts the classic coach Lite profile: GPU initialization with CPU fallback, 0.55 detection/presence thresholds, and at least 90 ms between new-frame inferences. The overlay draws in native image pixels; video and canvas share centered CSS contain fitting and front-camera mirroring. `undefined` means no new frame, `null` means no body was detected, and a pose value means a new sample is available.

Rendering exposes `apply(pose)`, `render()`, `resetView()`, `loadGLB(bytes)`, and `dispose()`. Only the retargeting adapter accesses the renderer's rig. Retargeting exposes `solve(sample, rig, dtSeconds)` and `reset()`, and uses the reference constants for smoothing and root translation. The procedural character is one implementation of the rig contract.

MS-010 adds shoulder yaw projected into the pelvis-local horizontal plane. The pure numeric response in `domain/torso-follow.ts` supplies a symmetric dead zone, gain and limit; `SkeletonMapping` owns the 3D projection and confidence checks. `Retargeting` owns the held yaw and reset, composes the extra spine/head world rotation, then uses the existing parent-to-local conversion and smoothing. Full landmark detection and clip contracts are unchanged. External-rig semantic binding is proposed in [MS-011](issues/MS-011.md), not yet implemented.

The session receives ports for the source, character, pose resolution, clock, and files. It owns the library, selection, live and playback modes, recorder, player, and control availability. Tests exercise its commands independently of the components. The viewers mount and dispose of their adapters. The composable cancels the session loop and removes listeners on unmount.

## UI composition

The shared primitives are `core/StudioButton`, `core/StudioPanel`, `forms/StudioTextField`, `forms/StudioRangeField`, `forms/StudioCheckbox`, `forms/StudioFileInput`, and `selectors/StudioSelect`. Studio-specific components reuse these primitives and emit typed actions. `views/StudioView.vue` composes the panels. Vue bindings handle markup and state, with DOM access scoped to each component.

## Checks

The Vue and TypeScript ESLint flat configuration enforces a maximum of four parameters and 500 lines. Repository checks cover consistent naming, responsibility headers, dependency boundaries, and file placement. Vitest preserves the characterization tests and covers new commands with a controlled clock and fake ports. Component tests use Vue Test Utils. Browser acceptance covers desktop and a mobile-sized viewport. Physical phone testing is a separate step.

See the [Vue Composition API and TypeScript guide](https://vuejs.org/guide/typescript/composition-api), [Vue testing guide](https://vuejs.org/guide/scaling-up/testing.html), [ESLint Vue guide](https://eslint.vuejs.org/user-guide/), and [repository contribution guidelines](../AGENTS.md).
