const INITIAL_SYMPATHY = 35;
const INITIAL_TRUST = 30;
const MAX_CHOICES = 6;

const dialogueSteps = [
  {
    line: "Ты всегда такой уверенный?",
    answers: [
      ["Только по выходным.", "Она сдерживает улыбку.", 8, 4],
      ["А тебе не нравится?", "Alice смотрит внимательнее.", 6, 2],
      ["[Улыбнуться]", "Она отвечает улыбкой.", 5, 7],
    ],
  },
  {
    line: "Alice немного приближается.",
    answers: [
      ["[Подойти ближе]", "Она остаётся рядом.", 8, 5],
      ["[Остаться на месте]", "Ей нравится, что ты не спешишь.", 4, 9],
      ["Передумала убегать?", "Не переоценивай себя.", -7, -5, "bad"],
    ],
  },
  {
    line: "И что теперь?",
    answers: [
      ["Импровизируем.", "Звучит опасно. Продолжай.", 8, 4],
      ["[Протянуть руку]", "Alice осторожно касается ладони.", 6, 9],
      ["Решай сама.", "Она отступает на полшага.", -8, -7, "bad"],
    ],
  },
  {
    line: "Ты умеешь не торопиться?",
    answers: [
      ["Когда есть ради кого.", "Теперь она не скрывает улыбку.", 9, 5],
      ["[Замедлиться]", "Напряжение между вами тает.", 5, 10],
      ["Не люблю ждать.", "Alice становится холоднее.", -10, -9, "bad"],
    ],
  },
  {
    line: "Alice не отводит взгляд.",
    answers: [
      ["[Коснуться её руки]", "Она переплетает ваши пальцы.", 9, 8],
      ["Красивый момент.", "Не порть его словами.", 6, 5],
      ["[Отвести взгляд]", "Она даёт тебе пространство.", -2, 5],
    ],
  },
  {
    line: "Останешься ещё немного?",
    answers: [
      ["С удовольствием.", "Тогда иди за мной.", 9, 8],
      ["[Кивнуть]", "Alice берёт тебя за руку.", 6, 9],
      ["Если удивишь.", "Она отпускает твою руку.", -12, -10, "bad"],
    ],
  },
];

const stateNames = ["Distant", "Interested", "Flirting", "Intimate"];
const stateImages = [
  "assets/scene_distant.png",
  "assets/scene_interested.png",
  "assets/scene_flirting.png",
  "assets/scene_intimate.png",
];
const rhythmOptions = [
  { id: 1, name: "Slow", animation: "slow" },
  { id: 2, name: "Medium", animation: "medium" },
  { id: 3, name: "Fast", animation: "fast" },
];
const $ = (selector) => document.querySelector(selector);
const dialogue = $(".dialogue");
const dialogueText = $(".dialogue__text");
const hint = $(".scene-hint");
const answers = $(".answers");
const character = $(".character");
const characterState = $(".character__state");
const characterImages = [...document.querySelectorAll(".character__image")];
const interactionScene = $(".interactive-scene");
const interactionPhaseScene = $(".scene--interaction");
const afterScene = $(".after-scene");
const climaxScene = $(".climax-scene");
const ending = $(".ending");
const controls = $(".controls");
const reactionValue = $(".reaction-value");
const reactionFill = $(".reaction-meter__fill");
const reactionMeter = $(".reaction-meter");
const rhythmValue = $(".rhythm-value");
const rhythmDisplay = $(".rhythm-display");
const interactionPlaceholder = $(".interactive-placeholder");
const continueButton = $(".continue");
const restartButtons = document.querySelectorAll(".restart");
const earlyRestartButton = $(".restart--early");
const phaseLabel = $(".phase-label");
const debugToggle = $(".debug-toggle");
const debugPanel = $(".debug-panel");

let phase;
let sympathy;
let trust;
let intimacyTier;
let currentStep;
let badChoices;
let reaction;
let rhythm;
let interactionStep;
let lastReactionChange;
let interactionTimer;
let transitionTimer;
let rhythmTicks;
let rhythmStartedAt;
let switchBoost;
let epilogueStep;
let climaxTriggered;
let activeSceneImage = 0;
let displayedCharacterState = 1;

const epilogueLines = [
  ["Alice", "Вот теперь можно просто немного помолчать."],
  ["Player", "Я никуда не спешу."],
  ["Alice", "Хорошо. Тогда останься рядом."],
  ["Player", "Останусь."],
];

const clamp = (value) => Math.max(0, Math.min(100, value));

function calculateState() {
  const score = sympathy + trust;
  if (score >= 135) return 4;
  if (score >= 105) return 3;
  if (score >= 75) return 2;
  return 1;
}

function calculateTier() {
  const score = sympathy + trust;
  if (score >= 135) return "HIGH";
  if (score >= 100) return "MEDIUM";
  return "LOW";
}

function updateDebug() {
  debugPanel.textContent = [
    `machine state: ${phase}`,
    `climaxTriggered: ${climaxTriggered}`,
    `phase: ${phase}`,
    `sympathy: ${sympathy}`,
    `trust: ${trust}`,
    `intimacyTier: ${intimacyTier}`,
    `interaction step: ${interactionStep}`,
    `Reaction: ${reaction.toFixed(2)}`,
    `current Rhythm: ${rhythm.id} — ${rhythm.name.toUpperCase()}`,
    `time on current Rhythm: ${((Date.now() - rhythmStartedAt) / 1000).toFixed(1)}s`,
    `last Reaction change: ${lastReactionChange}`,
  ].join("\n");
}

function updateCharacter(change = 0) {
  const state = calculateState();
  character.className = `character character--state-${state}`;
  characterState.textContent = `State ${state} — ${stateNames[state - 1]}`;
  if (state !== displayedCharacterState) {
    const nextImage = activeSceneImage === 0 ? 1 : 0;
    characterImages[nextImage].src = stateImages[state - 1];
    characterImages[nextImage].classList.add("is-active");
    characterImages[activeSceneImage].classList.remove("is-active");
    activeSceneImage = nextImage;
    displayedCharacterState = state;
  }
  if (change) {
    void character.offsetWidth;
    character.classList.add(change > 0 ? "character--reaction-good" : "character--reaction-bad");
  }
}

function renderAnswers() {
  answers.replaceChildren();
  dialogueSteps[currentStep].answers.forEach(([label, reply, sympathyDelta, trustDelta, tag]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => chooseAnswer(reply, sympathyDelta, trustDelta, tag));
    answers.append(button);
  });
}

function chooseAnswer(reply, sympathyDelta, trustDelta, tag) {
  answers.replaceChildren();
  sympathy = clamp(sympathy + sympathyDelta);
  trust = clamp(trust + trustDelta);
  badChoices += tag === "bad" ? 1 : 0;
  currentStep += 1;
  dialogueText.textContent = reply;
  hint.textContent = "Alice реагирует на твой выбор";
  updateCharacter(sympathyDelta + trustDelta);
  updateDebug();

  if (badChoices >= 3 || sympathy + trust < 42) {
    transitionTimer = setTimeout(showEarlyEnding, 650);
  } else if (currentStep === MAX_CHOICES) {
    transitionTimer = setTimeout(startInteractivePhase, 700);
  } else {
    transitionTimer = setTimeout(() => {
      updateCharacter();
      dialogueText.textContent = dialogueSteps[currentStep].line;
      hint.textContent = "Выбери ответ или действие";
      renderAnswers();
    }, 650);
  }
}

function showEarlyEnding() {
  phase = "AFTER_SCENE (early)";
  interactionPhaseScene.hidden = true;
  afterScene.hidden = false;
  dialogue.classList.add("dialogue--after");
  phaseLabel.textContent = "After scene";
  dialogueText.textContent = "Думаю, на сегодня хватит.";
  hint.textContent = "Alice уходит, оставляя тишину.";
  earlyRestartButton.hidden = false;
  updateDebug();
}

function buildControls() {
  const container = $(".rhythm-controls");
  container.querySelectorAll("button").forEach((button) => button.remove());
  rhythmOptions.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${option.id} — ${option.name.toUpperCase()}`;
    button.dataset.rhythm = String(option.id);
    const unlocked = intimacyTier !== "LOW" || option.id < 3;
    button.disabled = !unlocked;
    button.title = unlocked ? `Rhythm ${option.id}: ${option.name}` : "Недоступно при LOW intimacy";
    button.addEventListener("click", () => setRhythm(option.id));
    container.append(button);
  });
  updateControlButtons();
}

function setRhythm(id) {
  if (phase !== "INTERACTIVE") return;
  const next = rhythmOptions[id - 1];
  const button = $(`.rhythm-controls button[data-rhythm="${id}"]`);
  if (!next || next === rhythm || button?.disabled) return;
  const oldRhythm = rhythm;
  rhythm = next;
  rhythmTicks = 0;
  rhythmStartedAt = Date.now();
  switchBoost = oldRhythm && Math.abs(oldRhythm.id - rhythm.id) === 1 ? 0.8 : 0.35;
  interactionStep += 1;
  if (reaction < 35 && rhythm.id === 3) dialogueText.textContent = "Не так быстро…";
  else if (reaction >= 65 && rhythm.id === 1) dialogueText.textContent = "Можно смелее.";
  else dialogueText.textContent = rhythm.id === 1 ? "Мне нравится эта пауза." : rhythm.id === 2 ? "Вот так, ровнее." : "Да. Теперь быстрее.";
  updateControlButtons();
  updateDebug();
}

function updateControlButtons() {
  const label = `${rhythm.id} — ${rhythm.name.toUpperCase()}`;
  rhythmValue.textContent = label;
  rhythmDisplay.textContent = `RHYTHM ${label}`;
  interactionPlaceholder.className = `interactive-placeholder rhythm--${rhythm.animation}`;
  document.querySelectorAll(".rhythm-controls button").forEach((button) => {
    const selected = Number(button.dataset.rhythm) === rhythm.id;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function reactionRate() {
  let rates;
  if (reaction < 35) rates = [1.55, 0.45, -1.15];
  else if (reaction < 65) rates = [0.35, 1.65, 0.9];
  else rates = [0.15, 0.75, 1.55];
  const repetitionPenalty = Math.max(0, rhythmTicks - 6) * 0.28;
  return rates[rhythm.id - 1] - repetitionPenalty + switchBoost;
}

function tickInteraction() {
  if (phase !== "INTERACTIVE") return;
  const oldReaction = reaction;
  const nextReaction = reaction + reactionRate();
  reaction = nextReaction >= 100 ? 100 : clamp(nextReaction);
  rhythmTicks += 1;
  switchBoost = Math.max(0, switchBoost - 0.2);
  // Do not show a rounded 100 before the actual value has reached the goal.
  reactionValue.textContent = reaction >= 100 ? "100" : String(Math.floor(reaction));
  reactionFill.style.width = `${reaction}%`;
  reactionMeter.setAttribute("aria-valuenow", reaction.toFixed(2));
  const delta = reaction - oldReaction;
  if (rhythmTicks === 7) dialogueText.textContent = delta > 0.4 ? "Ещё немного…" : "Смени ритм.";
  lastReactionChange = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`;
  if (reaction >= 100) {
    startClimax();
    return;
  }
  updateDebug();
  if (reaction >= 100) startClimax();
}

function startInteractivePhase() {
  phase = "INTERACTIVE";
  intimacyTier = calculateTier();
  interactionPhaseScene.hidden = true;
  interactionScene.hidden = false;
  answers.hidden = true;
  controls.hidden = false;
  phaseLabel.textContent = "Interactive";
  dialogueText.textContent = "Начни медленно. Я подскажу.";
  hint.textContent = "1 / 2 / 3 — меняй Rhythm, если Alice теряет интерес";
  buildControls();
  interactionTimer = setInterval(tickInteraction, 900);
  tickInteraction();
}

function startClimax() {
  if (phase !== "INTERACTIVE" || climaxTriggered) return;
  climaxTriggered = true;
  clearInterval(interactionTimer);
  interactionTimer = null;
  reaction = 100;
  reactionValue.textContent = "100";
  reactionFill.style.width = "100%";
  reactionMeter.setAttribute("aria-valuenow", "100");
  phase = "CLIMAX";
  document.querySelectorAll(".rhythm-controls button").forEach((button) => {
    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
  });
  controls.hidden = true;
  interactionScene.hidden = true;
  climaxScene.hidden = false;
  phaseLabel.textContent = "Climax";
  dialogueText.textContent = "Alice замирает, а затем тихо выдыхает.";
  hint.textContent = "CLIMAX ANIMATION PLACEHOLDER";
  updateDebug();
  transitionTimer = setTimeout(startAfterScene, 1600);
}

function startAfterScene() {
  if (phase !== "CLIMAX") return;
  clearTimeout(transitionTimer);
  phase = "AFTER_SCENE";
  climaxScene.hidden = true;
  afterScene.hidden = false;
  dialogue.classList.add("dialogue--after");
  phaseLabel.textContent = "After scene";
  epilogueStep = 0;
  renderEpilogueLine();
  continueButton.hidden = false;
  updateDebug();
}

function renderEpilogueLine() {
  const [speaker, line] = epilogueLines[epilogueStep];
  $(".dialogue__name").textContent = speaker;
  dialogueText.textContent = line;
  hint.textContent = epilogueStep === epilogueLines.length - 1 ? "Нажми, чтобы завершить" : "Нажми, чтобы продолжить";
}

function advanceEpilogue() {
  if (phase === "CLIMAX") return startAfterScene();
  if (phase !== "AFTER_SCENE") return;
  epilogueStep += 1;
  if (epilogueStep < epilogueLines.length) {
    renderEpilogueLine();
    updateDebug();
  } else showEnding();
}

function showEnding() {
  phase = "ENDING";
  afterScene.hidden = true;
  dialogue.hidden = true;
  ending.hidden = false;
  phaseLabel.textContent = "Ending";
  updateDebug();
}

function restartGame() {
  clearInterval(interactionTimer);
  clearTimeout(transitionTimer);
  phase = "INTERACTION";
  sympathy = INITIAL_SYMPATHY;
  trust = INITIAL_TRUST;
  intimacyTier = "PENDING";
  currentStep = 0;
  badChoices = 0;
  reaction = 18;
  reactionValue.textContent = "18";
  reactionFill.style.width = "18%";
  reactionMeter.setAttribute("aria-valuenow", "18");
  rhythm = rhythmOptions[0];
  interactionStep = 0;
  rhythmTicks = 0;
  rhythmStartedAt = Date.now();
  switchBoost = 0;
  epilogueStep = 0;
  climaxTriggered = false;
  lastReactionChange = "+0.0";
  displayedCharacterState = 1;
  activeSceneImage = 0;
  characterImages[0].src = stateImages[0];
  characterImages[0].classList.add("is-active");
  characterImages[1].classList.remove("is-active");
  interactionPhaseScene.hidden = false;
  interactionScene.hidden = true;
  afterScene.hidden = true;
  climaxScene.hidden = true;
  ending.hidden = true;
  dialogue.hidden = false;
  controls.hidden = true;
  answers.hidden = false;
  earlyRestartButton.hidden = true;
  continueButton.hidden = true;
  dialogue.classList.remove("dialogue--after");
  phaseLabel.textContent = "Interaction";
  $(".dialogue__name").textContent = "Alice";
  dialogueText.textContent = dialogueSteps[0].line;
  hint.textContent = "Выбери ответ или действие";
  updateCharacter();
  renderAnswers();
  updateDebug();
}

restartButtons.forEach((button) => button.addEventListener("click", restartGame));
continueButton.addEventListener("click", (event) => {
  event.stopPropagation();
  advanceEpilogue();
});
dialogue.addEventListener("click", advanceEpilogue);
climaxScene.addEventListener("click", advanceEpilogue);
document.addEventListener("keydown", (event) => {
  if (phase !== "INTERACTIVE" || event.repeat || !["1", "2", "3"].includes(event.key)) return;
  setRhythm(Number(event.key));
});
debugToggle.addEventListener("click", () => {
  debugPanel.hidden = !debugPanel.hidden;
  debugToggle.setAttribute("aria-expanded", String(!debugPanel.hidden));
});

restartGame();
