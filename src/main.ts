/** Assemblage de session : arbitre source live/démo/lecture, commandes UI et cycle de vie. */
import "./style.css";
import { CharacterRenderer, createGoblin } from "./CharacterRenderer";
import { MotionCapture } from "./MotionCapture";
import { Retargeting } from "./Retargeting";
import { AnimationRecorder } from "./AnimationRecorder";
import { AnimationPlayer } from "./AnimationPlayer";
import { AnimationSerializer } from "./AnimationSerializer";
import { connections, demoSample } from "./SkeletonMapping";
import { mountStudio, element, timecode } from "./StudioUI";
import type { AnimationClip, PoseSample } from "./types";

mountStudio(element("app"));
const status = (message: string, error = false) => {
  element("status").textContent = message;
  element("status").classList.toggle("error", error);
};
const input = (id: string) => element<HTMLInputElement>(id);
const button = (id: string) => element<HTMLButtonElement>(id);
let renderer: CharacterRenderer;
try {
  renderer = new CharacterRenderer(element("renderer"));
} catch {
  status(
    "WebGL indisponible. Activez l’accélération graphique ou ouvrez un navigateur compatible.",
    true,
  );
  throw new Error("WebGL requis");
}
const capture = new MotionCapture(element<HTMLVideoElement>("video"));
const retarget = new Retargeting(),
  recorder = new AnimationRecorder(),
  player = new AnimationPlayer();
let source: "demo" | "camera" = "demo",
  playback = false,
  busy = false,
  lastSample = 0,
  recordStart = 0,
  frameId = 0,
  disposed = false;
let lastPoseAt = 0,
  liveReady = false;
const clips: AnimationClip[] = [];
const overlay = element<HTMLCanvasElement>("overlay"),
  overlayContext = overlay.getContext("2d")!;
const timeline = element<HTMLCanvasElement>("timeline-canvas"),
  timelineContext = timeline.getContext("2d")!;

function createDemo(): AnimationClip {
  const rig = createGoblin(),
    solver = new Retargeting();
  solver.smoothing = 0;
  const clip: AnimationClip = {
    format: "motion-studio",
    version: 1,
    name: "Atelier · Démo",
    rig: rig.id,
    fps: 30,
    duration: 6,
    frames: [],
  };
  for (let i = 0; i <= 180; i++) {
    const pose = solver.solve(demoSample(i / 30), rig, 1 / 30);
    if (pose) clip.frames.push({ time: i / 30, pose: structuredClone(pose) });
  }
  rig.root.traverse((o) => {
    if ("geometry" in o) (o.geometry as { dispose: () => void }).dispose();
  });
  return clip;
}

function selectClip(clip: AnimationClip) {
  if (recorder.recording) return;
  if (clip.rig !== renderer.rig.id) {
    status(
      "Ce clip appartient à un autre rig. Rechargez le personnage utilisé pour cette capture.",
      true,
    );
    return;
  }
  player.load(clip);
  playback = true;
  retarget.reset();
  renderer.apply(player.sample()!);
  renderLibrary();
  updateControls();
  status(
    `Clip « ${clip.name} » chargé. Lecture, boucle et timeline disponibles.`,
  );
}
function renderLibrary() {
  const list = element("clips");
  list.replaceChildren();
  element("clip-count").textContent = String(clips.length);
  for (const clip of clips) {
    const b = document.createElement("button");
    b.className = `clip-card${player.clip === clip ? " selected" : ""}`;
    b.disabled = recorder.recording;
    b.setAttribute("aria-pressed", String(player.clip === clip));
    const symbol = document.createElement("span");
    symbol.className = "clip-symbol";
    symbol.textContent = "♙";
    const details = document.createElement("span"),
      title = document.createElement("strong"),
      small = document.createElement("small");
    title.textContent = clip.name;
    small.textContent = `${clip.duration.toFixed(2)} s · ${clip.frames.length} poses${clip.name.includes("Démo") ? " · démo" : ""}`;
    details.append(title, small);
    b.append(symbol, details);
    b.onclick = () => selectClip(clip);
    list.append(b);
  }
  const b = document.createElement("button");
  b.className = "new-clip";
  b.innerHTML = "<b>＋</b>Nouvelle capture";
  b.disabled = recorder.recording;
  b.onclick = () => {
    setLive();
    input("clip-name").focus();
    status(
      "Source temps réel active. Nommez le clip puis lancez l’enregistrement.",
    );
  };
  list.append(b);
}
function updateControls() {
  button("record").disabled =
    recorder.recording || busy || (source === "camera" && !liveReady);
  button("stop").disabled = !recorder.recording;
  for (const id of ["play", "rewind", "loop", "export"])
    button(id).disabled = recorder.recording || !player.clip;
  for (const id of [
    "glb-import",
    "json-import",
    "clip-name",
    "record-fps",
    "camera-facing",
    "capture-root",
  ])
    input(id).disabled = recorder.recording || busy;
  input("scrubber").disabled = recorder.recording || !player.clip;
  button("camera-start").disabled = recorder.recording || busy;
  button("demo").disabled = recorder.recording;
  button("play").textContent = player.playing ? "Ⅱ" : "▶";
  button("play").setAttribute(
    "aria-label",
    player.playing ? "Mettre en pause" : "Lire le clip",
  );
  element("record-dot").classList.toggle("recording", recorder.recording);
  element("record-state").textContent = recorder.recording
    ? "Enregistrement…"
    : "Prêt à enregistrer";
  element("render-mode").textContent = playback
    ? "LECTURE DU CLIP"
    : "TEMPS RÉEL";
}
function setLive() {
  player.playing = false;
  playback = false;
  retarget.reset();
  lastSample = 0;
  updateControls();
}

button("camera-start").onclick = async () => {
  if (busy || recorder.recording) return;
  busy = true;
  setLive();
  updateControls();
  status("Chargement de MediaPipe puis demande d’accès à la caméra…");
  try {
    const facing = element<HTMLSelectElement>("camera-facing").value as
      "user" | "environment";
    await capture.start(facing);
    if (!capture.active) return;
    source = "camera";
    liveReady = false;
    lastPoseAt = performance.now();
    element("capture-view").classList.toggle("mirrored", facing === "user");
    element("source-badge").textContent = "CAMÉRA ACTIVE";
    element("capture-caption").textContent = "Recherche du corps entier…";
    status(
      "Caméra active. Cadrez le corps entier ; les poses sont traitées localement.",
    );
  } catch (error) {
    useDemo();
    status(
      `Caméra indisponible : ${error instanceof Error ? error.message : String(error)}. Le mode démo reste disponible.`,
      true,
    );
  } finally {
    busy = false;
    updateControls();
  }
};
function useDemo() {
  capture.stop();
  busy = false;
  source = "demo";
  liveReady = true;
  element("capture-view").classList.remove("mirrored");
  element("source-badge").textContent = "DÉMONSTRATION";
  element("capture-caption").textContent =
    "Source synthétique · aucune caméra active";
  setLive();
  status(
    "Mode démo actif : mouvements synthétiques, enregistrement et export disponibles.",
  );
}
button("demo").onclick = useDemo;
button("record").onclick = () => {
  if (recorder.recording || busy || (source === "camera" && !liveReady)) return;
  setLive();
  recordStart = performance.now();
  recorder.start(
    input("clip-name").value,
    renderer.rig.id,
    Number(element<HTMLSelectElement>("record-fps").value),
    recordStart,
  );
  updateControls();
  renderLibrary();
  status(
    `Enregistrement ${source === "demo" ? "de la source synthétique" : "caméra"} en cours. Limite : 5 minutes.`,
  );
};
function stopRecording() {
  if (!recorder.recording) return;
  const clip = recorder.stop();
  updateControls();
  if (clip) {
    clips.push(clip);
    selectClip(clip);
    input("clip-name").value =
      `Capture_${String(clips.length).padStart(2, "0")}`;
    status(
      `« ${clip.name} » enregistré : ${clip.frames.length} poses. Exportez le JSON pour le conserver.`,
    );
  } else {
    status(
      "Capture trop courte ou aucune pose détectée. Aucun clip créé.",
      true,
    );
    renderLibrary();
  }
}
button("stop").onclick = stopRecording;
button("play").onclick = () => {
  if (!player.clip) return;
  if (!playback) {
    playback = true;
    retarget.reset();
  }
  if (player.time >= player.clip.duration) player.seek(0);
  player.playing = !player.playing;
  updateControls();
};
button("rewind").onclick = () => {
  player.seek(0);
  playback = true;
  updateControls();
};
button("loop").onclick = () => {
  player.loop = !player.loop;
  button("loop").classList.toggle("selected", player.loop);
  button("loop").setAttribute("aria-pressed", String(player.loop));
};
element<HTMLSelectElement>("speed").onchange = (e) => {
  player.speed = Number((e.target as HTMLSelectElement).value);
};
input("scrubber").oninput = () => {
  player.playing = false;
  playback = true;
  player.seek(Number(input("scrubber").value));
  updateControls();
};
input("smoothing").oninput = () => {
  retarget.smoothing = Number(input("smoothing").value) / 1000;
  element("smoothing-value").textContent = `${input("smoothing").value} ms`;
};
input("capture-root").onchange = () => {
  retarget.captureRoot = input("capture-root").checked;
  retarget.reset();
};
button("calibrate").onclick = () => {
  retarget.reset();
  status("Origine du déplacement réinitialisée sur la prochaine pose.");
};
button("reset-view").onclick = () => renderer.resetView();
button("export").onclick = () => {
  if (!player.clip) return;
  try {
    const url = URL.createObjectURL(
      new Blob([AnimationSerializer.stringify(player.clip)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${player.clip.name.replace(/[^\p{L}\p{N}_-]/gu, "_")}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status("Clip JSON exporté. Les vidéos ne sont jamais enregistrées.");
  } catch (error) {
    status(String(error), true);
  }
};
input("json-import").onchange = async () => {
  const file = input("json-import").files?.[0];
  if (!file) return;
  try {
    if (file.size > 20_000_000)
      throw new Error("Fichier trop volumineux (20 Mo maximum).");
    const clip = AnimationSerializer.parse(await file.text());
    clips.push(clip);
    renderLibrary();
    selectClip(clip);
  } catch (error) {
    status(
      `Import refusé : ${error instanceof Error ? error.message : String(error)}`,
      true,
    );
  } finally {
    input("json-import").value = "";
  }
};
input("glb-import").onchange = async () => {
  const file = input("glb-import").files?.[0];
  if (!file) return;
  busy = true;
  setLive();
  updateControls();
  try {
    if (file.size > 30_000_000)
      throw new Error("GLB trop volumineux (30 Mo maximum).");
    const bytes = await file.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    const id = Array.from(new Uint8Array(hash))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("");
    await renderer.loadGLB(bytes);
    renderer.rig.id = `glb-${id}`;
    player.clip = null;
    player.time = 0;
    element("character-name").textContent = file.name;
    element("rig-name").textContent = "GLB · rig compatible";
    element("model-kind").textContent = "Personnage GLB importé";
    element("character").querySelector(".scene-name")!.textContent = file.name;
    status("Personnage GLB chargé. Les captures suivantes utiliseront ce rig.");
  } catch (error) {
    status(
      `Import GLB refusé : ${error instanceof Error ? error.message : String(error)}`,
      true,
    );
  } finally {
    busy = false;
    input("glb-import").value = "";
    retarget.reset();
    updateControls();
    renderLibrary();
  }
};

function canvasSize(canvas: HTMLCanvasElement): [number, number] {
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    dpr = Math.min(devicePixelRatio, 2);
  if (
    canvas.width !== Math.round(w * dpr) ||
    canvas.height !== Math.round(h * dpr)
  ) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  return [w, h];
}
function drawSkeleton(sample: PoseSample | null) {
  const [w, h] = canvasSize(overlay);
  const ctx = overlayContext;
  ctx.setTransform(overlay.width / w, 0, 0, overlay.height / h, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (!sample) return;
  const video = element<HTMLVideoElement>("video");
  const ratio =
    source === "camera" && video.videoWidth
      ? video.videoWidth / video.videoHeight
      : 4 / 3;
  const vw = Math.min(w, h * ratio),
    vh = vw / ratio,
    ox = (w - vw) / 2,
    oy = (h - vh) / 2;
  const pos = (i: number) => [
    ox + sample.image[i].x * vw,
    oy + sample.image[i].y * vh,
  ];
  const visible = (i: number) => (sample.image[i]?.visibility ?? 0) > 0.5;
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#b6d889";
  ctx.shadowColor = "#99c267";
  ctx.shadowBlur = 5;
  for (const [a, b] of connections) {
    if (!visible(a) || !visible(b)) continue;
    ctx.beginPath();
    ctx.moveTo(...(pos(a) as [number, number]));
    ctx.lineTo(...(pos(b) as [number, number]));
    ctx.stroke();
  }
  const ids = new Set(connections.flat());
  for (const i of ids) {
    if (!visible(i)) continue;
    ctx.beginPath();
    ctx.arc(...(pos(i) as [number, number]), 3.4, 0, Math.PI * 2);
    ctx.fillStyle = "#d3edb0";
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}
function drawTimeline() {
  const [w, h] = canvasSize(timeline);
  if (!w || !h) return;
  const ctx = timelineContext;
  ctx.setTransform(timeline.width / w, 0, 0, timeline.height / h, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const clip = player.clip,
    duration = clip?.duration ?? 6;
  ctx.font = "9px monospace";
  for (let i = 0; i <= 10; i++) {
    const x = (i * w) / 10;
    ctx.strokeStyle = "#343946";
    ctx.beginPath();
    ctx.moveTo(x, 23);
    ctx.lineTo(x, h);
    ctx.stroke();
    ctx.fillStyle = "#828b9e";
    ctx.fillText(
      `${((duration * i) / 10).toFixed(1)}s`,
      Math.min(x + 3, w - 30),
      12,
    );
  }
  const colors = ["#729dce", "#6ab8a1", "#d6b879", "#b190d2"];
  for (let row = 0; row < 4; row++) {
    const y = 26 + row * 26;
    ctx.fillStyle = colors[row] + "18";
    ctx.fillRect(0, y, w, 21);
    ctx.strokeStyle = "#303642";
    ctx.beginPath();
    ctx.moveTo(0, y + 24);
    ctx.lineTo(w, y + 24);
    ctx.stroke();
    if (clip) {
      const stride = Math.max(1, Math.ceil(clip.frames.length / 60));
      ctx.fillStyle = colors[row];
      for (let i = 0; i < clip.frames.length; i += stride) {
        const x = (clip.frames[i].time / duration) * w;
        ctx.save();
        ctx.translate(x, y + 10);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
      }
    }
  }
  const x = duration > 0 ? (player.time / duration) * w : 0;
  ctx.strokeStyle = "#f37e94";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, 18);
  ctx.lineTo(x, h);
  ctx.stroke();
  ctx.fillStyle = "#f37e94";
  ctx.beginPath();
  ctx.arc(x, 21, 4, 0, Math.PI * 2);
  ctx.fill();
}
clips.push(createDemo());
player.load(clips[0]);
renderLibrary();
updateControls();
let previous = performance.now();
function frame(now: number) {
  if (disposed) return;
  const dt = Math.min((now - previous) / 1000, 0.1);
  previous = now;
  try {
    const sample =
      source === "demo" ? demoSample(now / 1000) : capture.sample(now);
    if (sample !== undefined) {
      drawSkeleton(sample);
      if (sample) {
        const sampleDt = lastSample ? (now - lastSample) / 1000 : 1 / 30;
        lastSample = now;
        lastPoseAt = now;
        if (!liveReady) {
          liveReady = true;
          updateControls();
        }
        if (source === "camera") {
          const visibility = sample.image.filter(
            (p) => (p.visibility ?? 0) > 0.5,
          ).length;
          element("capture-caption").textContent =
            `${visibility}/33 articulations visibles`;
          element("capture-fps").textContent =
            `${Math.min(30, Math.round(1 / sampleDt))} FPS`;
        }
        if (!playback) {
          const pose = retarget.solve(sample, renderer.rig, sampleDt);
          if (pose) {
            renderer.apply(pose);
            if (recorder.recording && !recorder.add(pose, now)) stopRecording();
          }
        }
      }
    }
    if (source === "camera" && now - lastPoseAt > 750) {
      if (liveReady) {
        liveReady = false;
        updateControls();
      }
      element("capture-caption").textContent = "Corps perdu · pose maintenue";
      drawSkeleton(null);
    }
    if (recorder.recording) {
      element("record-time").textContent = timecode((now - recordStart) / 1000);
      if (now - recordStart > 300000) stopRecording();
    }
    if (playback) {
      const pose = player.update(dt);
      if (pose) renderer.apply(pose);
    }
    renderer.render();
    input("scrubber").max = String(player.clip?.duration ?? 6);
    input("scrubber").value = String(player.time);
    element("timecode").textContent =
      `${timecode(player.time)} / ${timecode(player.clip?.duration ?? 0)}`;
    element("timeline-name").textContent = recorder.recording
      ? "Enregistrement…"
      : (player.clip?.name ?? "Aucun clip");
    button("play").textContent = player.playing ? "Ⅱ" : "▶";
    drawTimeline();
  } catch (error) {
    capture.stop();
    source = "demo";
    if (recorder.recording) stopRecording();
    useDemo();
    status(
      `Capture interrompue : ${error instanceof Error ? error.message : String(error)}. Retour au mode démo.`,
      true,
    );
  }
  frameId = requestAnimationFrame(frame);
}
frameId = requestAnimationFrame(frame);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (recorder.recording) stopRecording();
    capture.stop();
    source = "demo";
    player.playing = false;
    liveReady = false;
    useDemo();
    status(
      "Caméra arrêtée au passage en arrière-plan. Réactivez-la pour reprendre.",
    );
  }
});
window.addEventListener("pagehide", () => {
  disposed = true;
  cancelAnimationFrame(frameId);
  void capture.dispose();
  renderer.dispose();
});
