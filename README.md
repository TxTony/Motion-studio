# Goblin Motion Studio — POC v0.1

Studio web sans backend : caméra → MediaPipe Pose → retargeting → gobelin 3D → clips JSON réutilisables. Interface Vue 3 Composition API, TypeScript strict et Vite.

**Référence POC publiée : https://txtony.github.io/Motion-studio/**. La reconstruction Vue est développée sur `refactor/vue3-studio` ; elle ne remplace pas le site de référence pendant sa recette. Le tag `reference/poc-v0.1` conserve le commit initial `63d03ec`. Voir [le suivi et les unités fonctionnelles](documentation/INDEX.md).

## Démarrage

Node.js 22 recommandé (minimum 22.12), npm 10 ou supérieur.

```sh
npm ci
npm run dev
```

Ouvrir l’URL affichée, avec le chemin `/Motion-studio/`. `npm ci` copie les fichiers WASM de MediaPipe dans `public/mediapipe/`. Le modèle Lite version 1 est versionné dans `public/models/` : aucune dépendance à un CDN pour l’inférence. Le premier chargement télécharge environ 18 Mo de modèle/WASM ; le navigateur peut ensuite les mettre en cache normalement. Il n’y a pas de service worker ni de garantie hors ligne.

```sh
npm run test   # Vitest
npm run build # TypeScript strict + Vite
npm run check # architecture, ESLint, tests, types Vue/TS et build
npm run preview
```

Le `.npmrc` conserve `legacy-peer-deps=true` pour éviter un crash Arborist de npm 10 lors de la résolution des dépendances optionnelles de Vitest ; le lockfile fixe les versions installées. `vue-eslint-parser` est déclaré explicitement. L’override `@vue/test-utils → js-beautify@1.14.8` retient un formateur de tests compatible hors des plages signalées par l’audit npm ; il n’entre pas dans le bundle du produit. Des dépendances transitives de cet outil de tests restent dépréciées : réexaminer ce verrou lors d’une mise à jour de Vue Test Utils, sans changement forcé non testé.

## Utilisation

1. Le studio démarre avec une **source synthétique clairement indiquée** et un clip démo de six secondes. Le personnage bouge réellement dans Three.js.
2. Choisir caméra avant/arrière puis **Activer la caméra**. Autoriser la vidéo, cadrer une personne entière, idéalement à 2–3 m, dans une pièce éclairée. **Démo** annule aussi une demande caméra en attente.
3. Régler le lissage (constante de temps de 0 à 400 ms). Le déplacement expérimental 2D est désactivé par défaut ; **Recentrer le déplacement** fixe une nouvelle origine.
4. Nommer le clip, choisir 15 ou 30 poses/s au maximum, cliquer **Enregistrer** puis **Arrêter**. La fréquence effective dépend du téléphone. La capture est limitée à cinq minutes ; le POC ne complète pas les images manquantes.
5. Lire, mettre en pause, revenir au début, déplacer la tête de lecture, choisir 0,5×/1×/2× et la boucle. Cliquer **Nouvelle capture** ou **Démo** pour revenir au temps réel.
6. **Exporter le clip** télécharge un JSON ; **Importer** le recharge. La bibliothèque reste en mémoire : **exporter avant de recharger ou fermer la page**. Les captures de la source synthétique sont des données de démonstration, pas des mesures humaines.

La caméra exige **HTTPS ou localhost**, WebAssembly, WebGL et `getUserMedia`. Une adresse LAN HTTP ouverte depuis un téléphone ne satisfait généralement pas cette condition : utiliser GitHub Pages en HTTPS. L’accès dépend également des permissions du navigateur et du système. Le flux est fermé en arrière-plan ou à la fermeture de la page ; sa reprise est manuelle.

## Fonctionnalités et limites réelles

| Domaine     | Réalisé                                                                                                      | Limite du POC                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Capture     | 33 points MediaPipe, squelette superposé, vidéo avant/arrière                                                | Une personne, pas de capture des doigts ni des expressions                                                                              |
| Coordonnées | Image normalisée pour le dessin ; positions 3D estimées pour les rotations                                   | Profondeur relative estimée, aucune mesure de translation métrique dans la pièce                                                        |
| Personnage  | Gobelin mécanicien low-poly original, 11 articulations hiérarchiques, accessoires, ombres et caméra orbitale | Géométrie procédurale rigide par segment ; pas un personnage organique à skinning                                                       |
| Retargeting | Rotations locales par quaternions, compensation parent, filtre exponentiel indépendant du débit              | Pas de solveur IK, verrouillage des pieds, contraintes articulaires ni estimation du twist autour des membres ; tête solidaire du torse |
| Occultation | Maintien des membres invisibles ; aucune pose enregistrée si le bassin n’est pas exploitable                 | Les trous temporels sont interpolés à la lecture ; un message indique la perte du corps                                                 |
| Déplacement | Déplacement relatif X/Y à partir du centre des hanches dans l’image                                          | Facteur heuristique de 3 unités par largeur/hauteur normalisée ; pas de translation Z ; recadrage/éloignement influencent le résultat   |
| Timeline    | Lecture interpolée, seek, pause, vitesse et boucle                                                           | Pistes visuelles regroupées, marqueurs échantillonnés ; pas d’édition de clés ni de montage                                             |
| JSON        | Format v1, validation des temps/quaternions, limites de taille                                               | Clips compatibles avec le même rig ; pas de conversion universelle entre rigs                                                           |
| GLB         | Import d’un personnage autonome respectant le contrat ci-dessous                                             | Pas d’auto-mapping Mixamo/VRM, de Draco/KTX2 ni de ressources externes                                                                  |
| Export GLTF | Frontière `AnimationExportAdapter` prévue                                                                    | **Export GLTF/GLB d’animation non implémenté en v0.1**                                                                                  |
| Mobile      | Mise en page responsive, commandes tactiles, OrbitControls                                                   | Débit, chauffe, latence et ressenti à qualifier sur de vrais téléphones                                                                 |

L’inférence CPU synchrone est limitée à 30 Hz, seulement pour une nouvelle image vidéo. Elle utilise le thread principal ; les appareils modestes peuvent ralentir. Le DPR du rendu est plafonné à 2. Une future étape pourra déplacer l’inférence dans un worker après mesures. Three.js produit un chunk d’environ 552 Ko minifié (140 Ko gzip) : l’avertissement Vite est connu.

## Personnage interchangeable

La capture produit exclusivement `PoseSample`. `SkeletonMapping` et `Retargeting` accèdent à `CharacterRig`, pas aux maillages du gobelin. Le rendu peut donc changer sans modifier `MotionCapture`.

L’import accepte un **GLB autonome** de moins de 30 Mo. Les ressources externes sont refusées. Exporter en mètres, Y vers le haut, personnage face à +Z, dimensions de l’ordre de 1 à 3 m, avec transformations de scène appliquées, sans échelle non uniforme, et ces noms exacts et uniques :

```text
hips
  spine
    head
    leftUpperArm → leftLowerArm → extrémité de main
    rightUpperArm → rightLowerArm → extrémité de main
  leftUpperLeg → leftLowerLeg → extrémité de pied
  rightUpperLeg → rightLowerLeg → extrémité de pied
```

Tous les joints doivent descendre de `hips`. Les branches bras/jambes doivent respecter cette hiérarchie pour que les rotations locales fonctionnent. La direction du premier enfant Bone (ou premier enfant décalé) donne l’axe d’un membre. Ajouter un os terminal à chaque avant-bras/jambe ; à défaut, le POC suppose -Y pour les membres terminaux. Les axes du bassin/torse/tête doivent correspondre au repère canonique Y haut, Z frontal. Les offsets et maillages/skinning restent la propriété du modèle. Les rigs arbitraires, twists, contraintes et échelles ne sont pas convertis automatiquement.

L’identifiant des clips GLB contient le SHA-256 du fichier. Pour relire un clip après réouverture, réimporter **le même GLB**, puis le JSON. Un clip d’un autre rig est conservé en bibliothèque mais sa lecture est refusée. Le bouton **Recentrer la caméra 3D** ne recalcule pas les dimensions d’un modèle hors contrat.

## Architecture

Une vue `StudioView` compose les panneaux Vue. `components/core`, `forms`, `selectors` et `domain` distinguent primitives, formulaires, sélecteurs et composants métier. Les formulaires et boutons sont encapsulés et réutilisés. `useStudioSession` raccorde les viewers à une instance de `StudioSession`, sans singleton ni réactivité profonde des objets moteur.

`domain/` contient les contrats, le recorder, le lecteur à interpolateur injecté et la validation JSON ; il ne dépend pas de Vue, Three.js, MediaPipe ou du DOM. `application/` détient les transitions et commandes avec horloge/ports injectés. `infrastructure/` contient les adaptateurs caméra, mathématiques, Three.js, fichiers et canvas. Le viewer 3D possède la destruction du renderer ; la session ferme la capture et le composable retire les écouteurs/boucle au démontage.

Les commentaires d’intention, le rangement, les frontières, quatre paramètres maximum et 500 lignes maximum par TS/Vue sont contrôlés. Les mandats des agents et le cycle TDD sont dans [AGENTS.md](AGENTS.md), avec [les contrats de l’architecture](documentation/ARCHITECTURE.md) et [la référence de design](documentation/DESIGN.md).

| Module                               | Responsabilité                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| `MotionCapture`                      | Permissions, flux vidéo, initialisation/inférence MediaPipe, libération des ressources |
| `SkeletonMapping`                    | Repères, connexions, visibilité, orientation du bassin et source synthétique           |
| `Retargeting`                        | Directions → quaternions locaux, lissage, translation expérimentale                    |
| `CharacterRenderer`                  | Rig procédural/import GLB, scène Three.js, OrbitControls, rendu et nettoyage           |
| `AnimationRecorder`                  | Échantillonnage de poses copiées et horodatées en secondes                             |
| `AnimationPlayer`                    | Arbitrage temporel, recherche binaire, interpolation translation/slerp                 |
| `AnimationSerializer`                | JSON versionné et validé, contrat d’export extensible                                  |
| `StudioUI`                           | Structure de l’interface et formatage des temps                                        |
| `StudioSession` / `useStudioSession` | Commandes testées, arbitrage live/lecture, bibliothèque et raccordement Vue            |

Le JSON contient `format`, `version`, `name`, `rig`, `fps`, `duration`, puis `frames[{time,pose:{root,rotations}}]`. `root` est un offset local XYZ en unités du rig. `rotations` contient les onze quaternions locaux `[x,y,z,w]`. Les timestamps sont relatifs au début de la capture, croissants, et le dernier donne `duration`. Les premiers points peuvent arriver après t=0. La lecture maintient alors la première pose. L’export GLTF futur devra transformer ces données en `VectorKeyframeTrack`/`QuaternionKeyframeTrack`, puis en `AnimationClip` Three.js lié au rig avant `GLTFExporter` ; l’interface d’export ne promet pas cette conversion aujourd’hui.

## Confidentialité et ressources

Aucune vidéo ni pose n’est envoyée par l’application. La caméra n’enregistre que les poses en mémoire lorsque l’utilisateur l’ordonne ; aucun micro n’est demandé. Les JSON/GLB sont lus localement. Le site charge ses fichiers depuis son hébergeur ; les polices Barlow Condensed et DM Sans viennent de Google Fonts (requêtes réseau habituelles, sans images caméra). Les fontes système restent disponibles si ce service ne répond pas.

Le modèle officiel est [Pose Landmarker Lite, float16, version 1](https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task), SHA-256 `59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a`. Voir [la documentation MediaPipe](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) et les notices de son [dépôt officiel](https://github.com/google-ai-edge/mediapipe). Three.js est distribué sous MIT et MediaPipe sous Apache-2.0 ; conserver les notices des dépendances. Le personnage procédural est créé dans ce dépôt, sans asset artistique tiers.

## GitHub Pages

Le workflow `.github/workflows/pages.yml` exécute `npm ci` et `npm run check` (architecture, ESLint, types, tests, build). Les PR et la branche `refactor/vue3-studio` sont vérifiées sans publication. Les pushes sur `main` et le déclenchement manuel construisent et déploient `dist/` via l’environnement `github-pages`. La base Vite est `/Motion-studio/`, y compris pour le modèle et le WASM.

Dans **Settings → Pages → Build and deployment**, utiliser **GitHub Actions**. Le workflow ne requiert aucun secret applicatif : `contents: read` pour la construction, `pages: write` et `id-token: write` uniquement pour le déploiement. Si Pages n’est pas activé, un administrateur doit l’activer ; un simple droit de lecture ou une intégration GitHub retournant 403 ne suffit pas pour pousser/configurer ce dépôt.

Voir [le rapport de migration Vue](documentation/issues/MS-007.md) et [la recette historique du POC](docs/RECETTE.md) pour distinguer les contrôles automatisés, les observations navigateur et les vérifications mobiles restantes.
