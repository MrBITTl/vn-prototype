const dialogueSteps = [
  {
    answers: [
      {
        text: "Привет! Я здесь впервые.",
        reply: "Тогда добро пожаловать. И как тебе здесь?",
        sympathy: 10,
      },
      {
        text: "А ты всех здесь запоминаешь?",
        reply: "Ха. Возможно, у меня просто хорошая память.",
        sympathy: 3,
      },
      {
        text: "Не твоё дело.",
        reply: "Ладно... можно было просто сказать.",
        sympathy: -10,
      },
    ],
  },
  {
    answers: [
      {
        text: "Здесь уютно. Особенно теперь.",
        reply: "Ого, умеешь делать комплименты. Это мило.",
        sympathy: 10,
      },
      {
        text: "Пока осматриваюсь.",
        reply: "Разумно. Тут есть несколько интересных мест.",
        sympathy: 3,
      },
      {
        text: "Бывало и получше.",
        reply: "Понятно. Значит, впечатлить тебя будет непросто.",
        sympathy: -10,
      },
    ],
  },
  {
    answers: [
      {
        text: "Покажешь мне эти места?",
        reply: "Конечно! Начнём с моего любимого кафе.",
        sympathy: 10,
      },
      {
        text: "Может быть, сам их найду.",
        reply: "Как хочешь. Иногда так даже интереснее.",
        sympathy: 3,
      },
      {
        text: "Мне не нужен экскурсовод.",
        reply: "Ясно. Больше предлагать не стану.",
        sympathy: -10,
      },
    ],
  },
  {
    answers: [
      {
        text: "Буду рад провести время вместе.",
        reply: "Договорились! Кажется, мы отлично поладим.",
        sympathy: 10,
      },
      {
        text: "Посмотрим, как пойдёт.",
        reply: "Справедливо. Не будем торопить события.",
        sympathy: 3,
      },
      {
        text: "Не рассчитывай на это.",
        reply: "Не переживай, уже не рассчитываю.",
        sympathy: -10,
      },
    ],
  },
];

const dialogueText = document.querySelector(".dialogue__text");
const answersContainer = document.querySelector(".answers");
const sympathyPanel = document.querySelector(".sympathy");
const sympathyValue = document.querySelector(".sympathy__label strong");
const sympathyFill = document.querySelector(".sympathy__fill");
const character = document.querySelector(".character");
const characterState = document.querySelector(".character__state");

let sympathy = 20;
let currentStep = 0;

function updateSympathy(change) {
  sympathy = Math.max(0, Math.min(100, sympathy + change));
  sympathyValue.textContent = `${sympathy}/100`;
  sympathyFill.style.width = `${sympathy}%`;
  sympathyPanel.setAttribute("aria-valuenow", sympathy);

  const state = sympathy < 30 ? 1 : sympathy < 60 ? 2 : 3;
  character.className = `character character--state-${state}`;
  characterState.textContent = `State ${state}`;
}

function renderAnswers() {
  answersContainer.replaceChildren();

  dialogueSteps[currentStep].answers.forEach((answer) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer.text;
    button.addEventListener("click", () => chooseAnswer(answer));
    answersContainer.append(button);
  });
}

function chooseAnswer(answer) {
  dialogueText.textContent = answer.reply;
  updateSympathy(answer.sympathy);
  currentStep = (currentStep + 1) % dialogueSteps.length;
  renderAnswers();
}

updateSympathy(0);
renderAnswers();
