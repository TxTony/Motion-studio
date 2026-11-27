# Design reference — Motion Studio

## Authority and scope

The migration reference is the runnable POC frozen at `reference/poc-v0.1` (`63d03ec`). This document describes its layout and states from a static reading of `src/StudioUI.ts`, `src/style.css`, and `src/main.ts`. UI labels below describe the current English interface. The archived tag retains the original artifact. Browser comparison and mobile acceptance are tracked in MS-007.

The initial image illustrates a dark creative tool with two viewers and a timeline. Its detailed character, illustrated clips, and GLB animation export illustrate possible features. The runnable POC defines the migration scope, which includes a low-poly procedural character, an in-memory library, and JSON export.

## Layout

In reading order, the studio presents the brand and navigation, workshop heading, workspace, timeline, library and export tools, session status, and footer.

| Area              | Content and purpose                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Top bar           | Motion Studio branding, links to Capture, Library, and Character, and a POC v0.1 indicator on large screens                   |
| Human capture     | Video and skeleton in one frame, source badge, legend and FPS, front/rear selector, camera activation, and Demo               |
| 3D scene          | Default character, grid and shadow, overlaid name and rig, live/playback status, camera reset, and orbit/zoom help            |
| Inspector         | Three panels for character and GLB import, clip name/rate/root and recording controls, and smoothing and movement recentering |
| Timeline          | Clip name, rewind/play/pause/loop/speed controls, current time and duration, Root/Spine/Arms/Legs tracks, and a pink playhead |
| Library           | Selectable cards with name, duration, and pose count, a New capture card, and horizontal scrolling within the panel           |
| Export and import | Local storage guidance, JSON clip export, and JSON import                                                                     |
| Status            | A single `role="status"` region with `aria-live="polite"` for information and errors                                          |

The live demo starts animated, with the six-second **Workshop · Demo** clip available and selected in the library. The **DEMONSTRATION** badge and synthetic source text identify the source while the camera is inactive.

## Visual design

| Element                       | Reference values                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Background, panel, and border | `#101216`, `#1a1d24`, and `#30333e`                                                                               |
| Primary and secondary text    | `#e5e7ed` and `#9c9fac`, with viewer-specific contrast                                                            |
| Primary accent                | Purple `#9b7aff` and a `#9271e7 → #7453c3` gradient for the primary action                                        |
| Source and skeleton           | Pale green `#c0d887` and `#b6d889` skeleton lines                                                                 |
| Recording and playhead        | Pink-red `#ff687d` and `#f37e94`                                                                                  |
| Tracks                        | Blue `#7199ce`, green `#6ebfac`, ochre `#d0b270`, and purple `#b18cdc`                                            |
| Shapes                        | 10 px panel radius, 7 px control radius, thin borders, subtle shadow, and 14 px main gutters                      |
| Typography                    | DM Sans for the interface and Barlow Condensed for the brand, heading, and scene name, with system font fallbacks |
| Type scale                    | 36 px main heading (29 px on mobile), 14 px panel headings, 12–13 px controls, and smaller inherited metadata     |

Preserve primary, subtle, icon, recording, selected, and disabled treatments. Keyboard focus uses a light purple outline. Disabled controls remain visible at 0.35 opacity. `prefers-reduced-motion` disables recording pulses and transitions. The values document the inherited type sizes. Accessibility certification requires a separate assessment.

## Vue components and placement

The following components belong to the Vue reconstruction. The original POC uses its own interface implementation.

| Location                                    | Responsibility                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `components/core/StudioButton.vue`          | Shared button with variants, disabled state, type, and content for all studio actions                   |
| `components/core/StudioPanel.vue`           | Container, heading, and action slots, with feature state owned by its consumers                         |
| `components/forms/StudioTextField.vue`      | Label and text value, including the capture name                                                        |
| `components/forms/StudioRangeField.vue`     | Label, value, unit, and slider, including smoothing and playback position                               |
| `components/forms/StudioCheckbox.vue`       | Boolean option and label, including 2D movement                                                         |
| `components/forms/StudioFileInput.vue`      | File picker action and input, accessibility, and disabled state, with import rules owned by the feature |
| `components/selectors/StudioSelect.vue`     | Accessible label and typed options for camera, capture rate, and speed                                  |
| `components/domain/MotionCaptureViewer.vue` | Video, canvas, and capture guides, including alignment and mirroring                                    |
| `components/domain/Scene3DViewer.vue`       | Three.js surface, overlays, orbit, and camera reset. Owns renderer mounting and disposal.               |
| `components/domain/`                        | Panels for recording, character, retargeting, timeline, library, and file exchange                      |
| `views/StudioView.vue`                      | Composes the areas in order and delegates capture and clip rules                                        |

The `core`, `forms`, and `selectors` components wrap native controls for reuse by views and studio panels. The timeline retains its own track rendering. Its accessible playhead reuses the range field wrapper with a timeline-specific presentation.

## Observable states

| State          | Visual cues and controls                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Demo           | Explicit badge, animated synthetic skeleton and default character, and Record available                                                     |
| Camera loading | Loading message. Camera activation and Record are disabled, while Demo remains available to cancel.                                         |
| Camera active  | Active camera badge, aligned video and skeleton, and mirrored front camera. The viewer searches for a pose, then shows joint count and FPS. |
| Tracking lost  | A message says the last pose is held, the skeleton clears, and Record stays disabled until a usable pose returns                            |
| Recording      | Animated pink dot, recording label, elapsed time, and Stop. Playback, seeking, export, source changes, and conflicting fields are disabled. |
| Clip loaded    | Selected card, named timeline, and clip playback indicator. Play, Pause, seeking, speed, and loop control the selected clip.                |
| Loop enabled   | Selected control with `aria-pressed="true"`. The playhead wraps within the clip.                                                            |
| Error          | Explicit pink message in the status region. Camera errors remain visible and distinct from the synthetic source.                            |

Keep accessible labels on the icon controls for rewind, Play, Pause, loop, and reset, as well as the playhead. Associate fields with their labels and keep imports keyboard operable. Key editing, timeline zoom, and GLTF export are outside the POC scope.

## Responsive layout

- Above 1100 px, the capture viewer sits on the left, the wider 3D scene in the center, and the vertical inspector on the right. The full-width timeline sits above the side-by-side library and export panels.
- At 1500 px and above, the workspace columns use `1fr / 1.6fr / 0.72fr`, with a scene of at least 650 px and 40 px side margins.
- At 1100 px and below, the viewers remain side by side and the inspector becomes a row of three panels below them. The top version indicator is hidden.
- At 720 px and below, capture, scene, inspector, timeline, and lower panels stack. Navigation uses icons. The local-processing badge and brand subtitle are hidden. The camera source stays above a row of buttons with single-line labels.
- At 440 px and below, the inspector uses one column. The library scrolls horizontally within its panel and the page fits the viewport width.

The mobile capture viewport uses a 4:3 aspect ratio and a 240 px minimum. The scene has a 480 px minimum height. Video and skeleton share a coordinate frame and use `object-fit: contain`. Touch zoom and orbit apply to the 3D canvas.

## MS-007 comparison procedure

Compare the archived reference and the reconstruction side by side using the same viewport dimensions and synthetic source. Record differences before fixing them, then repeat the checks.

1. At 1280 × 900, check order, proportions, columns, spacing, text, colors, character, tracks, and initial selection. At 1024 × 768, verify that the inspector moves below the viewers.
2. At 390 × 844, check stacked panels, page width, legible camera controls, single-column inspector, playback controls, and scrolling within the library.
3. Record from Demo, stop, select the clip, play and pause, seek to a known time, and change speed and loop. Verify the controls, name, time, and pose together.
4. Export and reimport the JSON. Compare the name, duration, pose count, and selected clip. Test an invalid file and verify that conflicting actions are disabled during recording.
5. Start camera access and cancel it with Demo. Verify that the busy state clears. Testing the real camera, mirrored human motion, orientation, and multitouch requires hardware.
6. Navigate the controls with the keyboard and check labels and focus. Verify that reduced motion disables the recording pulse.

Animation timing can differ between runs without a shared clock. Compare silhouette, framing, and behavior, then pause at the same clip time to compare poses. The [POC acceptance report](../docs/POC-ACCEPTANCE.md) records the historical test run.
