import React, { useEffect, useRef } from "react";

// Compute letter status (“correct”, “almost”, “wrong”)
function computeStatuses(guess, solution) {
  const result = Array(5).fill("wrong");
  const solLetters = solution.split("");
  const guessLetters = guess.split("");

  const remaining = [];

  // Pass 1: correct letters
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === solLetters[i]) {
      result[i] = "correct";
      solLetters[i] = null;
    } else {
      remaining.push(i);
    }
  }

  // Pass 2: almost letters
  for (const i of remaining) {
    const idx = solLetters.indexOf(guessLetters[i]);
    if (idx !== -1) {
      result[i] = "almost";
      solLetters[idx] = null;
    }
  }

  return result;
}

export default function Board({ guesses, currentGuess, solution }) {
  const rowCount = 6;
  const boardRef = useRef(null);

  // Animate reveal on each new guess
  useEffect(() => {
    const rows = boardRef.current?.querySelectorAll(".board-row");
    if (!rows) return;

    for (let r = 0; r < guesses.length; r++) {
      const tiles = rows[r].querySelectorAll(".tile");
      tiles.forEach((t, i) => {
        t.classList.remove("reveal");
        t.style.animationDelay = `${i * 120}ms`;
        t.offsetHeight; // force reflow
        t.classList.add("reveal");
      });
    }
  }, [guesses]);

  const rows = [];

  // Past guesses with color feedback
  for (let i = 0; i < guesses.length; i++) {
    const guess = guesses[i];
    const statuses = computeStatuses(guess, solution);

    rows.push(
      <div className="board-row" key={`row-${i}`}>
        {guess.split("").map((ch, ci) => (
          <div key={ci} className={`tile ${statuses[ci]}`}>
            {ch}
          </div>
        ))}
      </div>
    );
  }

  // Current typing row
  if (guesses.length < rowCount) {
    const filled = currentGuess.split("");
    rows.push(
      <div className="board-row" key="current-row">
        {[...Array(5)].map((_, j) => (
          <div className={`tile ${filled[j] ? "active" : ""}`} key={j}>
            {filled[j] || ""}
          </div>
        ))}
      </div>
    );
  }

  // Remaining empty rows
  const emptyRows = rowCount - rows.length;
  for (let i = 0; i < emptyRows; i++) {
    rows.push(
      <div className="board-row" key={`empty-${i}`}>
        {[...Array(5)].map((_, j) => (
          <div className="tile empty" key={j}></div>
        ))}
      </div>
    );
  }

  return (
    <div className="board" ref={boardRef} aria-live="polite">
      {rows}
    </div>
  );
}
