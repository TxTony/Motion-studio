/** Structure et présentation du studio ; les commandes sont raccordées dans main.ts. */
export function mountStudio(container: HTMLElement) {
  container.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#" aria-label="Goblin Motion Studio"><span class="brand-mark">G<span>•</span></span><span>GOBLIN <b>MOTION STUDIO</b><small>LE MOUVEMENT DEVIENT PERSONNAGE</small></span></a>
      <nav aria-label="Espaces du studio"><a href="#workspace" class="active">◉ <span>Capture</span></a><a href="#library">▤ <span>Bibliothèque</span></a><a href="#character">♙ <span>Personnage</span></a></nav>
      <span class="version">POC <b>v0.1</b></span>
    </header>
    <main>
      <div class="workspace-heading"><div><span class="eyebrow">VOTRE ATELIER DE MOTION CAPTURE</span><h1>Donnez vie à vos idées<span>.</span></h1></div><span class="local-badge">◈ Traitement sur votre appareil</span></div>
      <section id="workspace" class="workspace">
        <article class="panel capture-panel">
          <div class="panel-head"><h2><span class="panel-icon">◉</span> Capture humaine</h2><span class="tag">MEDIAPIPE</span></div>
          <div class="capture-viewport" id="capture-view">
            <video id="video" playsinline muted></video><canvas id="overlay" aria-label="Articulations détectées"></canvas>
            <div class="viewport-badge"><i></i><span id="source-badge">DÉMONSTRATION</span></div>
            <div class="capture-caption"><span id="capture-caption">Source synthétique · aucune caméra active</span><span id="capture-fps">30 FPS</span></div>
            <div class="frame-corner tl"></div><div class="frame-corner tr"></div><div class="frame-corner bl"></div><div class="frame-corner br"></div>
          </div>
          <div class="capture-settings"><label for="camera-facing">Source caméra</label><select id="camera-facing"><option value="user">Caméra avant</option><option value="environment">Caméra arrière</option></select><div class="button-row"><button id="camera-start" class="primary">◉ Activer la caméra</button><button id="demo" class="subtle" title="Revenir à la source synthétique">Démo</button></div><p class="hint">Cadrez le corps entier, à 2–3 mètres. Gardez les articulations visibles.</p></div>
        </article>
        <article id="character" class="panel character-panel">
          <div class="panel-head"><h2><span class="panel-icon">◇</span> Scène 3D</h2><div class="scene-actions"><span class="live-label" id="render-mode">TEMPS RÉEL</span><button id="reset-view" class="icon-button" title="Recentrer la caméra 3D" aria-label="Recentrer la caméra 3D">⛶</button></div></div>
          <div id="renderer"><div class="scene-meta"><span class="scene-name">GOBELIN MÉCANO</span><span id="model-kind">Rig procédural · 11 articulations</span></div><div class="scene-help">Glisser pour orbiter <span>·</span> Pincer pour zoomer</div><span class="axis-mark"><b>Y</b><span>Z ◇ X</span></span></div>
        </article>
        <aside class="inspector">
          <section class="panel"><div class="panel-head"><h2>Personnage</h2><span class="tag">RIG</span></div><div class="inspector-body"><div class="character-card"><span class="avatar">♙</span><div><strong id="character-name">Gobelin mécano</strong><small id="rig-name">goblin-procedural</small></div><span class="green-text">●</span></div><label class="file-button" for="glb-import">＋ Importer un personnage GLB</label><input type="file" id="glb-import" accept=".glb" hidden /><p class="hint">Rig compatible requis. <a href="https://github.com/TxTony/Motion-studio#personnage-interchangeable" target="_blank" rel="noreferrer">Contrat des articulations ↗</a></p></div></section>
          <section class="panel"><div class="panel-head"><h2>Animation</h2><span class="tag">CLIP</span></div><div class="inspector-body"><label for="clip-name">Nom de la capture</label><input id="clip-name" value="Capture_01" maxlength="80" /><div class="record-status"><i id="record-dot"></i><span id="record-state">Prêt à enregistrer</span><time id="record-time">00:00.00</time></div><div class="button-row"><button id="record" class="record-button">● Enregistrer</button><button id="stop" class="icon-button" disabled title="Arrêter l’enregistrement" aria-label="Arrêter l’enregistrement">■</button></div><label for="record-fps">Fréquence d’échantillonnage maximale</label><select id="record-fps"><option value="30">30 images / seconde</option><option value="15">15 images / seconde</option></select><label class="check-label"><input type="checkbox" id="capture-root" /> Capturer le déplacement 2D</label></div></section>
          <section class="panel"><div class="panel-head"><h2>Retargeting</h2></div><div class="inspector-body"><label for="smoothing">Lissage <output id="smoothing-value">120 ms</output></label><input id="smoothing" type="range" min="0" max="400" step="10" value="120" /><div class="range-labels"><span>Réactif</span><span>Fluide</span></div><button id="calibrate" class="subtle full-width">Recentrer le déplacement</button></div></section>
        </aside>
      </section>
      <section class="panel timeline-panel" aria-label="Timeline de l’animation">
        <div class="timeline-toolbar"><div><h2>Timeline <span id="timeline-name">Démo · Atelier</span></h2><small id="timeline-info">Déplacez la tête de lecture pour explorer le clip</small></div><div class="transport"><button id="rewind" class="icon-button" title="Revenir au début" aria-label="Revenir au début">Ⅰ◀</button><button id="play" class="primary play-button" aria-label="Lire le clip">▶</button><button id="loop" class="icon-button selected" aria-pressed="true" title="Lecture en boucle" aria-label="Lecture en boucle">↻</button><select id="speed" aria-label="Vitesse de lecture"><option value="0.5">0,5×</option><option value="1" selected>1×</option><option value="2">2×</option></select><span class="timecode" id="timecode">00:00.00 / 00:06.00</span></div></div>
        <div class="timeline-content"><div class="track-labels"><span>PISTES</span><span><i class="track-dot root"></i> Root</span><span><i class="track-dot spine"></i> Colonne</span><span><i class="track-dot arms"></i> Bras G / D</span><span><i class="track-dot legs"></i> Jambes G / D</span></div><div class="tracks"><canvas id="timeline-canvas" aria-hidden="true"></canvas><input id="scrubber" type="range" min="0" max="6" step="0.001" value="0" aria-label="Position de la tête de lecture en secondes" /></div></div>
      </section>
      <div class="bottom-grid"><section id="library" class="panel library-panel"><div class="panel-head"><h2>Bibliothèque d’animations <span id="clip-count">1</span></h2><span class="tag">SESSION LOCALE</span></div><div id="clips" class="clips"></div></section><section class="panel export-panel"><div class="panel-head"><h2>Export & import</h2><span class="tag">JSON v1</span></div><div class="inspector-body"><p class="hint">Sauvegardez les rotations et la timeline. Vos vidéos restent sur votre appareil.</p><div class="button-row"><button id="export" class="primary">⇩ Exporter le clip</button><label for="json-import" class="file-button">Importer</label><input id="json-import" type="file" accept=".json,application/json" hidden /></div></div></section></div>
      <div id="status" class="status-bar" role="status" aria-live="polite">Mode démo actif. Activez votre caméra pour capturer vos propres mouvements.</div>
      <footer><span><i></i> GOBLIN MOTION STUDIO <b>/</b> ATELIER EXPÉRIMENTAL</span><span>Sans compte. Sans serveur. À vous de jouer.</span></footer>
    </main>`;
}
export function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const result = document.getElementById(id);
  if (!result) throw new Error(`Élément absent : ${id}`);
  return result as T;
}
export function timecode(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${(seconds % 60).toFixed(2).padStart(5, "0")}`;
}
