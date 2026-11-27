/** Vue Three.js et adaptateur de rig : les captures ne connaissent ni maillages ni fichiers GLB. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { jointNames, type JointName, type RigPose } from "../../domain/studio";

export interface RigJoint {
  node: THREE.Object3D;
  bindWorld: THREE.Quaternion;
  axis: THREE.Vector3;
}
export interface CharacterRig {
  id: string;
  root: THREE.Group;
  motionRoot: THREE.Object3D;
  basePosition: THREE.Vector3;
  joints: Record<JointName, RigJoint>;
}
/** Construit un matériau partagé par les segments procéduraux de même finition. */
const material = (color: number, metalness = 0, roughness = 0.7) =>
  new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    flatShading: true,
  });

/** Gobelin low-poly original, hiérarchie articulée sans asset externe. Les membres visent -Y. */
export function createGoblin(): CharacterRig {
  const root = new THREE.Group();
  const green = material(0x819b3b),
    darkGreen = material(0x56682c),
    leather = material(0x44322b),
    steel = material(0x7c8790, 0.75, 0.38),
    brass = material(0xb39957, 0.65, 0.35),
    black = material(0x161d22),
    ivory = material(0xe4d8ad),
    lens = material(0x8bddd5, 0.5, 0.2);
  const nodes = {} as Record<JointName, THREE.Group>;
  /** Attache un segment géométrique avec ses ombres et sa position locale. */
  const mesh = (
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    pos: number[],
  ) => {
    const m = new THREE.Mesh(geometry, mat);
    m.position.fromArray(pos);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  /** Dimensionne une sphère pour former un volume anatomique low-poly. */
  const sphere = (
    p: THREE.Object3D,
    pos: number[],
    s: number[],
    mat = green,
  ) => {
    const segment = mesh(p, new THREE.SphereGeometry(1, 12, 8), mat, pos);
    segment.scale.fromArray(s);
    return segment;
  };
  /** Ajoute une pièce rigide d’équipement aux dimensions locales données. */
  const box = (
    p: THREE.Object3D,
    pos: number[],
    s: number[],
    mat: THREE.Material,
  ) =>
    mesh(
      p,
      new THREE.BoxGeometry(...(s as [number, number, number])),
      mat,
      pos,
    );
  /** Déclare un pivot nommé dans la hiérarchie utilisée par le retargeting. */
  const joint = (name: JointName, parent: THREE.Object3D, pos: number[]) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.fromArray(pos);
    parent.add(g);
    nodes[name] = g;
    return g;
  };
  const hips = joint("hips", root, [0, 1.19, 0]);
  sphere(hips, [0, 0, 0], [0.29, 0.2, 0.21], leather);
  const spine = joint("spine", hips, [0, 0.16, 0]);
  sphere(spine, [0, 0.28, 0], [0.36, 0.39, 0.23]);
  box(spine, [0, 0.25, 0.2], [0.44, 0.39, 0.07], leather);
  for (const x of [-0.23, 0.23]) {
    const strap = box(spine, [x, 0.35, 0.18], [0.07, 0.57, 0.05], leather);
    strap.rotation.z = x * 0.6;
    box(spine, [x, 0.22, 0.24], [0.085, 0.09, 0.025], brass);
  }
  box(hips, [0, 0.04, 0.2], [0.57, 0.1, 0.08], leather);
  box(hips, [0, 0.04, 0.26], [0.13, 0.115, 0.035], brass);
  for (const x of [-0.22, 0.22])
    box(hips, [x, -0.09, 0.23], [0.13, 0.19, 0.08], leather);
  const head = joint("head", spine, [0, 0.65, 0]);
  sphere(head, [0, 0.18, 0], [0.3, 0.31, 0.24]);
  sphere(head, [0, 0.01, 0.15], [0.25, 0.13, 0.2]);
  sphere(head, [0, 0.15, 0.28], [0.12, 0.08, 0.12], darkGreen);
  box(head, [0, -0.025, 0.29], [0.31, 0.035, 0.04], black);
  for (const side of [-1, 1]) {
    const ear = mesh(head, new THREE.ConeGeometry(0.15, 0.52, 3), green, [
      side * 0.39,
      0.22,
      0,
    ]);
    ear.rotation.z = -side * 1.1;
    ear.scale.z = 0.42;
    sphere(head, [side * 0.13, 0.23, 0.205], [0.085, 0.055, 0.04], ivory);
    sphere(head, [side * 0.13, 0.23, 0.242], [0.023, 0.035, 0.012], black);
    const brow = box(
      head,
      [side * 0.13, 0.3, 0.22],
      [0.22, 0.055, 0.07],
      darkGreen,
    );
    brow.rotation.z = side * 0.18;
    const tooth = mesh(head, new THREE.ConeGeometry(0.034, 0.14, 5), ivory, [
      side * 0.13,
      0.025,
      0.335,
    ]);
    tooth.rotation.z = -side * 0.15;
    const goggle = mesh(
      head,
      new THREE.TorusGeometry(0.092, 0.025, 6, 16),
      brass,
      [side * 0.12, 0.43, 0.16],
    );
    goggle.rotation.x = -0.35;
    sphere(head, [side * 0.12, 0.43, 0.159], [0.072, 0.072, 0.018], lens);
    const upper = joint(side === 1 ? "leftUpperArm" : "rightUpperArm", spine, [
      side * 0.35,
      0.48,
      0,
    ]);
    upper.rotation.z = (side * Math.PI) / 2;
    sphere(upper, [0, 0, 0], [0.19, 0.18, 0.18]);
    sphere(upper, [0, -0.19, 0], [0.145, 0.25, 0.145]);
    if (side === -1) sphere(upper, [0, -0.04, 0], [0.24, 0.14, 0.24], steel);
    const lower = joint(
      side === 1 ? "leftLowerArm" : "rightLowerArm",
      upper,
      [0, -0.39, 0],
    );
    sphere(lower, [0, -0.16, 0], [0.115, 0.21, 0.115]);
    mesh(
      lower,
      new THREE.CylinderGeometry(0.145, 0.12, 0.2, 8),
      leather,
      [0, -0.19, 0],
    );
    for (const y of [-0.11, -0.27])
      mesh(lower, new THREE.CylinderGeometry(0.15, 0.15, 0.035, 8), steel, [
        0,
        y,
        0,
      ]);
    sphere(lower, [0, -0.38, 0], [0.12, 0.14, 0.09]);
    for (let i = 0; i < 3; i++)
      sphere(lower, [(i - 1) * 0.067, -0.48, 0.02], [0.035, 0.09, 0.04]);
    const thigh = joint(side === 1 ? "leftUpperLeg" : "rightUpperLeg", hips, [
      side * 0.18,
      -0.1,
      0,
    ]);
    sphere(thigh, [0, -0.23, 0], [0.17, 0.29, 0.17], leather);
    const shin = joint(
      side === 1 ? "leftLowerLeg" : "rightLowerLeg",
      thigh,
      [0, -0.47, 0],
    );
    sphere(shin, [0, -0.2, 0], [0.13, 0.23, 0.13], leather);
    sphere(shin, [0, 0, 0.1], [0.17, 0.14, 0.08], steel);
    box(shin, [0, -0.43, 0.08], [0.29, 0.2, 0.42], black);
    box(shin, [0, -0.39, 0.19], [0.3, 0.08, 0.22], steel);
  }
  // Clé à molette fixée à la ceinture.
  const wrench = new THREE.Group();
  hips.add(wrench);
  wrench.position.set(0.35, -0.05, 0.04);
  wrench.rotation.z = -0.25;
  box(wrench, [0, -0.12, 0], [0.055, 0.36, 0.055], steel);
  mesh(
    wrench,
    new THREE.TorusGeometry(0.085, 0.027, 5, 8, Math.PI * 1.55),
    steel,
    [0, 0.07, 0],
  );
  root.updateMatrixWorld(true);
  const joints = {} as CharacterRig["joints"];
  for (const name of jointNames)
    joints[name] = {
      node: nodes[name],
      bindWorld: nodes[name].getWorldQuaternion(new THREE.Quaternion()),
      axis: new THREE.Vector3(
        0,
        name === "hips" || name === "spine" || name === "head" ? 1 : -1,
        0,
      ),
    };
  return {
    id: "goblin-mechanic-v1",
    root,
    motionRoot: hips,
    basePosition: hips.position.clone(),
    joints,
  };
}

export class CharacterRenderer {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(36, 1, 0.05, 100);
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;
  rig = createGoblin();
  private observer: ResizeObserver;
  /** Monte une scène orbitale dans le conteneur possédé par le viewer Vue. */
  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Vue 3D orbitale du personnage",
    );
    container.append(this.renderer.domElement);
    this.camera.position.set(3, 2.1, 5.9);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.25, 0);
    this.controls.enableDamping = true;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.scene.add(new THREE.HemisphereLight(0xc7d4ef, 0x343431, 2.5));
    const key = new THREE.DirectionalLight(0xffe1b6, 4);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x9c88ff, 3);
    rim.position.set(-3, 3, -2);
    this.scene.add(rim);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      material(0x191d24, 0.1, 0.9),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.y = -0.01;
    this.scene.add(floor);
    const grid = new THREE.GridHelper(20, 40, 0x555362, 0x2d333d);
    grid.position.y = 0.002;
    this.scene.add(grid);
    this.scene.fog = new THREE.Fog(0x191d24, 9, 24);
    this.scene.add(this.rig.root);
    this.observer = new ResizeObserver(() => {
      const w = container.clientWidth,
        h = container.clientHeight;
      if (!w || !h) return;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
    this.observer.observe(container);
  }
  /** Applique les rotations locales et l’offset de racine au rig courant. */
  apply(pose: RigPose) {
    this.rig.motionRoot.position
      .copy(this.rig.basePosition)
      .add(new THREE.Vector3().fromArray(pose.root));
    for (const name of jointNames)
      this.rig.joints[name].node.quaternion.fromArray(pose.rotations[name]);
  }
  /** Met à jour l’amortissement orbital puis dessine l’image courante. */
  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  /** Replace la caméra selon le cadrage original du gobelin. */
  resetView() {
    this.camera.position.set(3, 2.1, 5.9);
    this.controls.target.set(0, 1.25, 0);
  }
  /** GLB autonome : articulations nommées selon JointName, sans compression ni ressources externes. */
  async loadGLB(bytes: ArrayBuffer): Promise<void> {
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => {
      if (!url.startsWith("blob:") && !url.startsWith("data:"))
        throw new Error(
          "GLB autonome requis : ressources externes interdites.",
        );
      return url;
    });
    const gltf = await new GLTFLoader(manager).parseAsync(bytes, "");
    const root = gltf.scene;
    root.updateMatrixWorld(true);
    try {
      const joints = {} as CharacterRig["joints"];
      for (const name of jointNames) {
        const node = root.getObjectByName(name);
        if (!node)
          throw new Error(
            `Articulation manquante : ${name}. Voir le contrat GLB du README.`,
          );
        const child =
          node.children.find((c) => c.type === "Bone") ??
          node.children.find((c) => c.position.lengthSq() > 0.0001);
        if (
          !child &&
          ![
            "head",
            "leftLowerArm",
            "rightLowerArm",
            "leftLowerLeg",
            "rightLowerLeg",
          ].includes(name)
        )
          throw new Error(`Axe indéterminé : ${name}.`);
        joints[name] = {
          node,
          bindWorld: node.getWorldQuaternion(new THREE.Quaternion()),
          axis: child
            ? child.position.clone().normalize()
            : new THREE.Vector3(0, -1, 0),
        };
      }
      const hips = joints.hips.node;
      for (const name of jointNames.filter((n) => n !== "hips")) {
        let parent = joints[name].node.parent;
        while (parent && parent !== hips) parent = parent.parent;
        if (!parent)
          throw new Error(
            `Hiérarchie invalide : ${name} doit descendre de hips.`,
          );
      }
      const size = new THREE.Box3()
        .setFromObject(root)
        .getSize(new THREE.Vector3());
      if (size.y < 0.01 || size.y > 100)
        throw new Error(
          "Échelle GLB invalide ; utiliser des mètres (personnage de 1 à 3 m).",
        );
      const old = this.rig;
      this.scene.remove(old.root);
      this.disposeModel(old.root);
      this.rig = {
        id: "custom-glb-v1",
        root,
        motionRoot: hips,
        basePosition: hips.position.clone(),
        joints,
      };
      this.scene.add(root);
    } catch (error) {
      this.disposeModel(root);
      throw error;
    }
  }
  /** Libère les géométries et matériaux de la hiérarchie dont ce renderer est propriétaire. */
  private disposeModel(root: THREE.Object3D) {
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => m.dispose());
      }
    });
  }
  /** Déconnecte le redimensionnement, les contrôles et les ressources de rendu au démontage. */
  dispose() {
    this.observer.disconnect();
    this.controls.dispose();
    this.disposeModel(this.scene);
    this.renderer.dispose();
  }
}
