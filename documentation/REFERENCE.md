# Preserved reference

The runnable POC v0.1 is frozen at commit `63d03ec348618f39890652803398a463b3de578d` under the annotated tag `reference/poc-v0.1`. Keep the tag at this commit. The separate comparison worktree at `C:/Users/Tony/AppData/Local/Temp/motion-studio-reference` contains the original artifact. To recreate it, run `git worktree add --detach ../motion-studio-reference reference/poc-v0.1`, then run `npm ci` and `npm run dev` there on a different port.

The [published POC](https://txtony.github.io/Motion-studio/) remains the reference until the PO approves replacing it. The reconstruction lives on `refactor/vue3-studio` and uses local comparison and CI checks. Deployment to the main Pages site requires a separate decision.

The initial image illustrates the visual intent in more detail. The runnable POC uses a low-poly procedural character and implements a subset of the features shown. Animation export to GLB, detailed skins, and a library of illustrated clips are concepts from the image. The migration preserves the POC's implemented features and design. Further visual changes require a separate decision.

The [initial image](references/initial-studio.png) is preserved as supplied. Its SHA-256 is `2cdc26464b0f510ebedc8b14fcd8723def298aee8581434328763450e971ed01`. Current documentation uses the Motion Studio identity and neutral character terminology. The tag and image retain the original executable and visual artifacts.
