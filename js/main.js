const WORDS_URL = "data/words.json";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const ORNAMENT_POSITIONS = [
  { left: 67.7, top: 54.5 },
  { left: 64.1, top: 47.8 },
  { left: 74.4, top: 76.7 },
  { left: 47.5, top: 52.0 },
  { left: 31.9, top: 81.2 },
  { left: 43.4, top: 74.1 },
];
const GROUND_TOP = 92;

const treeStage = document.getElementById("treeStage");
const treeImage = document.getElementById("treeImage");
const livesDisplay = document.getElementById("lives");
const hintText = document.getElementById("hintText");
const wordDisplay = document.getElementById("wordDisplay");
const guessInput = document.getElementById("guessInput");
const messageDisplay = document.getElementById("message");
const keyboard = document.getElementById("keyboard");
const resultBox = document.getElementById("result");
const resultImage = document.getElementById("resultImage");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const playAgainButton = document.getElementById("playAgain");
const mascotImage = document.getElementById("mascotImage").parentElement;

let game;

async function loadWords() {
  try {
    const response = await fetch(WORDS_URL);
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    const data = await response.json();
    game = new HangmanGame(data.words);
    buildKeyboard();
    renderGame();
  } catch (error) {
    hintText.textContent = "Could not load words.json";
    console.error(error);
  }
}

function buildKeyboard() {
  keyboard.innerHTML = "";
  for (const letter of ALPHABET) {
    const key = document.createElement("button");
    key.type = "button";
    key.className = "key";
    key.textContent = letter;
    key.dataset.letter = letter;
    key.addEventListener("click", function () {
      handleGuess(letter);
    });
    keyboard.appendChild(key);
  }
}

function renderWord(newLetter) {
  wordDisplay.innerHTML = "";
  for (const letter of game.secretWord) {
    const slot = document.createElement("span");
    slot.className = "slot";
    if (game.hasGuessed(letter)) {
      slot.textContent = letter;
      if (letter === newLetter) {
        fadeIn(slot);
      }
    }
    wordDisplay.appendChild(slot);
  }
}

function renderLives() {
  livesDisplay.innerHTML = "";
  for (let i = 0; i < game.maxWrongGuesses; i++) {
    const icon = document.createElement("img");
    icon.src = "images/ornament.svg";
    icon.alt = "";
    if (i < game.ornamentsLeft) {
      icon.className = "life";
    } else {
      icon.className = "life lost";
    }
    livesDisplay.appendChild(icon);
  }
  livesDisplay.setAttribute(
    "aria-label",
    game.ornamentsLeft + " ornaments left",
  );
}

function renderGame() {
  hintText.textContent = game.hint;
  treeImage.src = "images/tree-0.svg";
  treeImage.alt = "A scrappy little Christmas tree with six red ornaments";
  messageDisplay.textContent = "";
  resultBox.hidden = true;
  resultImage.hidden = true;
  mascotImage.hidden = true;
  guessInput.disabled = false;
  guessInput.value = "";
  for (const key of keyboard.children) {
    key.disabled = false;
    key.classList.remove("hit", "miss");
  }
  renderWord();
  renderLives();
  guessInput.focus();
}

function handleGuess(letter) {
  const outcome = game.guess(letter);
  if (outcome === "repeat") {
    messageDisplay.textContent = "You already tried " + letter + ".";
    return;
  }
  const key = keyboard.querySelector('[data-letter="' + letter + '"]');
  key.disabled = true;

  if (outcome === "correct") {
    key.classList.add("hit");
    messageDisplay.textContent = "Yes! " + letter + " is in the word.";
    renderWord(letter);
  } else {
    key.classList.add("miss");
    messageDisplay.textContent =
      "Good grief, no " + letter + ". An ornament fell!";
    dropOrnament(game.wrongGuesses - 1);
    treeImage.src = "images/tree-" + game.wrongGuesses + ".svg";
    renderLives();
  }

  if (game.isOver()) {
    endGame();
  }
}

function endGame() {
  for (const key of keyboard.children) {
    key.disabled = true;
  }
  guessInput.disabled = true;
  resultBox.hidden = false;
  fadeIn(resultBox);

  if (game.isWon()) {
    treeImage.src = "images/tree-win.svg";
    treeImage.alt =
      "The little tree is full of ornaments again, with a star on top";
    showResultImage(
      "images/charlie-happy.jpg",
      "Charlie Brown smiling next to his little tree",
    );
    resultTitle.textContent = "You won!";
    resultText.textContent =
      "Merry Christmas! The little tree is a star after all.";
    messageDisplay.textContent = "";
    mascotImage.hidden = false;
    fadeIn(mascotImage);
  } else {
    showResultImage(
      "images/charlie-sad.webp",
      "Charlie Brown crying beside his drooping tree",
    );
    resultTitle.textContent = "Good grief!";
    resultText.textContent =
      "The tree is out of ornaments. The word was " + game.secretWord + ".";
    wordDisplay.querySelectorAll(".slot").forEach(function (slot, index) {
      if (!slot.textContent) {
        slot.textContent = game.secretWord[index];
        slot.classList.add("revealed");
      }
    });
  }
  playAgainButton.focus();
}

function showResultImage(source, description) {
  resultImage.src = source;
  resultImage.alt = description;
  resultImage.hidden = false;
  fadeIn(resultImage);
}

function fadeIn(element) {
  element.animate(
    [
      { opacity: 0, transform: "translateY(10px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    { duration: 450, easing: "ease-out" },
  );
}

function dropOrnament(index) {
  const start = ORNAMENT_POSITIONS[index];
  const ornament = document.createElement("img");
  ornament.src = "images/ornament.svg";
  ornament.alt = "";
  ornament.className = "falling-ornament";
  ornament.style.left = start.left + "%";
  ornament.style.top = start.top + "%";
  treeStage.appendChild(ornament);

  const fallDistance =
    (treeStage.clientHeight * (GROUND_TOP - start.top)) / 100;
  const fall = ornament.animate(
    [
      { transform: "translate(-50%, -50%) rotate(0deg)" },
      {
        transform:
          "translate(-50%, calc(-50% + " + fallDistance + "px)) rotate(200deg)",
      },
    ],
    { duration: 650, easing: "cubic-bezier(0.5, 0, 1, 0.8)", fill: "forwards" },
  );
  fall.onfinish = function () {
    ornament.remove();
    shatter(start.left, GROUND_TOP);
  };
}

function shatter(left, top) {
  for (let i = 0; i < 9; i++) {
    const shard = document.createElement("span");
    shard.className = "shard";
    shard.style.left = left + "%";
    shard.style.top = top + "%";
    treeStage.appendChild(shard);

    const angle = Math.PI * (1 + Math.random());
    const distance = 25 + Math.random() * 45;
    let direction = 1;
    if (Math.random() < 0.5) {
      direction = -1;
    }
    const x = Math.cos(angle) * distance * direction;
    const y = Math.sin(angle) * distance;
    const spin = Math.random() * 540 - 270;
    const shardAnimation = shard.animate(
      [
        { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
        {
          transform:
            "translate(" + x + "px, " + y + "px) rotate(" + spin + "deg)",
          opacity: 1,
          offset: 0.4,
        },
        {
          transform:
            "translate(" + x * 1.3 + "px, 8px) rotate(" + spin * 1.5 + "deg)",
          opacity: 0,
        },
      ],
      { duration: 900, easing: "ease-out" },
    );
    shardAnimation.onfinish = function () {
      shard.remove();
    };
  }
}

function makeSnow() {
  const snow = document.getElementById("snow");
  for (let i = 0; i < 45; i++) {
    const flake = document.createElement("span");
    flake.style.left = Math.random() * 100 + "%";
    flake.style.animationDuration = 8 + Math.random() * 10 + "s";
    flake.style.animationDelay = -Math.random() * 18 + "s";
    flake.style.setProperty("--size", 3 + Math.random() * 5 + "px");
    snow.appendChild(flake);
  }
}

guessInput.addEventListener("input", function () {
  const letter = guessInput.value.trim().toUpperCase();
  guessInput.value = "";
  if (!letter) {
    return;
  }
  if (ALPHABET.includes(letter)) {
    handleGuess(letter);
  } else {
    messageDisplay.textContent = "Letters only, please.";
  }
});

playAgainButton.addEventListener("click", function () {
  game.start();
  renderGame();
});

makeSnow();
loadWords();
