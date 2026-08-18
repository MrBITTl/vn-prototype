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
const speedOptions = ["Slow", "Medium", "Fast"];
const intensityOptions = ["Soft", "Normal", "Intense"];
const $ = (selector) => document.querySelector(selector);
const dialogue = $(".dialogue");
const dialogueText = $(".dialogue__text");
const hint = $(".scene-hint");
const answers = $(".answers");
const character = $(".character");
const characterState = $(".character__state");
const interactionScene = $(".interactive-scene");
const interactionPhaseScene = $(".scene--interaction");
const afterScene = $(".after-scene");
const controls = $(".controls");
const reactionValue = $(".reaction-value");
const reactionFill = $(".reaction-meter__fill");
const reactionMeter = $(".reaction-meter");
const speedValue = $(".speed-value");
const intensityValue = $(".intensity-value");
const syncAction = $(".sync-action");
const finishButton = $(".finish");
const restartButton = $(".restart");
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
let speed;
let intensity;
let interactionStep;
let lastChange;
let interactionTimer;
let transitionTimer;
let comboAge;
let syncBoost;

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
    `phase: ${phase}`,
    `sympathy: ${sympathy}`,
    `trust: ${trust}`,
    `intimacyTier: ${intimacyTier}`,
    `interaction step: ${interactionStep}`,
    `Reaction: ${Math.round(reaction)}`,
    `Speed: ${speed}`,
    `Intensity: ${intensity}`,
    `last change: ${lastChange}`,
  ].join("\n");
}

function updateCharacter(change = 0) {
  const state = calculateState();
  character.className = `character character--state-${state}`;
  characterState.textContent = `State ${state} — ${stateNames[state - 1]}`;
  if (change) {
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
  lastChange = `sympathy ${sympathyDelta >= 0 ? "+" : ""}${sympathyDelta}, trust ${trustDelta >= 0 ? "+" : ""}${trustDelta}`;
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
  phase = "AFTER SCENE (early)";
  interactionPhaseScene.hidden = true;
  afterScene.hidden = false;
  dialogue.classList.add("dialogue--after");
  phaseLabel.textContent = "After scene";
  dialogueText.textContent = "Думаю, на сегодня хватит.";
  hint.textContent = "Alice уходит, оставляя тишину.";
  restartButton.hidden = false;
  updateDebug();
}

function buildControls() {
  const makeButtons = (container, values, type) => {
    container.querySelectorAll("button").forEach((button) => button.remove());
    values.forEach((value, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = value;
      button.dataset.value = value;
      const unlocked = intimacyTier === "HIGH" || (intimacyTier === "MEDIUM" && (type === "speed" || index < 2)) || (intimacyTier === "LOW" && index < 2);
      button.disabled = !unlocked;
      button.addEventListener("click", () => setControl(type, value));
      container.append(button);
    });
  };
  makeButtons($(".speed-controls"), speedOptions, "speed");
  makeButtons($(".intensity-controls"), intensityOptions, "intensity");
  syncAction.hidden = intimacyTier !== "HIGH";
  updateControlButtons();
}

function setControl(type, value) {
  const oldValue = type === "speed" ? speed : intensity;
  if (oldValue === value) return;
  if (type === "speed") speed = value;
  else intensity = value;
  comboAge = 0;
  interactionStep += 1;
  lastChange = `${type}: ${oldValue} → ${value}`;
  const tooSoon = interactionStep < 3 && (speed === "Fast" || intensity === "Intense");
  dialogueText.textContent = tooSoon ? "Не спеши…" : interactionStep > 5 ? "Да, меняй ритм." : "Так лучше. Продолжай.";
  updateControlButtons();
  updateDebug();
}

function updateControlButtons() {
  speedValue.textContent = speed;
  intensityValue.textContent = intensity;
  document.querySelectorAll(".control-group button").forEach((button) => {
    const selected = button.dataset.value === speed || button.dataset.value === intensity;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function reactionRate() {
  const s = speedOptions.indexOf(speed);
  const i = intensityOptions.indexOf(intensity);
  const progress = interactionStep + comboAge / 4;
  let rate;
  if (progress < 3) rate = s === 0 && i === 0 ? 1.8 : s + i >= 3 ? -2.4 : 0.5;
  else if (progress < 7) rate = s === 1 && i === 1 ? 2.2 : Math.abs(s - i) > 1 ? -1.2 : 0.65;
  else rate = s === 2 && i >= 1 ? 1.65 : s === 1 && i === 2 ? 1.3 : 0.25;
  if (comboAge > 7) rate -= (comboAge - 7) * 0.32;
  return rate + syncBoost;
}

function tickInteraction() {
  const oldReaction = reaction;
  reaction = clamp(reaction + reactionRate());
  comboAge += 1;
  syncBoost = Math.max(0, syncBoost - 0.12);
  reactionValue.textContent = Math.round(reaction);
  reactionFill.style.width = `${reaction}%`;
  reactionMeter.setAttribute("aria-valuenow", String(Math.round(reaction)));
  const delta = reaction - oldReaction;
  if (comboAge === 6) dialogueText.textContent = delta > 0 ? "Не останавливайся…" : "Попробуй иначе.";
  lastChange = `Reaction ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`;
  updateDebug();
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
  hint.textContent = "Меняй ритм — одна комбинация наскучит";
  buildControls();
  tickInteraction();
  interactionTimer = setInterval(tickInteraction, 900);
}

syncAction.addEventListener("click", () => {
  if (syncAction.disabled) return;
  syncBoost = 1.5;
  comboAge = 0;
  interactionStep += 1;
  lastChange = "Match her rhythm: boost";
  dialogueText.textContent = "Вот так. Чувствуешь?";
  syncAction.disabled = true;
  setTimeout(() => { syncAction.disabled = false; }, 4500);
  updateDebug();
});

function finishInteraction() {
  clearInterval(interactionTimer);
  phase = "AFTER SCENE";
  interactionScene.hidden = true;
  afterScene.hidden = false;
  controls.hidden = true;
  restartButton.hidden = false;
  dialogue.classList.add("dialogue--after");
  phaseLabel.textContent = "After scene";
  if (reaction >= 72) {
    dialogueText.textContent = "Останься ещё немного.";
    hint.textContent = "Alice прижимается ближе.";
  } else if (reaction >= 42) {
    dialogueText.textContent = "Мне понравилось. Правда.";
    hint.textContent = "Она тепло улыбается.";
  } else {
    dialogueText.textContent = "В следующий раз — не спеши.";
    hint.textContent = "Alice мягко отстраняется.";
  }
  lastChange = `Finish at Reaction ${Math.round(reaction)}`;
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
  speed = "Slow";
  intensity = "Soft";
  interactionStep = 0;
  comboAge = 0;
  syncBoost = 0;
  lastChange = "restart";
  interactionPhaseScene.hidden = false;
  interactionScene.hidden = true;
  afterScene.hidden = true;
  controls.hidden = true;
  answers.hidden = false;
  restartButton.hidden = true;
  dialogue.classList.remove("dialogue--after");
  phaseLabel.textContent = "Interaction";
  dialogueText.textContent = dialogueSteps[0].line;
  hint.textContent = "Выбери ответ или действие";
  updateCharacter();
  renderAnswers();
  updateDebug();
}

finishButton.addEventListener("click", finishInteraction);
restartButton.addEventListener("click", restartGame);
debugToggle.addEventListener("click", () => {
  debugPanel.hidden = !debugPanel.hidden;
  debugToggle.setAttribute("aria-expanded", String(!debugPanel.hidden));
});

restartGame();
