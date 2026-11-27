# Motion Studio — POC v0.1

Motion Studio runs in the browser. Camera frames pass through MediaPipe Pose, then retargeting drives the 3D character. The resulting poses can be saved as reusable JSON clips. The interface uses the Vue 3 Composition API, strict TypeScript, and Vite.

The [published POC](https://txtony.github.io/Motion-studio/) remains available as the reference while the Vue reconstruction on `refactor/vue3-studio` goes through acceptance testing. The tag `reference/poc-v0.1` preserves the original artifact at commit `63d03ec`. See the [project tracker](documentation/INDEX.md).

## Getting started

Use Node.js 22 (minimum 22.12) and npm 10 or later.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite with the path `/Motion-studio/`. The install step copies the MediaPipe WASM files to `public/mediapipe/`. The Lite model version 1 is checked in under `public/models/`, so inference can use files served with the application. The initial load downloads about 18 MB of model and WASM files. The browser can cache those files normally. The POC has no service worker or guaranteed offline mode.

```sh
npm run test  # Vitest
npm run build # Strict TypeScript and Vite
npm run check # Architecture, ESLint, formatting, tests, Vue/TS types, and build
npm run preview
```

The `.npmrc` keeps `legacy-peer-deps=true` to avoid an npm 10 Arborist crash while resolving optional Vitest dependencies. The lockfile pins the installed versions. The project declares `vue-eslint-parser` explicitly. The `@vue/test-utils → js-beautify@1.14.8` override pins a compatible test formatter outside the affected ranges reported by npm audit. The formatter stays outside the product bundle. Some of its transitive dependencies remain deprecated. Reassess this pin with the next Vue Test Utils upgrade and test any proposed change.

## Using the studio

1. The studio starts with a clearly labeled synthetic source and the six-second **Workshop · Demo** clip. Three.js animates the default character.
2. Choose the front or rear camera, then click **Enable camera**. Grant video access and frame the whole person, ideally from 2–3 m away in a well-lit room. **Demo** also cancels a pending camera request.
3. Set smoothing with a time constant between 0 and 400 ms. Experimental 2D movement starts off. **Recenter movement** sets a new origin.
4. Name the clip, select a maximum rate of 15 or 30 poses per second, then click **Record** and **Stop**. The effective rate depends on the device. Capture stops at five minutes. The recorder stores the frames it receives.
5. Use **Play**, **Pause**, rewind, the playhead, the 0.5×/1×/2× speed selector, or the loop control. Click **New capture** or **Demo** to return to live mode.
6. **Export clip** downloads a JSON file. **Import** loads it back into the studio. The library lives in memory, so export clips before reloading or closing the page. Recordings from the synthetic source contain demonstration poses.

Camera access requires HTTPS or localhost, WebAssembly, WebGL, and `getUserMedia`. A phone opening an HTTP address on the local network generally needs an HTTPS deployment such as GitHub Pages for camera access. Browser and system permissions also apply. Switching to the background or closing the page stops the stream. Restart it manually.

## Features and POC limits

| Area        | Implemented                                                                                                   | POC limits                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Capture     | 33 MediaPipe landmarks, skeleton overlay, front and rear video                                                | One person. Fingers and facial expressions are outside scope.                                                                                  |
| Coordinates | Normalized image coordinates for drawing and estimated 3D positions for rotations                             | Estimated relative depth. Metric movement through the room is outside scope.                                                                   |
| Character   | Original low-poly procedural character with 11 hierarchical joints, accessories, shadows, and an orbit camera | The default character uses rigid geometry without skinning.                                                                                    |
| Retargeting | Local quaternion rotations, parent compensation, and frame-rate-independent exponential smoothing             | The head follows the torso. IK, foot locking, joint constraints, and limb twist estimation are outside scope.                                  |
| Occlusion   | Holds occluded limbs in place and skips recording when the pelvis is unusable                                 | Playback interpolates timing gaps. The studio displays a tracking loss message.                                                                |
| Movement    | Relative X/Y movement from the center of the hips in the image                                                | Heuristic scaling of 3 units per normalized image width or height. Framing and camera distance affect the result. Z movement is outside scope. |
| Timeline    | Interpolated playback, seeking, pause, speed, and loop                                                        | Grouped tracks show sampled markers. Keyframe editing and clip assembly are outside scope.                                                     |
| JSON        | Version 1 with timestamp, quaternion, and file size validation                                                | Playback requires the matching rig.                                                                                                            |
| GLB         | Imports a self-contained character that meets the contract below                                              | Mixamo/VRM auto-mapping, Draco/KTX2, and external resources are outside scope.                                                                 |
| GLTF export | Defines the `AnimationExportAdapter` contract                                                                 | GLTF/GLB animation export is outside the v0.1 implementation.                                                                                  |
| Mobile      | Responsive layout, touch controls, and OrbitControls                                                          | Frame rate, heat, latency, and usability still need evaluation on real phones.                                                                 |

Capture uses the classic coach profile: Pose Landmarker Lite v1, GPU initialization with CPU fallback, and at least 90 ms between inferences (about 11 samples/s maximum). The 15/30 FPS recording settings remain upper limits, not a guaranteed camera sample rate. Inference is synchronous on the main thread and can slow down low-end devices. The camera requests portrait 720 × 960 at 24 FPS as preferences; actual dimensions depend on the device. Video and overlay share native image coordinates and the same centered contain fit. A partial body may produce unreliable depth or hidden limbs; framing cannot replace visible joints. The renderer caps device pixel ratio at 2. Moving inference to a worker is a possible follow-up after measurement. Three.js produces a chunk of about 552 kB minified (140 kB gzip), which triggers a known Vite warning.

## Interchangeable character

Capture produces only `PoseSample`. `SkeletonMapping` and `Retargeting` work with the `CharacterRig` contract, so changes to the rendered geometry stay independent of `MotionCapture`.

Import accepts a self-contained GLB under 30 MB and rejects external resources. Export characters in meters with Y up, facing +Z, and roughly 1–3 m tall. Apply scene transforms, use uniform scale, and give the following joints their exact, unique names.

```text
hips
  spine
    head
    leftUpperArm → leftLowerArm → hand tip
    rightUpperArm → rightLowerArm → hand tip
  leftUpperLeg → leftLowerLeg → foot tip
  rightUpperLeg → rightLowerLeg → foot tip
```

Every joint must descend from `hips`. The arm and leg branches must follow this hierarchy for local rotations to work. The first Bone child, or the first offset child, determines the limb axis. Add a terminal bone at each forearm and lower leg. Without one, the POC assumes -Y for the terminal limb. The hip, torso, and head axes must use the canonical Y-up, Z-forward frame. The model owns its offsets, meshes, and skinning. Rigs with arbitrary hierarchies, twist bones, constraints, or scales require manual preparation.

The identifier for a GLB clip includes the file's SHA-256. To play a clip after reopening the studio, import the same GLB and then the JSON. The library retains clips for other rigs and plays them once the matching rig is active. **Recenter 3D camera** restores the default framing. Imported models must meet the size and orientation requirements above. Current default character clips use `default-character-v1`. JSON import recognizes older clips for this default rig and maps them to the current ID.

## Architecture

`StudioView` composes the Vue panels. The `components/core`, `forms`, `selectors`, and `domain` directories hold primitives, form fields, selectors, and studio-specific components. Form fields and buttons use shared wrappers. `useStudioSession` connects the viewers to a `StudioSession` instance. Each session owns its state and keeps engine objects outside deep Vue reactivity.

`domain/` contains the contracts, recorder, player with an injected interpolator, and JSON validation. It runs independently of Vue, Three.js, MediaPipe, and the DOM. `application/` owns transitions and commands with an injected clock and ports. `infrastructure/` contains the camera, math, Three.js, file, and canvas adapters. The 3D viewer disposes of the renderer, the session closes capture, and the composable removes listeners and cancels the loop at unmount.

Project checks enforce intent comments, directory placement, dependency boundaries, at most four parameters per function, and at most 500 lines per TS/Vue file. See [contribution guidelines](AGENTS.md), [architecture contracts](documentation/ARCHITECTURE.md), and [design reference](documentation/DESIGN.md) for agent roles and the TDD workflow.

| Module                               | Responsibility                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `MotionCapture`                      | Permissions, video stream, MediaPipe initialization and inference, resource cleanup  |
| `SkeletonMapping`                    | Coordinate frames, connections, visibility, pelvis orientation, and synthetic source |
| `Retargeting`                        | Direction-to-local-quaternion conversion, smoothing, and experimental translation    |
| `CharacterRenderer`                  | Procedural rig and GLB import, Three.js scene, OrbitControls, rendering, and cleanup |
| `AnimationRecorder`                  | Sampling and copying poses with timestamps in seconds                                |
| `AnimationPlayer`                    | Playback timing, binary search, and translation/slerp interpolation                  |
| `AnimationSerializer`                | Versioned, validated JSON and an extensible export contract                          |
| `StudioUI`                           | Interface structure and time formatting in the reference POC                         |
| `StudioSession` / `useStudioSession` | Tested commands, live and playback modes, library, and Vue integration               |

The JSON contains `format`, `version`, `name`, `rig`, `fps`, `duration`, and `frames[{time,pose:{root,rotations}}]`. `root` is a local XYZ offset in rig units. `rotations` holds the eleven local quaternions `[x,y,z,w]`. Timestamps increase from the start of capture. The final timestamp sets `duration`. If the first frame arrives after t=0, playback holds that first pose until its timestamp. A future GLTF exporter would convert the samples into `VectorKeyframeTrack` and `QuaternionKeyframeTrack` instances and build a Three.js `AnimationClip` bound to the rig before calling `GLTFExporter`. The current interface reserves that export boundary.

## Privacy and resources

The application sends neither video nor poses. When prompted, the recorder stores only pose data in memory. Camera access requests video only. JSON and GLB files are read locally. The site loads its application files from its host and requests Barlow Condensed and DM Sans from Google Fonts. Those font requests carry no camera images. System fonts provide the fallback.

The official model is [Pose Landmarker Lite, float16, version 1](https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task), SHA-256 `59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a`. See the [MediaPipe documentation](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) and `LICENSE` and `NOTICE` in the [official repository](https://github.com/google-ai-edge/mediapipe). Three.js uses the MIT license and MediaPipe uses Apache-2.0. Retain dependency notices. The procedural character was created in this repository without third-party art assets.

## GitHub Pages

The `.github/workflows/pages.yml` workflow runs `npm ci` and `npm run check` for architecture, ESLint, formatting, types, tests, and build. It checks pull requests and `refactor/vue3-studio` without publishing. Pushes to `main` and manual runs build and deploy `dist/` through the `github-pages` environment. Vite uses the base path `/Motion-studio/` for the app, model, and WASM.

In **Settings → Pages → Build and deployment**, choose **GitHub Actions**. The workflow needs `contents: read` for build and `pages: write` and `id-token: write` for deployment. It uses no application secrets. If Pages is disabled, a repository administrator must enable it. Pushing and configuring Pages require permissions beyond read access, including when the GitHub integration returns 403.

See the [Vue migration report](documentation/issues/MS-007.md) and [historical POC acceptance report](docs/POC-ACCEPTANCE.md) for automated checks, browser observations, and remaining mobile checks.
