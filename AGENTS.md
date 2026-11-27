# Motion Studio — règles de contribution

## Lecture et périmètre

Lire `documentation/INDEX.md`, l’issue porteuse dans `documentation/issues/`, puis les seuls contrats et fichiers concernés. Une unité fonctionnelle décrit un résultat vérifiable, pas un fichier. En cas de contradiction ou d’information manquante, le développeur demande au coordinateur ; celui-ci consulte les sources puis le PO si nécessaire. Ne pas inventer de comportement, de contrat ni de décision produit.

La référence immuable est le tag `reference/poc-v0.1`, commit `63d03ec348618f39890652803398a463b3de578d`. Ne pas modifier/déplacer ce tag, son worktree de comparaison ni l’image de référence. La reconstruction se fait sur `refactor/vue3-studio` ; ne pas remplacer la version Pages de référence sans décision du PO.

## Architecture obligatoire

- Vue 3, Composition API, `<script setup lang="ts">`, Vite et TypeScript strict.
- `src/domain/` : données, règles et ports ; aucun import Vue, Three.js, MediaPipe ou DOM.
- `src/infrastructure/` : adaptateurs navigateur, caméra, MediaPipe, Three.js et fichiers. Respecter les ports du domaine ; libérer flux, listeners, observer et ressources GPU.
- `src/application/` : session et cas d’usage testables, dépendances injectées. Les données lourdes et objets Three restent hors de la réactivité profonde.
- `src/composables/` : raccordements Vue et cycle de vie ; pas de mixins ni de singleton de session implicite.
- `src/views/` : composition de pages, sans règle métier ni initialisation directe du moteur.
- `src/components/core/` : primitives réutilisables (bouton, panneau, badge).
- `src/components/forms/` : champs et contrôles de formulaire, systématiquement ici, jamais recopiés dans une vue.
- `src/components/selectors/` : sélecteurs de valeurs/options, systématiquement ici.
- `src/components/domain/` : vues propres au studio, dont `Scene3DViewer`, capture et timeline.
- Les boutons des vues et composants métier utilisent `StudioButton`. Les champs utilisent les wrappers de formulaire/sélecteur. Les exceptions de primitives s’expliquent dans l’issue.
- Tests, doubles et fixtures dans `tests/`, jamais importés par les sources du produit. Aucun dossier vide pour simuler une architecture.

## Contrats et qualité

Chaque fichier source commence par une brève description de sa responsabilité. Chaque fonction nommée/méthode et fonction publique a un commentaire d’intention ; ajouter unités, limites et effets de bord quand utiles. Les callbacks triviaux utilisent le contexte de la fonction englobante. Noms métier explicites, composants PascalCase, composables `useX`, variables/fonctions camelCase, types PascalCase.

Maximum 500 lignes par fichier TypeScript ou composant Vue et quatre paramètres par fonction. ESLint applique ces limites et les règles Vue/TypeScript ; les contrôles d’architecture vérifient rangement, frontières et en-têtes. Un objet d’options ne masque pas une responsabilité excessive. Pas de désactivation de règle pour contourner ces contraintes sans justification du coordinateur dans l’issue. Préférer la réutilisation justifiée aux couches spéculatives. Aucun store global ou routeur sans besoin réel.

## Cycle de réalisation

1. Le coordinateur borne l’issue : résultat, invariants, contrats, fichiers attribués et recette.
2. Pour un nouveau comportement : test pertinent en échec → implémentation minimale → tests verts → refactor. Conserver la preuve RED/GREEN dans l’issue. Pour une migration : conserver/caractériser d’abord le comportement existant.
3. Exécuter `npm run check` (architecture, ESLint, types, tests, build). Distinguer lecture statique, essai automatisé et observation humaine.
4. Tester l’unité dans le navigateur, comparer à `documentation/DESIGN.md` et à la référence. Corriger les écarts, refaire la boucle. Une simulation desktop ne valide pas un vrai téléphone.
5. Mettre à jour l’issue : travaux, décisions, preuves exactes, anomalies, limites et suite. L’index global conserve uniquement statut, liens et contraintes actives.
6. Le coordinateur révise et intègre ; `En revue` si recette PO/humaine attendue, `Terminée` seulement avec critères satisfaits et verdict requis. Commits avec identifiant d’issue. Ne jamais prétendre un test passé sans l’avoir exécuté.

## Sous-agents

Les mandats sont dans `.agents/roles/`. Le coordinateur transmet explicitement le fichier de rôle, l’issue et le périmètre au lancement : ces fichiers Markdown sont des instructions de travail, pas une configuration magique du runtime.

- Coordinateur : `.agents/roles/coordinator.md`.
- Développeur : `.agents/roles/developer.md`.
- Designer : `.agents/roles/designer.md`.
- Synthèse ponctuelle : `.agents/roles/summarizer.md`.

Paralléliser seulement les responsabilités indépendantes, sans écriture concurrente d’un fichier. Les développeurs ne sous-délèguent ni ne committent sans mandat. Réutiliser les agents déjà lancés. Le coordinateur garde l’intégration et les mises à jour de l’index. Documentation en français, concise, sans justification promotionnelle de la stack.
