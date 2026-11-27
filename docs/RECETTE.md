# Recette POC v0.1

Date : 27 novembre 2026. Dépôt initial inspecté vide ; aucun asset ni code existant à conserver. Périmètre autorisé : brief Motion Studio v0.1. Travail isolé du dépôt ARPG Lab.

## Contrôles exécutés

- Windows, Node 22.21.0, npm 10.9.4.
- TypeScript strict et build Vite : succès.
- Tests Vitest : données d’animation, fréquence et copies du recorder, interpolation quaternion/translation, lecture avant première pose, boucle/vitesse/pause/fin, validation JSON, repère, occultation, lissage et recentrage du retargeting.
- Audit npm après mise à jour des dépendances : zéro vulnérabilité signalée.
- HTTP local : page `/Motion-studio/`, modèle `.task` et WASM SIMD répondent 200.
- Navigateur Chromium intégré : gobelin 3D animé, squelette synthétique visible, scène éclairée et sol avec ombre observés.
- Enregistrement synthétique « Recette_Demo » : 4,08 s, 123 poses, présence du clip en bibliothèque après arrêt.
- Lecture et pause ; seek à 2,00 s ; boucle désactivée ; vitesse 2× : états des commandes et temps affichés vérifiés.
- Export `Recette_Demo.json`, puis import du même fichier : nouveau clip de même durée/nombre de poses et sélection en bibliothèque observés.
- Mise en page à 390 × 844 : empilement des panneaux et timeline observés. Il s’agit d’un viewport desktop, pas d’un téléphone réel.
- MediaPipe : initialisation WASM et modèle observée (message OpenGL de la bibliothèque). L’accès caméra reste en attente dans le navigateur intégré ; aucune détection réelle ni performance caméra humaine validée.

## Restant à vérifier humainement

- Sur Android Chrome et iOS Safari en HTTPS : autorisation/refus caméra, avant/arrière, alignement miroir vidéo/squelette, bras et jambes face à la caméra, profil et occultations.
- Mesurer la fréquence effective, la chauffe, la latence perçue et le coût du rendu sur au moins un téléphone modeste. « 30 FPS » est une cible maximale, pas une performance certifiée.
- Multitouch réel (orbite et pincement) et changement portrait/paysage.
- Import d’un GLB de production respectant le contrat : axes, skinning, proportions et relecture du JSON avec le même fichier.
- Comparaison du geste humain et du personnage : torsion, pose du pied, tête et précision en profondeur ne sont pas qualifiées par les tests unitaires.

## Limites acceptées du POC

Pas de backend, comptes, persistance automatique, montage, doigts/visage, IK, correction du contact au sol, métrique de déplacement dans la pièce ni export d’animation GLTF. La démo synthétique est distincte des mesures de caméra. Les limites et le format des données sont détaillés dans le README.

## Reproduction et retour arrière

`npm ci && npm run check` reproduit les contrôles automatiques. Ouvrir le studio, enregistrer cinq secondes de démo, arrêter, lire, déplacer le curseur, exporter puis réimporter. La source caméra est une recette distincte nécessitant matériel et permission.

Les changements sont un premier commit d’un dépôt initialement vide. Pour une évolution future, revenir à ce commit ou redéployer son workflow constitue le point de retour ; aucune suppression d’historique ni réécriture forcée nécessaire.
