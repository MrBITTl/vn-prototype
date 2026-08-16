const dialogueText = document.querySelector(".dialogue__text");
const answerButtons = document.querySelectorAll(".answers button");

answerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    dialogueText.textContent = `Вы: ${button.dataset.answer}`;

    answerButtons.forEach((answer) => {
      answer.disabled = true;
    });
  });
});
