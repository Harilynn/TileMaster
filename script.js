const gridSize = 4;
const cellSize = 80;
let grid = [];
let tileElements = [];
let score = 0;



const container = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const newGameBtn = document.getElementById('new-game');
const overlay = document.getElementById('overlay');
const messageEl = document.getElementById('message');
const tryAgainBtn = document.getElementById('try-again');

const goals = [32,64,128,256,512,1024,2048];
let timers = {}, currentStage=0, timeLeft=0, timerInterval;

const setupEl = document.getElementById('setup'),
      gameWrap = document.getElementById('game-wrapper'),
      startBtn = document.getElementById('start-challenge'),
      headerGoal = document.createElement('div'),
      timerEl = document.createElement('div');
const header = document.querySelector('.header');
header.insertBefore(headerGoal, header.firstChild);
header.insertBefore(timerEl, header.children[1]);
headerGoal.style.fontWeight = timerEl.style.margin = '10px';
startBtn.onclick = () => {
  currentStage = 0;
  init();               // ← One-time init
  setupEl.classList.add('hidden');
  gameWrap.classList.remove('hidden');
  startStage();         // Then go into the first stage
};



function init() {
  // Reset core state
  grid = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(null)
  );
  tileId = 0;
  score = 0;
  scoreEl.textContent = score;

  // Clear UI
  overlay.classList.add('hidden');
  tileLayer.innerHTML = '';
  tileElements = [];

  // Build board + 2 tiles
  drawGrid();
  addRandomTile();
  addRandomTile();
  render();
}


function drawGrid() {
  container.innerHTML = '';
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.top = `${i * cellSize + 10}px`;
      cell.style.left = `${j * cellSize + 10}px`;
      container.appendChild(cell);
    }
  }
}
function moveTile(tile, i, j) {
  const tileSize = 70;
  const gap = 6;
  const padding = 13;
  tile.style.top = `${padding + i * (tileSize + gap)}px`;
  tile.style.left = `${padding + j * (tileSize + gap)}px`;
}

let tileId = 0;

function addRandomTile() {
  const empty = [];
  grid.forEach((row, i) =>
    row.forEach((val, j) => val === null && empty.push({ i, j }))
  );
  if (empty.length === 0) return;
  const { i, j } = empty[Math.floor(Math.random() * empty.length)];
  grid[i][j] = {
    value: Math.random() < 0.9 ? 2 : 4,
    merged: false,
    id: tileId++,
    element: null
  };
}


const tileLayer = document.getElementById('tile-layer');

function render() {
  const activeTiles = [];

  grid.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (!cell) return;

      const { id, value } = cell;

      if (!cell.element) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.textContent = value;
        tile.style.background = cellColor(value);
        tile.dataset.id = id;
        tileLayer.appendChild(tile);
        cell.element = tile;
      }

      // Move tile
      moveTile(cell.element, i, j);
      cell.element.textContent = value;
      cell.element.style.background = cellColor(value);

      activeTiles.push(cell.element);
    });
  });

  // Remove orphaned DOM tiles
  tileElements.forEach(tile => {
    if (!activeTiles.includes(tile)) tile.remove();
  });

  tileElements = activeTiles;
}



function createTile(value, i, j) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.textContent = value;
  const tileSize = 70;
  const gap = 6;
  const padding = 13;
  tile.style.top = `${padding + i * (tileSize + gap)}px`;
  tile.style.left = `${padding + j * (tileSize + gap)}px`;
  tile.style.background = cellColor(value);
  tileLayer.appendChild(tile);
  return tile;
}

function cellColor(val) {
  const colors = {
    2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563',
    32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61',
    512: '#edc850', 1024: '#edc53f', 2048: '#edc22e'
  };
  return colors[val] || '#3c3a32';
}

function move(dir) {
  let moved = false;
  for (let i = 0; i < gridSize; i++) {
    let line = dir === 'left' || dir === 'right'
      ? grid[i].slice()
      : grid.map(r => r[i]);
    if (dir === 'right' || dir === 'down') line.reverse();
    const max = Math.max(...grid.flat().filter(c=>c).map(c=>c.value));
    if(max >= goals[currentStage]) onStageClear();


    const compact = line.filter(Boolean);
    for (let k = 0; k < compact.length - 1; k++) {
      if (compact[k].value === compact[k+1].value && !compact[k].merged && !compact[k+1].merged) {
        compact[k].value *= 2;
        compact[k].merged = true;
        score += compact[k].value;
        compact.splice(k+1,1);
      }
    }
    const newLine = compact.concat(Array(gridSize - compact.length).fill(null));
    if (dir === 'right' || dir === 'down') newLine.reverse();

    newLine.forEach((val,j2) => {
      const ii = dir === 'left' || dir === 'right' ? i : j2;
      const jj = dir === 'left' || dir === 'right' ? j2 : i;
      if (grid[ii][jj] !== newLine[j2]) moved = true;
      if (newLine[j2] && newLine[j2].merged) newLine[j2].merged = false;
      grid[ii][jj] = newLine[j2];
    });
  }
  if (moved) {
    addRandomTile();
    scoreEl.textContent = score;
    render();
    checkGameOver();
  }
}

function checkGameOver() {
  if (grid.flat().some(c => c && c.value === 2048)) return showEnd('You Win!');
  if (grid.flat().some(c => c === null)) return;
  const canMerge = grid.flat().some((c,i,arr) => {
    const x = Math.floor(i / gridSize), y = i % gridSize;
    return ([x+1,y],[x,y+1]).some(([xi,yj]) =>
      grid[xi]?.[yj]?.value === c.value
    );
  });
  if (!canMerge) showEnd('Game Over');
}

function showEnd(text) {
  messageEl.textContent = text;
  overlay.classList.remove('hidden');
}

document.addEventListener('keydown', e => {
  if (overlay.classList.contains('hidden')) {
    if (e.key.includes('Arrow')) {
      const dir = e.key.replace('Arrow','').toLowerCase();
      move(dir);
    }
  }
});
newGameBtn.addEventListener('click', () => {
  currentStage = 0;
  init();
  startStage(); // ask for timer for 32 again
});
document.getElementById('exit-game').addEventListener('click', () => {
  clearInterval(timerInterval);
  gameWrap.classList.add('hidden');
  setupEl.classList.remove('hidden');
});


tryAgainBtn.addEventListener('click', () => {
  overlay.classList.add('hidden');

  // If failed, restart everything
  if (tryAgainBtn.textContent === 'Restart Challenge') {
    location.reload(); // full reset
  }

  // If passed, just continue without resetting board
  else if (tryAgainBtn.textContent === 'Next Level') {
    currentStage++;
    startStage();
  }

  // If final stage completed
  else if (tryAgainBtn.textContent === 'Finish!') {
    alert("Challenge complete! Restarting...");
    location.reload();
  }
});



document.querySelector('.how-to-toggle').addEventListener('click', () => {
  const content = document.querySelector('.how-to-content');
  content.classList.toggle('open');
});



function startStage() {
  const goal = goals[currentStage];

  const inputTime = prompt(`Enter time (in seconds) to reach ${goal}:`, "60");
  const seconds = parseInt(inputTime);
  timeLeft = isNaN(seconds) || seconds <= 0 ? 60 : seconds;
  timers[goal] = timeLeft;

  headerGoal.textContent = `Goal: ${goal}`;
  updateTimer();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) onFail();
  }, 1000);
}


function updateTimer(){
  const m = String(Math.floor(timeLeft/60)).padStart(2,'0'),
        s = String(timeLeft%60).padStart(2,'0');
  timerEl.textContent = `Time Left: ${m}:${s}`;
}

function onFail(){
  clearInterval(timerInterval);
  overlay.classList.remove('hidden');
  messageEl.textContent = `Time's up! You didn't reach ${goals[currentStage]}.`;
  tryAgainBtn.textContent = 'Restart Challenge';
  tryAgainBtn.onclick = () => location.reload();
}

function onStageClear(){
  clearInterval(timerInterval);
  overlay.classList.remove('hidden');
  messageEl.textContent = `🎉 Congrats! You reached ${goals[currentStage]}!`;
  tryAgainBtn.textContent = currentStage+1<goals.length ? 'Next Level' : 'Finish!';
  tryAgainBtn.textContent = currentStage + 1 < goals.length ? 'Next Level' : 'Finish!';

}
