# Architecture cible et contrats de migration

Vue 3 Composition API, Vite et TypeScript strict. Une seule vue Studio, sans routeur ni store global. Les refs DOM appartiennent aux viewers ; les données de session restent testables sans rendu et sans caméra.

## Dépendances

`views → components/domain + composables → application → domain`.

Les adaptateurs `infrastructure/` implémentent les ports de `application/` ou `domain/`. Le point d’assemblage injecte ces adaptateurs ; le domaine n’importe ni Vue, ni Three.js, ni MediaPipe, ni le DOM. La session ne dépend pas des composants. Les objets Three/flux/canvases ne sont jamais profondément réactifs.

## Données

`domain/studio.ts` conserve les onze articulations, tuple quaternion XYZW, translation XYZ, PoseSample et JSON v1. Les timestamps d’inférence sont en ms ; clips et lecture en secondes. `AnimationRecorder` conserve les valeurs 15/30 Hz, limite 300 s et copies des poses. `AnimationPlayer` reçoit une fonction `PoseInterpolator` injectée, garde recherche temporelle et boucle ; l’adaptateur Three conserve lerp/slerp existants. Le serializer valide les données inconnues avant de produire le type métier. Pas de nouvelle bibliothèque de mathématiques ni changement de format.

## Frontières moteur et session

Capture : `start(facing)`, `sample(nowMs)`, `stop()`, `dispose()` ; aucun micro. `undefined` signifie aucune nouvelle image, `null` signifie aucun corps, une valeur signifie une pose. Rendu : `apply(pose)`, `render()`, `resetView()`, `loadGLB(bytes)`, `dispose()` et rig accessible seulement à l’adaptateur de retargeting. Retargeting : `solve(sample, rig, dtSeconds)` et `reset()`, lissage et root selon les constantes de référence.

La session reçoit des ports pour source, personnage, résolution de pose, horloge/fichiers. Elle détient bibliothèque, sélection, mode live/lecture, recorder/player et états d’indisponibilité. Ses commandes sont testées avant les composants. Les viewers montent les adaptateurs et les détruisent au démontage ; la boucle de session est annulée et les listeners retirés.

## Composition UI

`core/StudioButton`, `StudioPanel`, `forms/StudioTextField`, `StudioRangeField`, `StudioCheckbox`, `StudioFileInput`, `selectors/StudioSelect`. Les composants métier réutilisent ces primitives et émettent des intentions typées. `views/StudioView.vue` compose les panneaux. Pas d’HTML généré avec innerHTML ni de recherche globale par identifiant pour piloter l’état.

## Contrôles

ESLint flat config Vue/TypeScript, max-params 4, max-lines 500, noms cohérents, en-têtes et frontières de dépendance/rangement contrôlés. Vitest conserve les caractérisations existantes et teste les nouvelles commandes avec horloge et ports simulés, puis les composants avec Vue Test Utils. Recette navigateur sur desktop et viewport mobile ; essais réels téléphone toujours distincts.

Sources techniques : [Vue — Composition API et TypeScript](https://vuejs.org/guide/typescript/composition-api), [tests Vue](https://vuejs.org/guide/scaling-up/testing.html), [ESLint Vue](https://eslint.vuejs.org/user-guide/). Les règles spécifiques du dépôt sont dans AGENTS.md.
