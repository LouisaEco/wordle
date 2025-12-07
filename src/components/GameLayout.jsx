import React, { useEffect, useState } from "react";
import Board from "./Board";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";

const STORAGE_KEY = "wordle_clone_v1";
const WORD_LIST_URL =
  "https://raw.githubusercontent.com/tabatkins/wordle-list/main/words";

export default function GameLayout() {
  const [allWords, setAllWords] = useState([]);
  const [solution, setSolution] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [message, setMessage] = useState("");
  const [gameStatus, setGameStatus] = useState("loading");
  const [overlayVisible, setOverlayVisible] = useState(false);

  const maxTries = 6; // fixed tries

  // ------------------ LOAD WORDS ------------------
  useEffect(() => {
    async function loadWords() {
      try {
        const res = await fetch(WORD_LIST_URL);
        const text = await res.text();

        const words = text
          .split("\n")
          .map((w) => w.trim().toUpperCase())
          .filter((w) => /^[A-Z]{5}$/.test(w));

        setAllWords(words);

        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (saved?.status === "playing") {
          setSolution(saved.solution);
          setGuesses(saved.guesses);
        } else {
          const random = words[Math.floor(Math.random() * words.length)];
          setSolution(random);
        }

        setGameStatus("playing");
      } catch (err) {
        console.error("Error loading words:", err);
      }
    }
    loadWords();
  }, []);

  // ------------------ AUTO CLEAR MESSAGES ------------------
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 2000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // ------------------ WORD VALIDATION ------------------
  function isValidWord(w) {
    return allWords.includes(w.toUpperCase());
  }

  function handleKey(k) {
    if (gameStatus !== "playing") return;

    if (k === "ENTER") {
      if (currentGuess.length < 5) {
        setMessage("Not enough letters");
        return;
      }

      if (!isValidWord(currentGuess)) {
        setMessage("Not in list");
        return;
      }

      const updated = [...guesses, currentGuess.toUpperCase()];
      setGuesses(updated);
      setCurrentGuess("");

      if (currentGuess.toUpperCase() === solution) {
        setGameStatus("won");
        setOverlayVisible(true);
        return;
      }

      if (updated.length >= maxTries) {
        setGameStatus("lost");
        setOverlayVisible(true);
        return;
      }
    }

    if (k === "DEL") {
      setCurrentGuess((g) => g.slice(0, -1));
      return;
    }

    if (/^[A-Z]$/.test(k)) {
      if (currentGuess.length < 5) {
        setCurrentGuess((g) => (g + k).toUpperCase());
      }
    }
  }

  // ------------------ RESET GAME ------------------
  function resetGame() {
    const newWord = allWords[Math.floor(Math.random() * allWords.length)];
    setSolution(newWord);
    setGuesses([]);
    setCurrentGuess("");
    setGameStatus("playing");
    setOverlayVisible(false);
    setMessage("");
    localStorage.removeItem(STORAGE_KEY);
  }

  // ------------------ PHYSICAL KEYBOARD INPUT ------------------
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter") return handleKey("ENTER");
      if (e.key === "Backspace") return handleKey("DEL");

      const k = e.key.toUpperCase();
      if (/^[A-Z]$/.test(k)) handleKey(k);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentGuess, guesses, gameStatus, solution]);

  // ------------------ SAVE PROGRESS ------------------
  useEffect(() => {
    if (gameStatus === "playing") {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ solution, guesses, status: "playing" })
      );
    }
  }, [solution, guesses, gameStatus]);

  if (gameStatus === "loading") {
    return (
      <div className="container text-center mt-5">
        <h3>Loading dictionary...</h3>
      </div>
    );
  }

  return (
    <div className="wordle-wrapper">
      <div className="wordle-container">

        {/* ------------------ LEFT: GAME BOARD ------------------ */}
        <div className="board-section">
          <h1 className="wordle-title">WORDLE</h1>
          {message && <div className="message-toast">{message}</div>}
          <Board guesses={guesses} currentGuess={currentGuess} solution={solution} />
          {gameStatus !== "playing" && (
            <button className="btn-restart" onClick={resetGame}>Play Again</button>
          )}
        </div>

        {/* ------------------ RIGHT: HOW TO PLAY ------------------ */}
        <div className="instructions-panel">
          <h2 className="instructions-title">How To Play</h2>
          <p className="instructions-subtitle">Guess The Wordle In 6 Tries</p>

          <div className="rules-section">
            <ul className="rules-list">
              <li>Each guess must be a valid 5-letter word.</li>
              <li>The color of the tiles will change to show how close your guess was to the word.</li>
            </ul>
          </div>

          <div className="examples-section">
            <h3 className="examples-title">Examples</h3>

            {/* GREEN EXAMPLE */}
            <div className="example-item">
              <div className="example-row">
                <div className="tile correct">C</div>
                <div className="tile">L</div>
                <div className="tile">O</div>
                <div className="tile">C</div>
                <div className="tile">K</div>
              </div>
              <p className="example-text"><strong>C</strong> is in the word and in the correct spot.</p>
            </div>

            {/* YELLOW EXAMPLE */}
            <div className="example-item">
              <div className="example-row">
                <div className="tile">A</div>
                <div className="tile">R</div>
                <div className="tile almost">E</div>
                <div className="tile">A</div>
                <div className="tile">S</div>
              </div>
              <p className="example-text"><strong>E</strong> is in the word but in the wrong spot.</p>
            </div>

            {/* GRAY EXAMPLE */}
            <div className="example-item">
              <div className="example-row">
                <div className="tile">V</div>
                <div className="tile">A</div>
                <div className="tile">G</div>
                <div className="tile wrong">U</div>
                <div className="tile">E</div>
              </div>
              <p className="example-text"><strong>U</strong> is not in the word in any spot.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------ RESULT OVERLAY ------------------ */}
      {gameStatus !== "playing" && overlayVisible && (
        <div className="result-overlay">
          <div className="result-card">
            <h3>{gameStatus === "won" ? "You Won!" : "Game Over"}</h3>
            <p>{gameStatus === "won" ? "Congratulations!" : `Correct word: ${solution}`}</p>
            <button className="btn btn-primary me-2" onClick={resetGame}>Play Again</button>
            <button className="btn btn-secondary" onClick={() => setOverlayVisible(false)}>Continue</button>
          </div>
        </div>
      )}
    </div>
  );
}
