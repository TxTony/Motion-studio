# Référence de présentation — Motion Studio

## Autorité et portée

Référence de migration : POC exécutable figé par `reference/poc-v0.1` (`63d03ec`). Ce document décrit statiquement son `src/StudioUI.ts`, son `src/style.css` et ses états dans `src/main.ts`. La recette navigateur appartient à MS-007 ; cette formalisation ne vaut pas validation visuelle ou mobile.

L’image initiale exprime l’intention d’un logiciel de création sombre, à deux viewers et timeline. Elle comporte un personnage détaillé, des clips illustrés et un export GLB d’animation absents du POC. La migration reproduit le POC réel : gobelin procédural low-poly, bibliothèque de session et export JSON. Ne pas ajouter les fonctionnalités figurées par l’image.

## Composition à préserver

Ordre de lecture : barre de marque/navigation, titre d’atelier, espace de travail, timeline, bibliothèque/export, message de session, pied de page.

| Zone            | Contenu et rôle dans le POC                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Barre haute     | Marque « GOBLIN MOTION STUDIO », liens internes Capture/Bibliothèque/Personnage, indication POC v0.1 sur grand écran             |
| Capture humaine | Vidéo et squelette dans le même cadre, badge source, légende et FPS, sélection avant/arrière, activation caméra et retour Démo   |
| Scène 3D        | Gobelin, sol quadrillé et ombre, nom/rig en surimpression, indication temps réel/lecture, recentrage et aide orbite/zoom         |
| Inspecteur      | Trois panneaux : personnage/import GLB ; nom/fréquence/root et commandes d’enregistrement ; lissage et recentrage du déplacement |
| Timeline        | Nom de clip, début/lecture-pause/boucle/vitesse, temps courant/durée, quatre pistes Root/Colonne/Bras/Jambes et curseur rose     |
| Bibliothèque    | Cartes sélectionnables avec nom, durée, nombre de poses ; carte Nouvelle capture ; défilement horizontal local                   |
| Export/import   | Explication de conservation locale, export du clip JSON et import JSON                                                           |
| Message         | Une zone `role="status"`, `aria-live="polite"`, texte normal ou erreur ; aucune modalité supplémentaire                          |

La démo démarre animée en temps réel ; le clip « Atelier · Démo » de six secondes est présent et sélectionné dans la bibliothèque. Le badge DÉMONSTRATION et le texte « Source synthétique · aucune caméra active » doivent empêcher toute confusion avec une mesure humaine.

## Vocabulaire visuel existant

| Élément                  | Valeurs de référence                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Fond / panneau / bordure | `#101216` / `#1a1d24` / `#30333e`                                                                                     |
| Texte / secondaire       | `#e5e7ed` / `#9c9fac` ; contrastes locaux selon les viewers                                                           |
| Accent principal         | Violet `#9b7aff` ; action principale en dégradé `#9271e7 → #7453c3`                                                   |
| Source et squelette      | Vert pâle `#c0d887`, traits du squelette `#b6d889`                                                                    |
| Enregistrement / curseur | Rose-rouge `#ff687d` / `#f37e94`                                                                                      |
| Pistes                   | Bleu `#7199ce`, vert `#6ebfac`, ocre `#d0b270`, violet `#b18cdc`                                                      |
| Formes                   | Panneaux arrondis 10 px, contrôles 7 px, fines bordures, ombre discrète ; gouttières principales 14 px                |
| Typographie              | DM Sans pour l’interface, Barlow Condensed pour marque/titre/nom de scène, repli système                              |
| Échelle présente         | Titre principal 36 px (29 px mobile), titres de panneau 14 px, contrôles 12–13 px ; métadonnées plus petites héritées |

Conserver les variantes primaire, discrète, icône, enregistrement, sélectionnée et désactivée. Le focus clavier utilise un contour violet clair ; l’état désactivé reste visible (opacité 0,35). Le clignotement de l’enregistrement et les transitions sont coupés par `prefers-reduced-motion`. Ce relevé conserve les petites tailles héritées ; il ne constitue pas une certification d’accessibilité.

## Composants cibles et rangement obligatoire

Les noms ci-dessous sont des points de composition de la reconstruction, pas des composants déjà présents dans le POC.

| Emplacement                                 | Responsabilité                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `components/core/StudioButton.vue`          | Bouton commun : variantes, disabled, type et contenu ; toutes les actions métier le réutilisent                                |
| `components/core/StudioPanel.vue`           | Conteneur, titre et emplacement d’actions ; ne détient pas l’état d’une feature                                                |
| `components/forms/StudioTextField.vue`      | Label et valeur texte, notamment nom de capture                                                                                |
| `components/forms/StudioRangeField.vue`     | Label/valeur/unité et curseur, notamment lissage et position temporelle                                                        |
| `components/forms/StudioCheckbox.vue`       | Option booléenne et label, notamment déplacement 2D                                                                            |
| `components/forms/StudioFileInput.vue`      | Commande d’ouverture et input fichier, accessibilité et disabled ; aucune règle d’import métier                                |
| `components/selectors/StudioSelect.vue`     | Label accessible et options typées : caméra, fréquence, vitesse                                                                |
| `components/domain/MotionCaptureViewer.vue` | Vidéo/canvas et repères de capture ; conserve l’alignement et le miroir                                                        |
| `components/domain/Scene3DViewer.vue`       | Surface Three.js, surimpressions, orbite et recentrage ; propriétaire du montage/démontage du rendu                            |
| `components/domain/`                        | Panneaux métier d’enregistrement/personnage/retargeting, timeline, bibliothèque et échanges de fichiers selon les usages réels |
| `views/StudioView.vue`                      | Assemble les zones dans leur ordre ; aucune règle de capture ou de clip                                                        |

Les primitives natives sont encapsulées dans core/forms/selectors ; les vues et panneaux métier utilisent les wrappers. La timeline conserve son rendu de pistes métier, sans devenir un composant de formulaire générique. Le curseur accessible passe par le wrapper de plage, avec un mode de présentation adapté si nécessaire, plutôt qu’un second contrôle copié.

## États observables à conserver

| État              | Indices visuels et commandes                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Démo              | Badge explicite, squelette synthétique et gobelin animés ; enregistrer disponible                                                                          |
| Chargement caméra | Message de chargement, activation caméra et enregistrement indisponibles ; Démo reste disponible pour annuler                                              |
| Caméra active     | Badge CAMÉRA ACTIVE, vidéo/squelette alignés ; caméra avant affichée en miroir ; recherche puis compteur d’articulations/FPS                               |
| Corps perdu       | Mention « Corps perdu · pose maintenue », squelette effacé, enregistrement indisponible tant que la pose n’est pas exploitable                             |
| Enregistrement    | Point rose animé, texte Enregistrement et temps écoulé, arrêt disponible ; lecture/seek/export, changement de source et champs incompatibles indisponibles |
| Clip chargé       | Carte sélectionnée, timeline nommée, mode LECTURE DU CLIP ; lecture/pause, seek, vitesse et boucle pilotent la même sélection                              |
| Boucle active     | Commande sélectionnée et `aria-pressed=true` ; le temps repart dans le clip                                                                                |
| Erreur            | Message explicite dans la zone de statut, teinte rose ; l’erreur ne devient pas un faux succès ou une pose caméra synthétique                              |

Les labels accessibles des commandes icônes (début, lire/pause, boucle, recentrer) et du curseur restent présents. Les champs sont reliés à leur label ; les imports doivent rester utilisables au clavier. Aucune nouvelle commande d’édition de clés, de zoom temporel ou de format GLTF ne découle de la maquette d’intention.

## Responsive existant

- Au-dessus de 1100 px : capture à gauche, scène centrale plus large, inspecteur vertical à droite. Timeline pleine largeur, puis bibliothèque/export côte à côte.
- À partir de 1500 px : espace de travail `1fr / 1.6fr / 0.72fr`, scène d’au moins 650 px et marges latérales de 40 px.
- À 1100 px et moins : deux viewers côte à côte ; inspecteur sur une rangée de trois panneaux en dessous ; version haute masquée.
- À 720 px et moins : capture puis scène puis inspecteur, timeline et panneaux bas empilés ; navigation réduite aux symboles ; badge de traitement local et sous-titre de marque masqués. La source caméra reste au-dessus d’une rangée de boutons sans retour de ligne dans leur libellé.
- À 440 px et moins : inspecteur sur une seule colonne. La bibliothèque conserve son défilement horizontal interne ; la page ne doit pas déborder horizontalement.

Le viewport de capture mobile est 4:3 (minimum 240 px), la scène a une hauteur minimale de 480 px. Vidéo et squelette gardent `object-fit: contain` et le même repère ; le zoom/orbite tactile concerne le canvas 3D.

## Recette de comparaison MS-007

Comparer côte à côte la référence figée et la reconstruction, avec mêmes dimensions et même source synthétique. Relever les écarts avant correction, puis rejouer la recette :

1. À 1280 × 900 : vérifier ordre, proportions, colonnes, espacements, textes, couleurs, personnage, pistes et sélection initiale. À 1024 × 768 : vérifier le passage de l’inspecteur sous les viewers.
2. À 390 × 844 : vérifier empilement, absence de débordement de page, boutons caméra lisibles, inspecteur sur une colonne, transport et défilement local de bibliothèque.
3. Enregistrer une démo, arrêter, sélectionner le clip, lire/pause, seek à une valeur connue, changer vitesse et boucle ; vérifier simultanément commandes, nom, temps et pose.
4. Exporter puis importer le JSON ; comparer nom, durée, nombre de poses et sélection. Tester une erreur de fichier et l’indisponibilité des commandes pendant l’enregistrement.
5. Démarrer puis annuler l’accès caméra via Démo ; vérifier la sortie de l’état occupé. La caméra réelle, le miroir sur personne, l’orientation et le multitouch nécessitent une recette matérielle distincte.
6. Parcourir les contrôles au clavier et vérifier les labels/focus ; vérifier l’absence de clignotement si la réduction des animations est active.

Une égalité pixel à pixel de la pose animée n’est pas attendue sans horloge synchronisée ; comparer silhouette, cadrage et fonctionnement, puis une même position de clip arrêtée pour les poses. Les essais du POC déjà consignés dans `docs/RECETTE.md` restent historiques, sans être attribués à la migration.
