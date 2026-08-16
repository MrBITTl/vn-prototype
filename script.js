const INITIAL_SYMPATHY = 35;
const INITIAL_TRUST = 30;
const MAX_CHOICES = 8;
const EARLY_FAIL_MISTAKES = 4;

const dialogueSteps = [
  {
    line: "Новенький? Или хорошо маскируешься?",
    answers: [
      ["Я местная легенда", "Скромно. Уже смешно.", 8, 2],
      ["Просто осматриваюсь", "Спокойный старт. Уважаю.", 5, 6],
      ["А ты следишь за мной?", "Не льсти себе, детектив.", 3, 1],
    ],
  },
  {
    line: "И что ты здесь ищешь?",
    answers: [
      ["Приключения без инструкции", "Вот это правильная ошибка.", 8, 4],
      ["Хорошую компанию", "Уверенно. Возможно, повезло.", 6, 5],
      ["Тебя, очевидно", "Слишком быстро. Притормози.", -7, -6, "pushy"],
    ],
  },
  {
    line: "Допустим, я не прогнала тебя.",
    answers: [
      ["Запишу как победу", "Мелкую. Но заслуженную.", 8, 3],
      ["Можем просто поболтать", "Без давления? Редкость.", 5, 8],
      ["Ты сегодня прекрасна", "Мило. Один раз считается.", 6, 1, "compliment"],
    ],
  },
  {
    line: "У тебя всегда такой план?",
    answers: [
      ["Плана не пережил автобус", "Соболезную плану. Мне нравится.", 9, 7],
      ["Импровизация надёжнее", "Опасная уверенность. Продолжай.", 7, 3],
      ["Дай номер — расскажу", "Нет. И напор убавь.", -10, -9, "pushy"],
    ],
  },
  {
    line: "Ладно. Чем меня удивишь?",
    answers: [
      ["Умею вовремя молчать", "Сильный и редкий навык.", 5, 9],
      ["Шучу хуже, чем танцую", "Теперь я обязана это увидеть.", 9, 6],
      ["Ещё одним комплиментом", "Запасной план так себе.", 4, -2, "compliment"],
    ],
  },
  {
    line: "Кофе или прогулка?",
    answers: [
      ["Кофе. Я угощаю", "Договорились. Без фанфар.", 7, 5],
      ["Прогулка без маршрута", "Хаос, но симпатичный.", 8, 3],
      ["Решай за нас", "Нет уж. Имей мнение.", -7, -5, "rude"],
    ],
  },
  {
    line: "Ты не так плох, как казалось.",
    answers: [
      ["Это мой максимум", "Самоирония тебя спасает.", 9, 6],
      ["Ты тоже ничего", "Нагло. Но честно.", 7, 3],
      ["Я вообще-то идеален", "А вот и рекламная пауза.", -7, -4, "rude"],
    ],
  },
  {
    line: "Последний шанс не всё испортить.",
    answers: [
      ["Оставлю тебе следующий ход", "Красиво. Я подумаю.", 7, 9],
      ["Продолжим за кофе?", "Продолжим. Ты заслужил.", 9, 5],
      ["Требую второй встречи", "Требовать будешь у автомата.", -10, -10, "pushy"],
    ],
  },
];

const stateNames = ["Distant", "Interested", "Flirting", "Close"];
const dialogueText = document.querySelector(".dialogue__text");
const answersContainer = document.querySelector(".answers");
const sympathyPanel = document.querySelector(".sympathy");
const sympathyValue = document.querySelector(".sympathy__label strong");
const sympathyFill = document.querySelector(".sympathy__fill");
const sympathyDelta = document.querySelector(".sympathy__delta");
const character = document.querySelector(".character");
const characterState = document.querySelector(".character__state");
const resultPanel = document.querySelector(".result");
const resultSympathy = document.querySelector(".result__sympathy strong");
const resultTitle = document.querySelector(".result__title");
const resultText = document.querySelector(".result__text");
const resultCount = document.querySelector(".result__count");
const rewardCards = [...document.querySelectorAll(".reward")];
const restartButton = document.querySelector(".restart");
const debugToggle = document.querySelector(".debug-toggle");
const debugPanel = document.querySelector(".debug-panel");

let sympathy;
let trust;
let currentStep;
let currentState;
let badChoices;
let previousChoiceWasCompliment;
let lastSympathyChange;
let lastTrustChange;
let feedbackTimer;
let transitionTimer;

const clamp = (value) => Math.max(0, Math.min(100, value));
const signed = (value) => `${value >= 0 ? "+" : ""}${value}`;

function calculateState() {
  if (sympathy >= 78 && trust >= 60) return 4;
  if (sympathy >= 58 && trust >= 42) return 3;
  if (sympathy >= 38 && trust >= 30) return 2;
  return 1;
}

function updateStatus() {
  sympathyValue.textContent = `${sympathy}/100`;
  sympathyFill.style.width = `${sympathy}%`;
  sympathyPanel.setAttribute("aria-valuenow", sympathy);
  currentState = calculateState();
  character.className = `character character--state-${currentState}`;
  characterState.textContent = `State ${currentState} — ${stateNames[currentState - 1]}`;
  debugPanel.textContent = [
    `sympathy: ${sympathy}`,
    `trust: ${trust}`,
    `choice: ${currentStep}/${MAX_CHOICES}`,
    `state: ${currentState} — ${stateNames[currentState - 1]}`,
    `last sympathy: ${signed(lastSympathyChange)}`,
    `last trust: ${signed(lastTrustChange)}`,
  ].join("\n");
}

function renderAnswers() {
  answersContainer.replaceChildren();
  dialogueSteps[currentStep].answers.forEach(([text, reply, sympathyChange, trustChange, tag]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", () => chooseAnswer({ reply, sympathyChange, trustChange, tag }));
    answersContainer.append(button);
  });
}

function showChoiceFeedback(change) {
  clearTimeout(feedbackTimer);
  sympathyDelta.textContent = signed(change);
  sympathyDelta.className = `sympathy__delta ${change >= 0 ? "is-positive" : "is-negative"}`;
  character.classList.remove("character--reaction-good", "character--reaction-bad");
  void character.offsetWidth;
  character.classList.add(change >= 0 ? "character--reaction-good" : "character--reaction-bad");
  feedbackTimer = setTimeout(() => {
    sympathyDelta.classList.remove("is-positive", "is-negative");
    character.classList.remove("character--reaction-good", "character--reaction-bad");
  }, 650);
}

function chooseAnswer(answer) {
  let reply = answer.reply;
  let sympathyChange = answer.sympathyChange;
  let trustChange = answer.trustChange;

  if (answer.tag === "compliment" && previousChoiceWasCompliment) {
    sympathyChange -= 7;
    trustChange -= 6;
    reply = "Снова? Комплименты уже мешают.";
  }

  sympathy = clamp(sympathy + sympathyChange);
  trust = clamp(trust + trustChange);
  lastSympathyChange = sympathyChange;
  lastTrustChange = trustChange;
  if (sympathyChange < 0) badChoices += 1;
  previousChoiceWasCompliment = answer.tag === "compliment";
  dialogueText.textContent = reply;
  currentStep += 1;
  updateStatus();
  showChoiceFeedback(sympathyChange);

  if (badChoices >= EARLY_FAIL_MISTAKES || currentStep === MAX_CHOICES) {
    showEnding();
  } else {
    answersContainer.replaceChildren();
    transitionTimer = window.setTimeout(() => {
      dialogueText.textContent = dialogueSteps[currentStep].line;
      renderAnswers();
    }, 550);
  }
}

function getRewardTier(score) {
  if (score >= 90) return { name: "PERFECT", unlocked: 4, text: "Лучший финал. Alice явно заинтригована." };
  if (score >= 70) return { name: "TIER 3", unlocked: 3, text: "Отличный разогрев. Будет продолжение." };
  if (score >= 50) return { name: "TIER 2", unlocked: 2, text: "Хороший контакт. Основная награда открыта." };
  if (score >= 30) return { name: "TIER 1", unlocked: 1, text: "Искра есть. Минимальная награда открыта." };
  return { name: "FAIL", unlocked: 0, text: "Alice потеряла интерес. Награды закрыты." };
}

function showEnding() {
  answersContainer.replaceChildren();
  const outcome = getRewardTier(sympathy);
  resultSympathy.textContent = `${sympathy}/100`;
  resultTitle.textContent = outcome.name;
  resultText.textContent = outcome.text;
  resultCount.textContent = `${outcome.unlocked}/4 rewards unlocked`;
  rewardCards.forEach((card, index) => {
    const unlocked = index < outcome.unlocked;
    card.classList.toggle("reward--locked", !unlocked);
    card.querySelector("span").textContent = unlocked ? "UNLOCKED" : "LOCKED";
  });
  resultPanel.hidden = false;
  document.querySelector(".dialogue").classList.add("dialogue--result");
}

function restartGame() {
  clearTimeout(feedbackTimer);
  clearTimeout(transitionTimer);
  sympathy = INITIAL_SYMPATHY;
  trust = INITIAL_TRUST;
  currentStep = 0;
  currentState = 1;
  badChoices = 0;
  previousChoiceWasCompliment = false;
  lastSympathyChange = 0;
  lastTrustChange = 0;
  dialogueText.textContent = dialogueSteps[0].line;
  resultPanel.hidden = true;
  document.querySelector(".dialogue").classList.remove("dialogue--result");
  character.classList.remove("character--reaction-good", "character--reaction-bad");
  sympathyDelta.className = "sympathy__delta";
  updateStatus();
  renderAnswers();
}

debugToggle.addEventListener("click", () => {
  debugPanel.hidden = !debugPanel.hidden;
  debugToggle.setAttribute("aria-expanded", String(!debugPanel.hidden));
});

restartButton.addEventListener("click", restartGame);
restartGame();
