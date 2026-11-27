# Motion Studio — suivi unique

## Décisions en vigueur

Reconstruction Vue 3/Vite autorisée le 27 novembre 2026. TDD, composants réutilisables et rangement imposé, mandats de rôles explicites. Aucun changement produit ou nouvelle esthétique. Les limitations caméra/mobile/GLTF du POC restent explicites. La référence `reference/poc-v0.1` pointe sur `63d03ec` ; `main` et le site Pages restent la comparaison publiée pendant le développement sur `refactor/vue3-studio`.

## Unités fonctionnelles

| Issue                      | Résultat vérifiable                                                      | Statut   | Responsable                           |
| -------------------------- | ------------------------------------------------------------------------ | -------- | ------------------------------------- |
| [MS-001](issues/MS-001.md) | Référence préservée et cadre agentique applicable                        | En cours | Coordinateur                          |
| [MS-002](issues/MS-002.md) | Clips et lecture indépendants de l’interface                             | En revue | animation_domain · gpt-6.2-sol medium |
| [MS-003](issues/MS-003.md) | Référence visuelle et règles de composition explicites                   | En revue | design_reference · modèle hérité      |
| [MS-004](issues/MS-004.md) | Capture et personnage intégrés dans des vues Vue à cycle de vie maîtrisé | En revue | Coordinateur / développeur            |
| [MS-005](issues/MS-005.md) | Session et enregistrement pilotés par des commandes testées              | En revue | animation_domain · gpt-6.2-sol medium |
| [MS-006](issues/MS-006.md) | Timeline, bibliothèque et échanges JSON/GLB utilisables dans Vue         | En revue | Coordinateur / développeur            |
| [MS-007](issues/MS-007.md) | Studio assemblé, contrôlé et comparable à la référence                   | En revue | Coordinateur                          |

Statuts : À faire, En cours, En revue, Terminée. Les preuves détaillées appartiennent aux issues. « En revue » conserve les limites de recette et les acceptations attendues.

## Navigation

- [Cadre](../AGENTS.md) et [architecture](ARCHITECTURE.md).
- [Référence figée](REFERENCE.md) et [design](DESIGN.md).
- [Recette historique du POC](../docs/RECETTE.md), conservée comme preuve de la version 0.1.
- [README](../README.md) : installation et usage de la version courante.
