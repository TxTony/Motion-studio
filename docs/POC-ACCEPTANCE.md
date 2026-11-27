# POC v0.1 acceptance report

The original Motion Studio v0.1 brief was approved and tested on 27 November 2026. The initial repository was empty. Development took place separately from ARPG Lab. This English report describes the historical test run with the current neutral character terminology. The archived reference retains the original artifact.

## Checks completed

- Windows, Node 22.21.0, npm 10.9.4.
- Strict TypeScript and Vite build passed.
- Vitest covered animation data, recorder sampling rate and pose copies, quaternion and translation interpolation, playback before the first pose, loop, speed, pause, completion, JSON validation, coordinate frames, occlusion, retargeting smoothing, and recentering.
- npm audit reported zero vulnerabilities after the dependency update.
- The local `/Motion-studio/` page, `.task` model, and SIMD WASM returned HTTP 200.
- The integrated Chromium browser displayed the animated procedural character, synthetic skeleton overlay, and lit scene with a ground shadow.
- The synthetic recording `Recette_Demo` lasted 4.08 s and contained 123 poses. The clip appeared in the library after recording stopped.
- Playback and pause, seeking to 2.00 s, disabling loop, and setting 2× speed showed the expected control states and time.
- Exporting and reimporting `Recette_Demo.json` produced a newly selected library clip with the same duration and pose count.
- A 390 × 844 desktop viewport displayed the stacked panels and timeline.
- MediaPipe initialized the WASM and model as indicated by the library's OpenGL message. Camera access stayed pending in the integrated browser, so human pose detection and camera performance remained unverified.

## Remaining hands-on checks

- On Android Chrome and iOS Safari over HTTPS, verify camera permission grant and denial, front and rear cameras, mirrored video and skeleton alignment, frontal arm and leg gestures, side profiles, and occlusion.
- Measure effective capture rate, device heat, perceived latency, and rendering cost on at least one low-end phone. Treat 30 FPS as an upper target.
- Verify real multitouch for orbit and pinch and switch between portrait and landscape.
- Import a production GLB that meets the contract. Verify axes, skinning, proportions, and JSON playback with the same file.
- Compare human motion with the procedural character for twisting, foot pose, head motion, and depth accuracy. These checks require hands-on evaluation.

## Accepted POC limits

The POC covers capture and clip playback without a backend, accounts, automatic persistence, editing, finger or face capture, IK, ground contact correction, metric movement through a room, or GLTF animation export. Synthetic demo poses are labeled separately in the UI. The [README](../README.md) details the limits and data format.

## Reproduction and rollback

Run `npm ci && npm run check` to repeat the automated checks. Open the studio, record five seconds from the demo, stop, play the clip, move the playhead, then export and reimport it. Camera acceptance requires hardware and permission.

The first commit contains the historical implementation. For a future rollback, restore that commit or redeploy its workflow. The repository history can stay intact.
