# Motion Studio — project overview

## Active decisions

Vue 3/Vite reconstruction authorized on 27 November 2026. Use TDD, reusable components, mandatory folder placement and explicit role mandates. Keep the POC's documented camera/mobile/GLTF limitations. Tag `reference/poc-v0.1` points to `63d03ec`; `main` and Pages remain the published reference while reconstruction is reviewed on `refactor/vue3-studio`.

MS-008: all maintained code, comments, tests, UI and documentation use English. Product and engine terminology are independent of the default character. Preserve its geometry and existing animation data compatibility; mascot creation is deferred. Immutable historical references are not rewritten.

MS-009: the PO reports stationary overlay offset and unstable tracking. Reuse the classic coach capture profile and native video overlay coordinates. Hardware acceptance remains pending; do not activate the camera automatically.

## Functional units

| Issue                      | Verifiable outcome                                             | Status    | Owner                                                                  |
| -------------------------- | -------------------------------------------------------------- | --------- | ---------------------------------------------------------------------- |
| [MS-001](issues/MS-001.md) | Preserved reference and actionable agent mandates              | Done      | Coordinator                                                            |
| [MS-002](issues/MS-002.md) | Clips and playback independent of the UI                       | In review | animation_domain · gpt-6.2-sol medium                                  |
| [MS-003](issues/MS-003.md) | Explicit presentation reference and composition rules          | In review | design_reference · inherited model                                     |
| [MS-004](issues/MS-004.md) | Vue capture/character viewers with owned lifecycles            | In review | Coordinator                                                            |
| [MS-005](issues/MS-005.md) | Tested session and recording commands                          | In review | animation_domain · gpt-6.2-sol medium                                  |
| [MS-006](issues/MS-006.md) | Vue timeline, library and JSON/GLB exchanges                   | In review | Coordinator                                                            |
| [MS-007](issues/MS-007.md) | Integrated studio checked against the preserved reference      | In review | Coordinator                                                            |
| [MS-008](issues/MS-008.md) | English language and character-independent identity            | In review | Coordinator; animation_domain; design_reference; english_documentation |
| [MS-009](issues/MS-009.md) | Aligned camera overlay using the classic coach capture profile | In review | Coordinator                                                            |

Statuses: To do, In progress, In review, Done. Detailed evidence belongs in issues; In review retains pending checks and acceptance decisions.

## Navigation

- [Contribution rules](../AGENTS.md) and [architecture](ARCHITECTURE.md).
- [Frozen reference](REFERENCE.md) and [design](DESIGN.md).
- [Historical POC acceptance report](../docs/POC-ACCEPTANCE.md), retained as evidence for version 0.1.
- [README](../README.md): current installation and usage.
