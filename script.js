const INITIAL_SYMPATHY = 20;
const INITIAL_TRUST = 25;

const dialogueSteps = [
  {
    line: "Привет. Я тебя раньше здесь не видела.",
    answers: [
      ["Верно. Я обычно произвожу незабываемое первое впечатление.", "Смело. Посмотрим, переживёт ли впечатление вторую минуту.", 7, 1],
      ["Я здесь впервые. Решил осмотреться без карты и здравого смысла.", "Самоирония — неплохой компас. Тогда добро пожаловать.", 6, 7],
      ["А ты ведёшь учёт всех посетителей?", "Только подозрительных. Поздравляю, ты в списке.", 3, 0],
    ],
  },
  {
    answers: [
      ["И что выдаёт во мне подозрительного?", "Слишком спокойный вид. Так обычно и начинаются приключения.", 4, 3],
      ["Надеюсь, список хотя бы красиво оформлен.", "С наклейками и тревожной красной рамкой специально для тебя.", 7, 2],
      ["Можешь сразу меня вычеркнуть.", "Могу. Но тогда разговор станет совсем коротким.", -4, -3],
    ],
  },
  {
    answers: [
      ["Тогда оставь. Люблю эксклюзивные клубы.", "Взносы принимаю историями. Желательно не скучными.", 6, 2],
      ["Честно говоря, я просто немного потерялся.", "Честность принята. Куда ты вообще собирался?", 1, 8],
      ["Ты всегда так допрашиваешь людей?", "Нет. Некоторые сдаются ещё до второго вопроса.", 2, -2],
    ],
  },
  {
    answers: [
      ["Искал тихое место, но, кажется, нашёл интересное.", "Осторожнее: это почти комплимент.", 8, 1, "compliment"],
      ["Понятия не имею. План был безупречен до момента выхода из дома.", "Знакомая стратегия. Удивительно, что мы оба ещё живы.", 6, 7],
      ["Куда-нибудь, где меньше вопросов.", "Дверь ты видел. Я никого не удерживаю.", -9, -7],
    ],
  },
  {
    answers: [
      ["Раз уж я здесь, посоветуешь что-нибудь?", "Могу показать двор на крыше. Но это не экскурсия.", 2, 7],
      ["Ты и есть самое интересное, что тут есть.", "Второй комплимент так быстро? Не расходуй весь запас сразу.", 7, -5, "compliment"],
      ["Сам разберусь. Так веселее.", "Уважаю. Хотя заблудишься ты почти наверняка.", 3, 3],
    ],
  },
  {
    answers: [
      ["Показывай дорогу. Обещаю отставать всего на пару метров.", "Главное — не наступай на пятки. Я серьёзно.", 4, 4],
      ["Не хочу навязываться. Просто объясни, как туда попасть.", "Неожиданно тактично. Ладно, всё же провожу.", 1, 10],
      ["Отлично, теперь ты мой личный гид.", "Нет. И с таким подходом скоро снова станешь потерявшимся незнакомцем.", -7, -10],
    ],
  },
  {
    answers: [
      ["Здесь правда здорово. Ты часто сюда приходишь?", "Когда нужен воздух и минимум людей. Так что цени исключение.", 3, 7],
      ["Неплохое место для тайных встреч.", "Уверенный заход. Немного подозрительный, но уверенный.", 8, -3],
      ["И это всё? Я ожидал большего.", "Требовательный гость без приглашения — редкое сочетание.", -10, -6],
    ],
  },
  {
    answers: [
      ["Спасибо, что сделала исключение.", "Пожалуйста. Не заставляй меня о нём жалеть.", 2, 8],
      ["Значит, я уже особенный? Быстро я.", "Не торопись. Пока ты просто статистическая погрешность.", 6, -1],
      ["Можем и помолчать. Я не против.", "Редкий талант — не бояться пауз. Мне нравится.", 1, 9],
    ],
  },
  {
    answers: [
      ["Расскажи о себе что-нибудь, чего нет в твоём досье.", "В моём досье? Ладно, это было неплохо. Я играю на барабанах.", 7, 4],
      ["Можно спросить, почему тебе нравится это место?", "Можно. Здесь я впервые решила остаться в городе надолго.", 2, 10],
      ["Ты очень красивая, особенно при таком свете.", "А вот и ещё один комплимент. Начинает звучать как тактика.", 5, -7, "compliment"],
    ],
  },
  {
    answers: [
      ["На барабанах? Напомни никогда с тобой не спорить.", "Правильный вывод. У меня отличное чувство ритма и тяжёлые палочки.", 7, 3],
      ["Похоже, у тебя с этим местом связана важная история.", "Да. Спасибо, что не стал выпытывать подробности.", 1, 9],
      ["Я тоже умею производить шум. Соседи подтвердят.", "Наконец-то достойная квалификация. Создадим ужасную группу.", 8, 5],
    ],
  },
  {
    answers: [
      ["Как назовём группу? «Статистическая погрешность»?", "Всё, название есть. Осталось научить тебя играть.", 8, 4],
      ["Не обещаю талант, но обещаю не делать вид, что всё умею.", "Это внушает больше доверия, чем половина резюме музыкантов.", 2, 10],
      ["Уверен, рядом со мной даже ты будешь звучать лучше.", "Самоуверенность только что перешла в тяжёлую стадию.", -6, -8],
    ],
  },
  {
    answers: [
      ["Может, продолжим разговор за кофе? Без обязательной репетиции.", "Кофе звучит разумно. И да, репетицию я всё равно тебе припомню.", 6, 7],
      ["Было приятно познакомиться. Оставлю следующий шаг за тобой.", "Хороший ход. Возможно, я им воспользуюсь.", 2, 9],
      ["Дай свой номер. Не люблю ждать.", "А я не люблю, когда за меня решают. На этом и закончим.", -9, -12],
    ],
  },
];

const stateNames = ["Distant", "Interested", "Flirting", "Close"];
const dialogueText = document.querySelector(".dialogue__text");
const answersContainer = document.querySelector(".answers");
const sympathyPanel = document.querySelector(".sympathy");
const sympathyValue = document.querySelector(".sympathy__label strong");
const sympathyFill = document.querySelector(".sympathy__fill");
const character = document.querySelector(".character");
const characterState = document.querySelector(".character__state");
const resultPanel = document.querySelector(".result");
const resultTitle = document.querySelector(".result__title");
const resultText = document.querySelector(".result__text");
const restartButton = document.querySelector(".restart");
const debugToggle = document.querySelector(".debug-toggle");
const debugPanel = document.querySelector(".debug-panel");

let sympathy;
let trust;
let currentStep;
let currentState;
let previousChoiceWasCompliment;

const clamp = (value) => Math.max(0, Math.min(100, value));

function calculateState() {
  if (sympathy >= 70 && trust >= 65) return 4;
  if (sympathy >= 52 && trust >= 42) return 3;
  if (sympathy >= 30 && trust >= 28) return 2;
  return 1;
}

function updateStatus() {
  sympathyValue.textContent = `${sympathy}/100`;
  sympathyFill.style.width = `${sympathy}%`;
  sympathyPanel.setAttribute("aria-valuenow", sympathy);
  currentState = calculateState();
  character.className = `character character--state-${currentState}`;
  characterState.textContent = `State ${currentState} — ${stateNames[currentState - 1]}`;
  debugPanel.textContent = `sympathy: ${sympathy}\ntrust: ${trust}\nstep: ${Math.min(currentStep + 1, dialogueSteps.length)}/${dialogueSteps.length}\nstate: ${currentState} — ${stateNames[currentState - 1]}`;
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

function chooseAnswer(answer) {
  let reply = answer.reply;
  let sympathyChange = answer.sympathyChange;
  let trustChange = answer.trustChange;

  if (answer.tag === "compliment" && previousChoiceWasCompliment) {
    sympathyChange -= 5;
    trustChange -= 6;
    reply += " Серьёзно, давай немного сбавим обороты с комплиментами.";
  }

  sympathy = clamp(sympathy + sympathyChange);
  trust = clamp(trust + trustChange);
  previousChoiceWasCompliment = answer.tag === "compliment";
  dialogueText.textContent = reply;
  currentStep += 1;
  updateStatus();

  if (currentStep === dialogueSteps.length) {
    showEnding();
  } else {
    renderAnswers();
  }
}

function showEnding() {
  answersContainer.replaceChildren();
  let outcome;

  if (sympathy >= 65 && trust >= 55) {
    outcome = ["SUCCESS", "Alice явно заинтересована. Похоже, это только начало вашего общения."];
  } else if (sympathy <= 25 || trust <= 20) {
    outcome = ["FAIL", "Alice потеряла интерес и заканчивает разговор коротким прощанием."];
  } else {
    outcome = ["NEUTRAL", "Разговор закончился спокойно, но пока не привёл ни к чему большему."];
  }

  resultTitle.textContent = outcome[0];
  resultText.textContent = outcome[1];
  resultPanel.hidden = false;
}

function restartGame() {
  sympathy = INITIAL_SYMPATHY;
  trust = INITIAL_TRUST;
  currentStep = 0;
  currentState = 1;
  previousChoiceWasCompliment = false;
  dialogueText.textContent = dialogueSteps[0].line;
  resultPanel.hidden = true;
  updateStatus();
  renderAnswers();
}

debugToggle.addEventListener("click", () => {
  debugPanel.hidden = !debugPanel.hidden;
  debugToggle.setAttribute("aria-expanded", String(!debugPanel.hidden));
});

restartButton.addEventListener("click", restartGame);
restartGame();
