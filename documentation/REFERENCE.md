# Référence préservée

Le POC exécutable v0.1 est figé au commit `63d03ec348618f39890652803398a463b3de578d`, tag annoté `reference/poc-v0.1`. Ce tag ne doit jamais être déplacé. Le worktree de comparaison est séparé : `C:/Users/Tony/AppData/Local/Temp/motion-studio-reference`. Il ne contient aucune modification de reconstruction. On peut recréer cette comparaison avec `git worktree add --detach ../motion-studio-reference reference/poc-v0.1`, puis y exécuter `npm ci` et `npm run dev` sur un autre port.

Le site https://txtony.github.io/Motion-studio/ reste la version de référence tant que le PO n’a pas décidé le remplacement. La reconstruction est sur `refactor/vue3-studio`, avec comparaison locale et contrôles CI sans déploiement principal.

L’image fournie au lancement est une intention visuelle plus détaillée ; le POC observé utilise un gobelin procédural low-poly et un sous-ensemble fonctionnel annoncé. Ne pas transformer les éléments fictifs de l’image (export GLB d’animation, skins détaillés, bibliothèque de clips non capturés) en promesses de fonctionnalités. La migration doit préserver les fonctionnalités réelles et le design du POC ; toute évolution visuelle supplémentaire se décide séparément.

L’[image initiale](references/initial-studio.png) est conservée sans transformation. SHA-256 : `2cdc26464b0f510ebedc8b14fcd8723def298aee8581434328763450e971ed01`. Le tag conserve les sources exécutables et l’image conserve l’intention graphique ; aucune des deux références n’est écrasée par les nouveaux composants.
