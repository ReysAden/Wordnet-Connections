const splash = document.getElementById('splash');
const rules = document.getElementById('rules');
const game = document.getElementById('game');
const endOverlay = document.getElementById('end-overlay');
const playBtn = document.getElementById('play-btn');
const startBtn = document.getElementById('start-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const guessInput = document.getElementById('guess-input');
const depthChart = document.getElementById('depth-chart');
const guessesLeftEl = document.getElementById('guesses-left');
const scoreEl = document.getElementById('score');
const word1El = document.getElementById('word1');
const word2El = document.getElementById('word2');

const API = 'https://wordnet-connections.onrender.com';

let isSubmitting = false;

let gameState = {
  totalAncestors: 0,
  guessesLeft: 0,
  score: 0,
  hintRevealed: false,
  slots: []
};

// ---- NAVIGATION ----

playBtn.addEventListener('click', () => {
  splash.classList.add('hidden');
  rules.classList.remove('hidden');
});

startBtn.addEventListener('click', () => {
  rules.classList.add('hidden');
  game.classList.remove('hidden');
  startGame();
});

playAgainBtn.addEventListener('click', () => {
  endOverlay.classList.add('hidden');
  game.classList.remove('hidden');
  guessInput.disabled = false;
  depthChart.innerHTML = '';
  gameState.score = 0;
  gameState.hintRevealed = false;
  startGame();
});

// ---- GAME SETUP ----

function startGame() {
  word1El.textContent = 'Loading...';
  word2El.textContent = '';

  fetch(`${API}/new-game`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Could not generate a puzzle. Try again.');
        return;
      }

      word1El.textContent = data.word1.toUpperCase();
      word2El.textContent = data.word2.toUpperCase();

      gameState.totalAncestors = data.total_ancestors;
      gameState.guessesLeft = data.guesses_left;
      gameState.score = 0;
      gameState.hintRevealed = false;
      gameState.slots = data.ancestor_slots;

      updateStatus();
      buildDepthChart(data.ancestor_slots);
    })
    .catch(() => {
      word1El.textContent = 'Error loading puzzle.';
    });
}

// ---- DEPTH CHART ----

function buildDepthChart(slots) {
  depthChart.innerHTML = '';
  const maxDepth = Math.max(...slots.map(s => s.depth));

  slots.forEach(slot => {
    const div = document.createElement('div');
    div.classList.add('depth-slot');
    div.id = `slot-${slot.name.replaceAll(' ', '-')}`;

    const arrowWidth = Math.round(((slot.depth + 1) / (maxDepth + 1)) * 300);

    div.innerHTML = `
      <div class="depth-arrow" style="width: ${arrowWidth}px"></div>
      <span class="depth-label depth-label-hidden">${slot.name}</span>
      <span class="depth-pts depth-pts-hidden">${slot.pts} pts</span>
    `;

    depthChart.appendChild(div);
  });
}

function fillSlot(name) {
  const id = `slot-${name.replaceAll(' ', '-')}`;
  const slot = document.getElementById(id);
  if (slot) slot.classList.add('found');
}

// ---- GUESSING ----

guessInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const guess = guessInput.value.trim().toLowerCase();
    if (!guess) return;
    guessInput.value = '';
    submitGuess(guess);
  }
});

function submitGuess(guess) {
  if (isSubmitting || guessInput.disabled) return;

  isSubmitting = true;

  fetch(`${API}/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guess }),
    credentials: 'include'
  })
    .then(res => res.json())
    .then(data => {
      console.log(data);

      if (data.result === 'correct') {
        fillSlot(guess);
        gameState.score = data.score;
      } else if (data.result === 'incorrect') {
        shakeInput();
      } else if (data.result === 'already_found') {
        shakeInput();
      }

      // Always trust backend
      gameState.guessesLeft = data.guesses_left;

      if (data.hint && !gameState.hintRevealed) {
        gameState.hintRevealed = true;
        showHint(data.hint);
      }

      updateStatus();

      if (data.game_over) {
        guessInput.disabled = true;
        showEndCard(data.ancestor_chain);
      }
    })
    .catch(() => {
      console.error('Guess request failed.');
    })
    .finally(() => {
      isSubmitting = false;
    });
}

// ---- HINT ----

function showHint(hint) {
  const existing = document.getElementById('hint-box');
  if (existing) existing.remove();

  const hintEl = document.createElement('div');
  hintEl.id = 'hint-box';
  hintEl.style.cssText = `
    font-size: 14px;
    color: #444;
    text-align: left;
    max-width: 480px;
    line-height: 1.8;
    border-left: 3px solid #111;
    padding-left: 14px;
    animation: fadeIn 0.3s ease;
  `;

  hintEl.innerHTML = Object.entries(hint).map(([word, info]) =>
    `<div><strong>${word}</strong> — ${info.definition}</div>`
  ).join('');

  game.insertBefore(hintEl, depthChart);
}

// ---- STATUS ----

function updateStatus() {
  guessesLeftEl.textContent = `Guesses: ${gameState.guessesLeft}`;
  scoreEl.textContent = `Score: ${gameState.score} pts`;
}

// ---- ANIMATIONS ----

function shakeInput() {
  guessInput.style.animation = 'none';
  guessInput.offsetHeight;
  guessInput.style.animation = 'shake 0.3s ease';
}

// ---- END GAME ----

function showEndCard(ancestorChain) {
  guessInput.disabled = true;

  const allSlots = gameState.slots;
  const maxDepth = Math.max(...allSlots.map(s => s.depth));
  const found = allSlots.filter(s =>
  document.getElementById(`slot-${s.name.replaceAll(' ', '-')}`).classList.contains('found')
);

  document.getElementById('end-summary').innerHTML =
    `You scored <strong>${gameState.score} pts</strong> and found <strong>${found.length}</strong> of <strong>${allSlots.length}</strong> hypernyms.`;

  const chain = document.getElementById('end-chain');
  chain.innerHTML = allSlots.map(slot => {
    const wasFound = document.getElementById(`slot-${slot.name.replaceAll(' ', '-')}`).classList.contains('found');
    const arrowWidth = Math.round(((slot.depth + 1) / (maxDepth + 1)) * 260);
    return `
      <div class="depth-slot ${wasFound ? 'found' : ''}">
        <div class="depth-arrow" style="width: ${arrowWidth}px"></div>
        <span class="depth-label">${slot.name}</span>
        <span class="depth-pts">${slot.pts} pts</span>
      </div>
    `;
  }).join('');

  game.classList.add('hidden');
  endOverlay.classList.remove('hidden');
}