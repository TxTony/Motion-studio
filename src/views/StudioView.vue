<!-- Compose la page Studio à partir des projections et intentions, sans règle de capture ni de clip. -->
<script setup lang="ts">
import StudioPanel from "../components/core/StudioPanel.vue";
import StudioButton from "../components/core/StudioButton.vue";
import CapturePanel from "../components/domain/CapturePanel.vue";
import Scene3DViewer from "../components/domain/Scene3DViewer.vue";
import CharacterPanel from "../components/domain/CharacterPanel.vue";
import RecordingPanel from "../components/domain/RecordingPanel.vue";
import RetargetingPanel from "../components/domain/RetargetingPanel.vue";
import AnimationTimeline from "../components/domain/AnimationTimeline.vue";
import AnimationLibrary from "../components/domain/AnimationLibrary.vue";
import AnimationFilesPanel from "../components/domain/AnimationFilesPanel.vue";
import { useStudioSession } from "../composables/useStudioSession";
const {
  state,
  commands,
  bindVideo,
  bindRenderer,
  initializationError,
  failInitialization,
} = useStudioSession();
</script>
<template>
  <header class="topbar">
    <a class="brand" href="#" aria-label="Goblin Motion Studio"
      ><span class="brand-mark">G<span>•</span></span
      ><span
        >GOBLIN <b>MOTION STUDIO</b
        ><small>LE MOUVEMENT DEVIENT PERSONNAGE</small></span
      ></a
    >
    <nav aria-label="Espaces du studio">
      <a href="#workspace" class="active">◉ <span>Capture</span></a
      ><a href="#library">▤ <span>Bibliothèque</span></a
      ><a href="#character">♙ <span>Personnage</span></a>
    </nav>
    <span class="version">POC <b>v0.1</b></span>
  </header>
  <main>
    <div class="workspace-heading">
      <div>
        <span class="eyebrow">VOTRE ATELIER DE MOTION CAPTURE</span>
        <h1>Donnez vie à vos idées<span>.</span></h1>
      </div>
      <span class="local-badge">◈ Traitement sur votre appareil</span>
    </div>
    <section id="workspace" class="workspace">
      <CapturePanel
        :state="state"
        @video-ready="bindVideo"
        @camera="commands.startCamera"
        @demo="commands.useDemo"
        @facing="commands.configure({ facing: $event })"
      />
      <StudioPanel
        id="character"
        title="Scène 3D"
        icon="◇"
        class="character-panel"
      >
        <template #actions
          ><div class="scene-actions">
            <span class="live-label">{{
              state?.mode === "playback" ? "LECTURE DU CLIP" : "TEMPS RÉEL"
            }}</span><StudioButton
              variant="icon"
              title="Recentrer la caméra 3D"
              aria-label="Recentrer la caméra 3D"
              @click="commands.resetView"
              >⛶</StudioButton
            >
          </div></template
        >
        <Scene3DViewer
          :name="state?.characterName ?? 'Gobelin mécano'"
          :kind="state?.characterKind ?? 'Rig procédural · 11 articulations'"
          @ready="bindRenderer"
          @error="failInitialization"
        />
      </StudioPanel>
      <aside v-if="state" class="inspector">
        <CharacterPanel
          :name="state.characterName"
          :kind="state.characterKind"
          :disabled="state.recording || state.busy"
          @import="commands.importGlb"
        />
        <RecordingPanel
          :state="state"
          @configure="commands.configure"
          @record="commands.startRecording"
          @stop="commands.stopRecording"
        />
        <RetargetingPanel
          :smoothing="state.smoothing"
          :disabled="false"
          @smoothing="commands.configure({ smoothing: $event })"
          @calibrate="commands.calibrate"
        />
      </aside>
    </section>
    <template v-if="state">
      <AnimationTimeline
        :state="state"
        @rewind="commands.rewind"
        @play="commands.togglePlay"
        @loop="commands.toggleLoop"
        @speed="commands.setSpeed"
        @seek="commands.seek"
      />
      <div class="bottom-grid">
        <AnimationLibrary
          :clips="state.clips"
          :selected="state.selectedClip"
          :disabled="state.recording || state.busy"
          @select="commands.selectClip"
          @create="commands.live"
        /><AnimationFilesPanel
          :disabled="state.recording || state.busy"
          :can-export="!!state.selectedClip"
          @export="commands.exportJson"
          @import="commands.importJson"
        />
      </div>
    </template>
    <div
      class="status-bar"
      :class="{ error: !!initializationError || state?.status.error }"
      role="status"
      aria-live="polite"
    >
      {{
        initializationError ||
        state?.status.message ||
        "Initialisation du studio…"
      }}
    </div>
    <footer>
      <span><i></i> GOBLIN MOTION STUDIO <b>/</b> ATELIER EXPÉRIMENTAL</span
      ><span>Sans compte. Sans serveur. À vous de jouer.</span>
    </footer>
  </main>
</template>
