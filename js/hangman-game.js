class HangmanGame {
  constructor(wordList, maxWrongGuesses = 6) {
    this.wordList = wordList;
    this.maxWrongGuesses = maxWrongGuesses;
    this.start();
  }

  // Pick a new random word/hint pair and clear all guesses
  start() {
    const entry =
      this.wordList[Math.floor(Math.random() * this.wordList.length)];
    this.secretWord = entry.word.toUpperCase();
    this.hint = entry.hint;
    this.guessedLetters = [];
    this.wrongGuesses = 0;
  }

  hasGuessed(letter) {
    return this.guessedLetters.includes(letter);
  }

  // Returns "repeat", "correct" or "wrong"
  guess(letter) {
    if (this.isOver() || this.hasGuessed(letter)) {
      return "repeat";
    }
    this.guessedLetters.push(letter);
    if (this.secretWord.includes(letter)) {
      return "correct";
    }
    this.wrongGuesses++;
    return "wrong";
  }

  isWon() {
    return [...this.secretWord].every((letter) =>
      this.guessedLetters.includes(letter),
    );
  }

  isLost() {
    return this.wrongGuesses >= this.maxWrongGuesses;
  }

  isOver() {
    return this.isWon() || this.isLost();
  }

  get ornamentsLeft() {
    return this.maxWrongGuesses - this.wrongGuesses;
  }
}
