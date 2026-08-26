const STORAGE_KEY = "pseudoquest-progress";
const XP_BADGES = [
  { xp: 100, id: "xp-100", icon: "◉", name: "Primera señal recuperada" },
  { xp: 250, id: "xp-250", icon: "⌁", name: "Cartógrafo del archivo" },
  { xp: 500, id: "xp-500", icon: "⎈", name: "Operador del núcleo" },
  { xp: 1000, id: "xp-1000", icon: "✦", name: "Restaurador de sistemas" },
  { xp: 2500, id: "xp-2500", icon: "⬡", name: "Arquitecto de Kepler" },
];
const DEFAULT = {
  xp: 0,
  completed: [],
  badges: [],
  bestScores: {},
  missionXp: {},
  profile: null,
  streak: 1,
  lastVisit: "",
  sound: true,
  soundVolume: 1,
  musicVolume: 0.35,
};
const clean = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);
function normalize(raw = {}) {
  const value = { ...DEFAULT, ...raw };
  value.xp = Math.max(0, Number(value.xp) || 0);
  value.completed = Array.isArray(value.completed)
    ? [...new Set(value.completed)]
    : [];
  value.badges = Array.isArray(value.badges) ? [...new Set(value.badges)] : [];
  value.bestScores =
    value.bestScores && typeof value.bestScores === "object"
      ? value.bestScores
      : {};
  value.missionXp =
    value.missionXp && typeof value.missionXp === "object"
      ? value.missionXp
      : {};
  value.profile =
    value.profile && clean(value.profile.name) && clean(value.profile.alias)
      ? { name: clean(value.profile.name), alias: clean(value.profile.alias) }
      : null;
  value.completed.forEach((id) => {
    if (value.missionXp[id] == null) value.missionXp[id] = 20;
    if (value.bestScores[id] == null) value.bestScores[id] = 4;
  });
  return value;
}
function read() {
  try {
    const value = normalize(
      JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"),
    );
    value.musicVolume = Math.min(1, Math.max(0, Number(value.musicVolume)));
    value.soundVolume = Math.min(1, Math.max(0, Number(value.soundVolume)));
    if (!Number.isFinite(value.musicVolume)) value.musicVolume = 0.35;
    if (!Number.isFinite(value.soundVolume)) value.soundVolume = 1;
    return value;
  } catch {
    return normalize();
  }
}
function save(input) {
  const state = normalize(input),
    before = read().badges,
    earned = XP_BADGES.filter((b) => state.xp >= b.xp);
  state.badges = [...new Set([...before, ...earned.map((b) => b.id)])];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  dispatchEvent(new Event("pq:update"));
  earned
    .filter((b) => !before.includes(b.id))
    .forEach((badge, index) =>
      setTimeout(
        () => dispatchEvent(new CustomEvent("pq:badge", { detail: badge })),
        index * 900,
      ),
    );
  return state;
}
function reset() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("kepler-intro-seen");
  location.href = window.PQ_BASE || "/";
}
let audioContext,
  ambientGain,
  ambientStarted = false;
function startAmbient() {
  // No continuous ambience: KeplerCode only plays intentional interaction cues.
  return;
}
function setAmbientVolume(value) {
  if (!ambientGain) return;
  ambientGain.gain.cancelScheduledValues(audioContext.currentTime);
  ambientGain.gain.linearRampToValueAtTime(
    0.045 * value,
    audioContext.currentTime + 0.8,
  );
}
function tone(kind = "ok") {
  const audioState = read();
  if (!audioState.sound || !audioState.soundVolume || !window.AudioContext)
    return;
  audioContext = audioContext || new AudioContext();
  if (audioContext.state === "suspended") audioContext.resume();
  const notes =
      kind === "bad"
        ? [190, 150]
        : kind === "win"
          ? [440, 554, 660, 880]
          : [440, 580],
    start = audioContext.currentTime;
  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator(),
      gain = audioContext.createGain(),
      time = start + index * 0.085;
    oscillator.type = kind === "bad" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(
      0.055 * audioState.soundVolume,
      time + 0.015,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.18);
  });
}
function toast(message) {
  const el = document.querySelector("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}
window.PQ = { read, save, reset, tone, toast, badges: XP_BADGES };
const today = new Date().toISOString().slice(0, 10),
  initial = read();
if (initial.lastVisit !== today) {
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  initial.streak = initial.lastVisit === yesterday ? initial.streak + 1 : 1;
  initial.lastVisit = today;
  save(initial);
}
function paint() {
  const state = read();
  document
    .querySelectorAll("[data-xp]")
    .forEach((el) => (el.textContent = state.xp));
  document
    .querySelectorAll("[data-streak]")
    .forEach((el) => (el.textContent = state.streak));
  document
    .querySelectorAll("[data-profile-alias]")
    .forEach(
      (el) => (el.textContent = state.profile?.alias || "Reconstructor"),
    );
  const sound = document.querySelector("#sound-toggle");
  if (sound) {
    const audible = state.sound && state.soundVolume > 0;
    sound.textContent = audible ? "🔊" : "🔇";
    sound.setAttribute("aria-pressed", String(audible));
    sound.title = "Controles de audio";
  }
}
paint();
addEventListener("pq:update", paint);
addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) dispatchEvent(new Event("pq:update"));
});
addEventListener(
  "pointerdown",
  () => {
    startAmbient();
    if (audioContext?.state === "suspended") audioContext.resume();
  },
  { once: true },
);
const themeToggle = document.querySelector("#theme-toggle");
function paintTheme() {
  const dark = document.documentElement.dataset.theme === "dark";
  if (themeToggle) {
    themeToggle.textContent = dark ? "☀" : "◐";
    themeToggle.title = dark
      ? "Activar órbita diurna"
      : "Activar órbita nocturna";
    themeToggle.setAttribute("aria-label", themeToggle.title);
  }
}
paintTheme();
themeToggle?.addEventListener("click", () => {
  const root = document.documentElement,
    next = root.dataset.theme === "dark" ? "light" : "dark";
  root.classList.remove("theme-transit");
  void root.offsetWidth;
  root.classList.add("theme-transit");
  root.dataset.theme = next;
  localStorage.setItem("pq-theme", next);
  paintTheme();
  tone("ok");
  setTimeout(() => root.classList.remove("theme-transit"), 1500);
});
const audioModal = document.querySelector("#audio-modal"),
  soundRange = document.querySelector("#sound-volume"),
  musicRange = document.querySelector("#music-volume-global"),
  nextTrack = document.querySelector("#music-next-global");
function paintAudio() {
  if (!audioModal) return;
  const state = read();
  soundRange.value = String(
    Math.round((state.sound ? state.soundVolume : 0) * 100),
  );
  musicRange.value = String(Math.round(state.musicVolume * 100));
  audioModal.querySelector("[data-sound-output]").textContent =
    soundRange.value + "%";
  audioModal.querySelector("[data-music-output]").textContent =
    musicRange.value + "%";
  nextTrack.disabled = true;
  audioModal.querySelector("[data-audio-note]").textContent =
    "Sin sonido ambiental continuo. Solo se reproducen señales de interacción.";
}
document.querySelector("#sound-toggle")?.addEventListener("click", () => {
  startAmbient();
  paintAudio();
  audioModal?.showModal();
});
document
  .querySelector("#audio-close")
  ?.addEventListener("click", () => audioModal?.close());
audioModal?.addEventListener("click", (event) => {
  if (event.target === audioModal) audioModal.close();
});
soundRange?.addEventListener("input", () => {
  const state = read();
  state.soundVolume = Number(soundRange.value) / 100;
  state.sound = state.soundVolume > 0;
  save(state);
  paintAudio();
});
musicRange?.addEventListener("input", () => {
  const state = read();
  state.musicVolume = Number(musicRange.value) / 100;
  save(state);
  startAmbient();
  setAmbientVolume(state.musicVolume);
  dispatchEvent(
    new CustomEvent("pq:music-volume", { detail: state.musicVolume }),
  );
  paintAudio();
});
document.querySelector("#audio-mute")?.addEventListener("click", () => {
  const state = read();
  state.sound = false;
  state.soundVolume = 0;
  state.musicVolume = 0;
  save(state);
  setAmbientVolume(0);
  dispatchEvent(new CustomEvent("pq:music-volume", { detail: 0 }));
  paintAudio();
  toast("Audio silenciado");
});
nextTrack?.addEventListener("click", () =>
  dispatchEvent(new Event("pq:music-next")),
);
addEventListener("pq:music-state", paintAudio);
const setup = document.querySelector("#profile-setup"),
  welcome = document.querySelector("#profile-welcome");
setup?.addEventListener("cancel", (event) => event.preventDefault());
document.querySelector("#profile-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget),
    name = clean(data.get("name")),
    alias = clean(data.get("alias"));
  if (name.length < 2 || alias.length < 2) {
    toast("Escribe un nombre y un alias de al menos 2 caracteres");
    return;
  }
  const state = read();
  if (state.profile) return;
  state.profile = { name, alias };
  save(state);
  setup.close();
  tone("win");
  welcome.querySelector("[data-welcome-name]").textContent = name;
  welcome.querySelector("[data-welcome-alias]").textContent = alias;
  welcome.showModal();
});
const intro = document.querySelector("#kepler-intro"),
  introTitle = intro?.querySelector("[data-intro-title]"),
  introCopy = intro?.querySelector("[data-intro-copy]"),
  introBar = intro?.querySelector("[data-intro-progress]"),
  introChapter = intro?.querySelector("[data-intro-chapter]"),
  introStart = document.querySelector("#intro-start");
let introTimers = [],
  introFrames = [],
  introIndex = -1;
function introCue(kind = "signal") {
  const state = read();
  if (!state.sound || !state.soundVolume || !window.AudioContext) return;
  audioContext = audioContext || new AudioContext();
  const oscillator = audioContext.createOscillator(),
    gain = audioContext.createGain(),
    filter = audioContext.createBiquadFilter(),
    now = audioContext.currentTime;
  filter.type = "lowpass";
  filter.frequency.value = kind === "launch" ? 1200 : 720;
  oscillator.type = kind === "warning" ? "sawtooth" : "sine";
  oscillator.frequency.setValueAtTime(
    kind === "launch" ? 90 : kind === "wake" ? 220 : 150,
    now,
  );
  oscillator.frequency.exponentialRampToValueAtTime(
    kind === "launch" ? 540 : kind === "warning" ? 105 : 330,
    now + 0.55,
  );
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045 * state.soundVolume, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
  oscillator.connect(filter).connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.72);
}
function finishIntro() {
  introTimers.forEach(clearTimeout);
  introTimers = [];
  localStorage.setItem("kepler-intro-seen", "1");
  intro?.close();
  if (!read().profile) setup?.showModal();
}
function scheduleIntroAdvance() {
  introTimers.forEach(clearTimeout);
  introTimers = [setTimeout(advanceIntro, 7500)];
}
function advanceIntro() {
  if (!intro?.open || !introFrames.length) return;
  if (introIndex >= introFrames.length - 1) return;
  introIndex += 1;
  const frame = introFrames[introIndex],
    consoleEl = intro.querySelector(".intro-console");
  consoleEl.classList.remove("frame-shift");
  void consoleEl.offsetWidth;
  consoleEl.classList.add("frame-shift");
  intro.dataset.scene = frame.scene;
  introChapter.textContent = frame.chapter;
  introTitle.textContent = frame.title;
  introCopy.textContent = frame.copy;
  introBar.style.width = `${((introIndex + 1) / introFrames.length) * 100}%`;
  introCue(frame.cue);
  if (introIndex === introFrames.length - 1) {
    introTimers.forEach(clearTimeout);
    introTimers = [];
    introStart.hidden = false;
    tone("win");
  } else scheduleIntroAdvance();
}
function runIntro() {
  if (!intro || intro.open) return;
  introTimers.forEach(clearTimeout);
  introTimers = [];
  const state = read(),
    alias = state.profile?.alias || "Reconstructor",
    reduced = matchMedia("(prefers-reduced-motion: reduce)").matches,
    frames = [
      {
        scene: "earth",
        chapter: "01 // TIERRA",
        title: "La última noche en la Tierra",
        copy: "Año 2187. El clima y las redes que sostenían a la civilización colapsaron.\nLa humanidad preparó una última salida.",
        cue: "warning",
      },
      {
        scene: "exodus",
        chapter: "02 // ÉXODO",
        title: "Destino: Kepler-22b",
        copy: "Las naves arca abandonaron la órbita terrestre rumbo a Kepler-22b, un mundo distante capaz de albergar una nueva colonia.",
        cue: "launch",
      },
      {
        scene: "voyage",
        chapter: "03 // TRAVESÍA",
        title: "Más allá del sistema solar",
        copy: "La ruta cruzaría más de seiscientos años luz. Para sobrevivir al viaje, la tripulación entró en ciclos prolongados de hibernación.",
        cue: "launch",
      },
      {
        scene: "cryo",
        chapter: "04 // HIBERNACIÓN",
        title: "Mientras dormíamos",
        copy: "Generaciones despertaron por turnos para custodiar la nave. La mayoría jamás vio las estrellas que atravesamos.",
        cue: "signal",
      },
      {
        scene: "damage",
        chapter: "05 // ARCHIVO DAÑADO",
        title: "El conocimiento comenzó a desaparecer",
        copy: "Radiación, fallos de memoria y décadas de reparaciones fragmentaron los archivos. Algoritmos esenciales quedaron incompletos.",
        cue: "warning",
      },
      {
        scene: "arrival",
        chapter: "06 // KEPLER-22B",
        title: "Despertamos bajo otro sol",
        copy: "La colonia llegó a Kepler-22b y levantó sus primeros sistemas con tecnología heredada. Pero las máquinas empezaron a fallar.",
        cue: "wake",
      },
      {
        scene: "assignment",
        chapter: "07 // ASIGNACIÓN",
        title: `Reconstructor ${alias}`,
        copy: "Tu firma ha sido autorizada. Recuperarás los algoritmos dañados desde sus fundamentos: lógica, decisiones y repetición.\nEl futuro de Kepler comienza contigo.",
        cue: "wake",
      },
    ];
  intro.dataset.scene = "boot";
  introTitle.textContent = "Inicializando memoria de misión...";
  introCopy.textContent = "Sincronizando registros de la nave arca";
  introChapter.textContent = "00 // BOOT";
  introBar.style.width = "3%";
  introStart.hidden = true;
  intro.showModal();
  startAmbient();
  introCue("signal");
  introFrames = frames;
  introIndex = -1;
  if (reduced) {
    introIndex = frames.length - 2;
    advanceIntro();
  } else {
    introTimers = [setTimeout(advanceIntro, 700)];
  }
}
addEventListener("keydown", (event) => {
  if (!intro?.open || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.key === "Escape") return;
  event.preventDefault();
  if (introIndex === introFrames.length - 1) finishIntro();
  else advanceIntro();
});
document.querySelector("#intro-skip")?.addEventListener("click", finishIntro);
introStart?.addEventListener("click", () => {
  tone("win");
  finishIntro();
});
document
  .querySelectorAll("[data-replay-intro]")
  .forEach((button) => button.addEventListener("click", runIntro));
intro?.addEventListener("cancel", (event) => {
  event.preventDefault();
  finishIntro();
});
document.querySelector("#welcome-enter")?.addEventListener("click", () => {
  welcome?.close();
  tone("win");
  toast("BIENVENIDO A KEPLERCODE");
});
if (!localStorage.getItem("kepler-intro-seen")) runIntro();
else if (!read().profile) setup?.showModal();
const versionModal = document.querySelector("#version-modal");
let versionScrollY = 0;
document.querySelector("#version-open")?.addEventListener("click", () => {
  versionScrollY = scrollY;
  versionModal?.showModal();
  requestAnimationFrame(() =>
    scrollTo({ top: versionScrollY, behavior: "auto" }),
  );
});
document
  .querySelector("#version-close")
  ?.addEventListener("click", () => versionModal?.close());
versionModal?.addEventListener("click", (event) => {
  if (event.target === versionModal) versionModal.close();
});
versionModal?.addEventListener("close", () =>
  requestAnimationFrame(() =>
    scrollTo({ top: versionScrollY, behavior: "auto" }),
  ),
);
const progressModal = document.querySelector("#progress-modal");
function progressSummary() {
  if (!progressModal) return;
  const state = read(),
    next = XP_BADGES.find((b) => state.xp < b.xp);
  progressModal.querySelector("[data-modal-alias]").textContent =
    state.profile?.alias || "Aventurero";
  progressModal.querySelector("[data-modal-xp]").textContent = state.xp;
  progressModal.querySelector("[data-modal-completed]").textContent =
    state.completed.length;
  progressModal.querySelector("[data-modal-badges]").textContent =
    XP_BADGES.filter((b) => state.xp >= b.xp).length;
  progressModal.querySelector("[data-modal-next]").textContent = next
    ? `${next.xp - state.xp} XP para ${next.name}`
    : "Todas las insignias desbloqueadas";
  progressModal.querySelector("[data-modal-bar]").style.width =
    `${Math.min(100, (state.completed.length / 15) * 100)}%`;
}
document.querySelector("#progress-open")?.addEventListener("click", () => {
  progressSummary();
  progressModal?.showModal();
});
document
  .querySelector("#progress-close")
  ?.addEventListener("click", () => progressModal?.close());
progressModal?.addEventListener("click", (event) => {
  if (event.target === progressModal) progressModal.close();
});
addEventListener("pq:update", progressSummary);
addEventListener("pq:badge", (event) => {
  const pop = document.querySelector("#badge-unlock");
  if (!pop) return;
  pop.querySelector("span").textContent = event.detail.icon;
  pop.querySelector("b").textContent = event.detail.name;
  pop.querySelector("small:last-child").textContent =
    `Insignia de ${event.detail.xp} XP`;
  pop.classList.remove("show");
  void pop.offsetWidth;
  pop.classList.add("show");
  tone("win");
  setTimeout(() => pop.classList.remove("show"), 4200);
});
dispatchEvent(new Event("pq:ready"));
