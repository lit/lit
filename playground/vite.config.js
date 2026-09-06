
          
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Recess Rumble - Starter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f0f4ff;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0;
      padding: 20px;
    }

    h1 {
      margin-bottom: 10px;
    }

    #hud {
      margin-bottom: 10px;
      font-size: 18px;
    }

    #gameArea {
      position: relative;
      width: 800px;
      height: 500px;
      border: 4px solid #333;
      background: #9be37b; /* grass */
      overflow: hidden;
    }

    #player {
      position: absolute;
      width: 30px;
      height: 30px;
      background: #ffcc00;
      border: 2px solid #000;
      border-radius: 6px;
      box-sizing: border-box;
    }

    #message {
      margin-top: 10px;
      font-size: 18px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>Recess Rumble (Starter)</h1>

  <div id="hud">
    Score: <span id="scoreDisplay">0</span>
    &nbsp; | &nbsp;
    Time Left: <span id="timeDisplay">60</span>s
  </div>

  <div id="gameArea">
    <div id="player"></div>
  </div>

  <div id="message"></div>

  <script>
    // ===== GAME SETUP =====
    const gameArea = document.getElementById('gameArea');
    const playerEl = document.getElementById('player');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const timeDisplay = document.getElementById('timeDisplay');
    const messageEl = document.getElementById('message');

    const gameWidth = gameArea.clientWidth;
    const gameHeight = gameArea.clientHeight;

    const player = {
      x: 50,
      y: 50,
      width: 30,
      height: 30,
      speed: 4
    };

    let score = 0;
    let timeLeft = 60; // seconds
    let gameOver = false;

    // Keys being held down
    const keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      a: false,
      s: false,
      d: false
    };

    // ===== INPUT HANDLING =====
    document.addEventListener('keydown', (e) => {
      if (e.key in keys) {
        keys[e.key] = true;
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key in keys) {
        keys[e.key] = false;
      }
    });

    // ===== MOVEMENT FUNCTION =====
    function updatePlayer() {
      if (gameOver) return;

      let dx = 0;
      let dy = 0;

      if (keys.ArrowUp || keys.w) dy -= player.speed;
      if (keys.ArrowDown || keys.s) dy += player.speed;
      if (keys.ArrowLeft || keys.a) dx -= player.speed;
      if (keys.ArrowRight || keys.d) dx += player.speed;

      player.x += dx;
      player.y += dy;

      // Keep inside game area
      if (player.x < 0) player.x = 0;
      if (player.y < 0) player.y = 0;
      if (player.x + player.width > gameWidth) {
        player.x = gameWidth - player.width;
      }
      if (player.y + player.height > gameHeight) {
        player.y = gameHeight - player.height;
      }

      // Apply to DOM element
      playerEl.style.left = player.x + 'px';
      playerEl.style.top = player.y + 'px';
    }

    // ===== SCORE & TIMER =====

    function addScore(amount) {
      if (gameOver) return;
      score += amount;
      scoreDisplay.textContent = score;
    }

    function startTimer() {
      const timerId = setInterval(() => {
        if (gameOver) {
          clearInterval(timerId);
          return;
        }

        timeLeft--;
        timeDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
          timeLeft = 0;
          timeDisplay.textContent = timeLeft;
          endGame();
          clearInterval(timerId);
        }
      }, 1000);
    }

    function endGame() {
      gameOver = true;

      let message;
      if (score <= 50) {
        message = 'You had an okay recess. Try more activities next time!';
      } else if (score <= 100) {
        message = 'Great recess! You made lots of memories.';
      } else {
        message = 'Legendary recess! Everyone wants to play with you!';
      }

      messageEl.textContent = `Recess is over! Final Score: ${score}. ${message}`;
    }

    // ===== SIMPLE TEST: GIVE POINTS ON CLICK =====
    // (You can remove this later. It just shows scoring works.)
    gameArea.addEventListener('click', () => {
      // Pretend we tagged someone or did an activity
      addScore(5);
    });

    // ===== MAIN GAME LOOP =====
    function gameLoop() {
      updatePlayer();
      requestAnimationFrame(gameLoop);
    }

    // Initialize positions & UI
    playerEl.style.left = player.x + 'px';
    playerEl.style.top = player.y + 'px';
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;

    // Start game
    startTimer();
    requestAnimationFrame(gameLoop);
  </script>
</body>
</html><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Recess Rumble - Tag Zone</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f0f4ff;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0;
      padding: 20px;
    }

    h1 {
      margin-bottom: 10px;
    }

    #hud {
      margin-bottom: 10px;
      font-size: 18px;
    }

    #gameArea {
      position: relative;
      width: 800px;
      height: 500px;
      border: 4px solid #333;
      background: #9be37b; /* grass */
      overflow: hidden;
    }

    #player {
      position: absolute;
      width: 30px;
      height: 30px;
      background: #ffcc00; /* yellow */
      border: 2px solid #000;
      border-radius: 6px;
      box-sizing: border-box;
      z-index: 2;
    }

    /* Tag Zone */
    #tagZone {
      position: absolute;
      left: 450px;
      top: 50px;
      width: 300px;
      height: 300px;
      background: rgba(0, 0, 255, 0.15); /* light blue area */
      border: 2px dashed #0044aa;
      box-sizing: border-box;
      z-index: 0;
    }

    .npc {
      position: absolute;
      width: 26px;
      height: 26px;
      background: #ff6666; /* red */
      border: 2px solid #000;
      border-radius: 50%;
      box-sizing: border-box;
      z-index: 1;
    }

    #message {
      margin-top: 10px;
      font-size: 18px;
      font-weight: bold;
    }

    #hint {
      margin-top: 6px;
      font-size: 14px;
      color: #333;
    }
  </style>
</head>
<body>
  <h1>Recess Rumble – Tag Zone</h1>

  <div id="hud">
    Score: <span id="scoreDisplay">0</span>
    &nbsp; | &nbsp;
    Time Left: <span id="timeDisplay">60</span>s
  </div>

  <div id="gameArea">
    <!-- Tag Zone -->
    <div id="tagZone"></div>

    <!-- Player -->
    <div id="player"></div>
  </div>

  <div id="message"></div>
  <div id="hint">Hint: Move into the blue tag zone and bump into the red kids to earn points.</div>

  <script>
    // ====== BASIC SETUP ======
    const gameArea = document.getElementById('gameArea');
    const playerEl = document.getElementById('player');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const timeDisplay = document.getElementById('timeDisplay');
    const messageEl = document.getElementById('message');
    const tagZoneEl = document.getElementById('tagZone');

    const gameWidth = gameArea.clientWidth;
    const gameHeight = gameArea.clientHeight;

    const player = {
      x: 100,
      y: 220,
      width: 30,
      height: 30,
      speed: 4
    };

    let score = 0;
    let timeLeft = 60; // seconds
    let gameOver = false;

    // Keys being held down
    const keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      a: false,
      s: false,
      d: false
    };

    document.addEventListener('keydown', (e) => {
      if (e.key in keys) keys[e.key] = true;
    });

    document.addEventListener('keyup', (e) => {
      if (e.key in keys) keys[e.key] = false;
    });

    // ====== TAG ZONE BOUNDS ======
    const tagZone = {
      x: tagZoneEl.offsetLeft,
      y: tagZoneEl.offsetTop,
      width: tagZoneEl.clientWidth,
      height: tagZoneEl.clientHeight
    };

    // ====== NPC KIDS IN TAG ZONE ======
    const npcs = [];
    const npcCount = 3;

    for (let i = 0; i < npcCount; i++) {
      const el = document.createElement('div');
      el.classList.add('npc');
      gameArea.appendChild(el);

      const npc = {
        el,
        width: 26,
        height: 26,
        // Start at random position inside tag zone
        x: tagZone.x + Math.random() * (tagZone.width - 26),
        y: tagZone.y + Math.random() * (tagZone.height - 26),
        vx: (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random() * 1.5),
        vy: (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random() * 1.5),
        // To prevent tagging every single frame
        lastTaggedTime: 0
      };

      el.style.left = npc.x + 'px';
      el.style.top = npc.y + 'px';
      npcs.push(npc);
    }

    function updateNPCs(deltaTime) {
      if (gameOver) return;

      for (const npc of npcs) {
        npc.x += npc.vx;
        npc.y += npc.vy;

        // Bounce inside the tag zone bounds
        if (npc.x < tagZone.x) {
          npc.x = tagZone.x;
          npc.vx *= -1;
        }
        if (npc.y < tagZone.y) {
          npc.y = tagZone.y;
          npc.vy *= -1;
        }
        if (npc.x + npc.width > tagZone.x + tagZone.width) {
          npc.x = tagZone.x + tagZone.width - npc.width;
          npc.vx *= -1;
        }
        if (npc.y + npc.height > tagZone.y + tagZone.height) {
          npc.y = tagZone.y + tagZone.height - npc.height;
          npc.vy *= -1;
        }

        npc.el.style.left = npc.x + 'px';
        npc.el.style.top = npc.y + 'px';

        // Check collision with player (only counts if in tag zone)
        if (rectsOverlap(player, npc) && rectsOverlap(player, tagZone)) {
          const now = performance.now();
          if (now - npc.lastTaggedTime > 600) { // 0.6s cooldown per NPC
            npc.lastTaggedTime = now;
            addScore(5);
          }
        }
      }
    }

    // ====== RECTANGLE COLLISION HELPER ======
    function rectsOverlap(a, b) {
      return !(
        a.x + a.width < b.x ||
        a.x > b.x + b.width ||
        a.y + a.height < b.y ||
        a.y > b.y + b.height
      );
    }

    // ====== PLAYER MOVEMENT ======
    function updatePlayer() {
      if (gameOver) return;

      let dx = 0;
      let dy = 0;

      if (keys.ArrowUp || keys.w) dy -= player.speed;
      if (keys.ArrowDown || keys.s) dy += player.speed;
      if (keys.ArrowLeft || keys.a) dx -= player.speed;
      if (keys.ArrowRight || keys.d) dx += player.speed;

      player.x += dx;
      player.y += dy;

      // Keep player inside game area
      if (player.x < 0) player.x = 0;
      if (player.y < 0) player.y = 0;
      if (player.x + player.width > gameWidth) {
        player.x = gameWidth - player.width;
      }
      if (player.y + player.height > gameHeight) {
        player.y = gameHeight - player.height;
      }

      playerEl.style.left = player.x + 'px';
      playerEl.style.top = player.y + 'px';
    }

    // ====== SCORE & TIMER ======
    function addScore(amount) {
      if (gameOver) return;
      score += amount;
      scoreDisplay.textContent = score;
    }

    function startTimer() {
      const timerId = setInterval(() => {
        if (gameOver) {
          clearInterval(timerId);
          return;
        }

        timeLeft--;
        timeDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
          timeLeft = 0;
          timeDisplay.textContent = timeLeft;
          endGame();
          clearInterval(timerId);
        }
      }, 1000);
    }

    function endGame() {
      gameOver = true;

      let message;
      if (score <= 50) {
        message = 'You had an okay recess. Try more activities next time!';
      } else if (score <= 100) {
        message = 'Great recess! You made lots of memories.';
      } else {
        message = 'Legendary recess! Everyone wants to play with you!';
      }

      messageEl.textContent = `Recess is over! Final Score: ${score}. ${message}`;
    }

    // ====== MAIN GAME LOOP (WITH DELTA TIME) ======
    let lastTime = performance.now();

    function gameLoop(timestamp) {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      updatePlayer();
      updateNPCs(deltaTime);

      requestAnimationFrame(gameLoop);
    }

    // ====== INITIALIZE ======
    playerEl.style.left = player.x + 'px';
    playerEl.style.top = player.y + 'px';
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;

    startTimer();
    requestAnimationFrame(gameLoop);
  </script>
</body>
</html>body {
  font-family: Arial, sans-serif;
  background: #05030a;        /* dark background */
  color: #f8f8f8;
}

#gameArea {
  position: relative;
  width: 800px;
  height: 500px;
  border: 4px solid #880000;
  background: radial-gradient(circle at center, #222 0, #05030a 60%);
  overflow: hidden;
}

#player {
  position: absolute;
  width: 30px;
  height: 30px;
  background: #f5f5f5;        /* pale kid */
  border: 2px solid #000;
  border-radius: 50%;
}

#tagZone {
  position: absolute;
  left: 450px;
  top: 50px;
  width: 300px;
  height: 300px;
  background: rgba(150, 0, 0, 0.18); /* red tint */
  border: 2px dashed #ff0000;
}

.npc {
  position: absolute;
  width: 26px;
  height: 26px;
  background: #330000;        /* shadow kids */
  border: 2px solid #ff0000;
  border-radius: 50%;
}

#message {
  margin-top: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #ffcccc;
}

#hint {
  margin-top: 6px;
  font-size: 14px;
  color: #bbbbbb;
}<h1>Recess Rumble – Tag Zone Horror</h1>
...
<div id="hint">Hint: Enter the red zone and dodge the shadow kids… or tag them first.</div>function updateNPCs(deltaTime) {
  if (gameOver) return;

  for (const npc of npcs) {
    // tiny random direction change
    if (Math.random() < 0.01) {
      npc.vx *= -1;
    }
    if (Math.random() < 0.01) {
      npc.vy *= -1;
    }

    npc.x += npc.vx;
    npc.y += npc.vy;

    // bounce inside tag zone
    if (npc.x < tagZone.x) { npc.x = tagZone.x; npc.vx *= -1; }
    if (npc.y < tagZone.y) { npc.y = tagZone.y; npc.vy *= -1; }
    if (npc.x + npc.width > tagZone.x + tagZone.width) {
      npc.x = tagZone.x + tagZone.width - npc.width;
      npc.vx *= -1;
    }
    if (npc.y + npc.height > tagZone.y + tagZone.height) {
      npc.y = tagZone.y + tagZone.height - npc.height;
      npc.vy *= -1;
    }

    npc.el.style.left = npc.x + 'px';
    npc.el.style.top = npc.y + 'px';

    // collision = "soul tag" in horror mode
    if (rectsOverlap(player, npc) && rectsOverlap(player, tagZone)) {
      const now = performance.now();
      if (now - npc.lastTaggedTime > 600) {
        npc.lastTaggedTime = now;
        addScore(5);
      }
    }
  }
}const colors = ['#330000', '#001133', '#222200'];
npc.el.style.background = colors[i % colors.length];const colors = ['#330000', '#001133', '#222200'];
npc.el.style.background = colors[i % colors.length];function endGame() {
  gameOver = true;

  let message;
  if (score <= 50) {
    message = 'You barely survived recess… the shadows almost caught you.';
  } else if (score <= 100) {
    message = 'You escaped the haunted playground… for now.';
  } else {
    message = 'You ruled the haunted recess. Even the shadows fear you.';
  }

  messageEl.textContent = `The bell rings in the dark… Final Score: ${score}. ${message}`;
}<div id="hud">
  Survival Time: <span id="survivalDisplay">0.0</span>s
</div>const survivalDisplay = document.getElementById('survivalDisplay');const scoreDisplay = document.getElementById('scoreDisplay');
const timeDisplay = document.getElementById('timeDisplay');let score = 0;
let timeLeft = 60; // secondslet survivalTime = 0;      // how long you lasted (seconds)
let lastFrameTime = performance.now();
let fear = 0;              // optional: how close you are to losing
const maxFear = 100;       // raise this for longer gamesfunction addScore(amount) { ... }
function startTimer() { ... }function endGame() {
  gameOver = true;

  let message;
  if (survivalTime < 20) {
    message = 'The shadows caught you quickly… you barely escaped.';
  } else if (survivalTime < 40) {
    message = 'You dodged the shadows for a while, but they found you.';
  } else {
    message = 'You ruled the haunted playground. Even the shadows grew tired.';
  }

  messageEl.textContent = `The darkness closes in… You survived for ${survivalTime.toFixed(1)} seconds. ${message}`;
}if (rectsOverlap(player, npc) && rectsOverlap(player, tagZone)) {
  const now = performance.now();
  if (now - npc.lastTaggedTime > 600) {
    npc.lastTaggedTime = now;
    addScore(5);
  }
}if (rectsOverlap(player, npc) && rectsOverlap(player, tagZone)) {
  const now = performance.now();
  if (now - npc.lastTaggedTime > 500) { // hit cooldown
    npc.lastTaggedTime = now;

    // Increase fear each time you get touched
    fear += 15;
    if (fear >= maxFear) {
      fear = maxFear;
      endGame();
    }
  }
}<div id="fearBarContainer" style="width: 200px; height: 16px; border: 1px solid #fff; margin-top: 6px;">
  <div id="fearBar" style="height: 100%; width: 0; background: #ff0000;"></div>
</div>onst fearBar = document.getElementById('fearBar');

function updateFearBar() {
  const percent = (fear / maxFear) * 100;
  fearBar.style.width = percent + '%';
}let lastTime = performance.now();

function gameLoop(timestamp) {
  if (gameOver) return; // stop updating when game is over

  const deltaTime = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  // Increase survival time by the time since last frame
  survivalTime += deltaTime;
  survivalDisplay.textContent = survivalTime.toFixed(1);

  updatePlayer();
  updateNPCs(deltaTime);

  // Update fear bar if you added it
  if (typeof updateFearBar === 'function') {
    updateFearBar();
  }

  requestAnimationFrame(gameLoop);
}playerEl.style.left = player.x + 'px';
playerEl.style.top = player.y + 'px';

survivalDisplay.textContent = survivalTime.toFixed(1);

requestAnimationFrame(gameLoop);// ====== BOSS SHADOW ======
let boss = null;          // will hold boss data when spawned
let bossSpawned = false;
let bossDefeated = false; // "defeated" by surviving

const BOSS_SPAWN_TIME = 30;   // seconds survived before boss appears
const BOSS_SURVIVE_TIME = 15; // seconds you must survive with boss
let bossStartTime = 0;        // when boss appeared<div id="gameArea">
  <div id="tagZone"></div>
  <div id="player"></div>
  <div id="boss"></div>
</div>#boss {
  position: absolute;
  width: 40px;
  height: 40px;
  background: #000000;
  border: 3px solid #ff0000;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(255, 0, 0, 0.7);
  display: none; /* hidden until spawn */
  z-index: 3;
}const bossEl = document.getElementById('boss');const bossEl = document.getElementById('boss');function updateBoss(deltaTime) {
  if (!bossSpawned || bossDefeated || gameOver) return;

  // Direction from boss to player
  const dx = player.x + player.width / 2 - (boss.x + boss.width / 2);
  const dy = player.y + player.height / 2 - (boss.y + boss.height / 2);

  const dist = Math.hypot(dx, dy) || 1;
  const dirX = dx / dist;
  const dirY = dy / dist;

  // Move boss toward player
  boss.x += dirX * boss.speed;
  boss.y += dirY * boss.speed;

  // Keep boss inside game area
  if (boss.x < 0) boss.x = 0;
  if (boss.y < 0) boss.y = 0;
  if (boss.x + boss.width > gameWidth) {
    boss.x = gameWidth - boss.width;
  }
  if (boss.y + boss.height > gameHeight) {
    boss.y = gameHeight - boss.height;
  }

  bossEl.style.left = boss.x + 'px';
  bossEl.style.top = boss.y + 'px';

  // Collision with player = big fear hit
  if (rectsOverlap(player, boss)) {
    fear += 40;              // big chunk of fear
    if (fear >= maxFear) {
      fear = maxFear;
      endGame();
    }
  }

  // Check if you survived long enough with boss
  const timeWithBoss = survivalTime - bossStartTime;
  if (timeWithBoss >= BOSS_SURVIVE_TIME && !bossDefeated) {
    bossDefeated = true;
    bossEl.style.display = 'none';
    // Optional: special message on screen
    messageEl.textContent = 'You outlasted the shadow boss… but recess isn’t over yet.';
  }
}function gameLoop(timestamp) {
  if (gameOver) return;

  const deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  survivalTime += deltaTime;
  survivalDisplay.textContent = survivalTime.toFixed(1);

  updatePlayer();
  updateNPCs(deltaTime);

  if (typeof updateFearBar === 'function') {
    updateFearBar();
  }

  requestAnimationFrame(gameLoop);
}function gameLoop(timestamp) {
  if (gameOver) return;

  const deltaTime = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  survivalTime += deltaTime;
  survivalDisplay.textContent = survivalTime.toFixed(1);

  // Spawn boss once you survive long enough
  if (!bossSpawned && survivalTime >= BOSS_SPAWN_TIME) {
    spawnBoss();
  }

  updatePlayer();
  updateNPCs(deltaTime);
  updateBoss(deltaTime);

  if (typeof updateFearBar === 'function') {
    updateFearBar();
  }

  requestAnimationFrame(gameLoop);
}if (timeWithBoss >= BOSS_SURVIVE_TIME && !bossDefeated) {
  bossDefeated = true;
  bossEl.style.display = 'none';

  // Special win end
  gameOver = true;
  messageEl.textContent = `You survived ${survivalTime.toFixed(1) seconds and defeated the shadow boss. You own the playground now.`;
}if (timeWithBoss >= BOSS_SURVIVE_TIME && !bossDefeated) {
  bossDefeated = true;
  bossEl.style.display = 'none';

  // Special win end
  gameOver = true;
  messageEl.textContent = `You survived ${survivalTime.toFixed(1) seconds and defeated the shadow boss. You own the playground now.`;
}let bossPhase = 1; // 1, 2, 3… later phases = faster, different colorfunction spawnBoss() {
  if (bossSpawned) return;
  bossSpawned = true;
  bossDefeated = false;

  bossPhase = 1; // start at phase 1 each time

  boss = {
    x: gameWidth / 2 - 20,
    y: 20,
    width: 40,
    height: 40,
    speed: 2.5
  };

  bossEl.style.display = 'block';
  bossEl.style.left = boss.x + 'px';
  bossEl.style.top = boss.y + 'px';

  bossStartTime = survivalTime;
}const timeWithBoss = survivalTime - bossStartTime;// Boss gets stronger the longer it’s out
if (timeWithBoss < 5) {
  bossPhase = 1;
  boss.speed = 2.5;
  bossEl.style.background = '#000000';
  bossEl.style.borderColor = '#ff0000';
} else if (timeWithBoss < 10) {
  bossPhase = 2;
  boss.speed = 3.2;
  bossEl.style.background = '#330000';
  bossEl.style.borderColor = '#ff5500';
} else {
  bossPhase = 3;
  boss.speed = 4.0;
  bossEl.style.background = '#550000';
  bossEl.style.borderColor = '#ffdd00';
}function updateBoss(deltaTime) {
  if (!bossSpawned || bossDefeated || gameOver) return;

  // How long the boss has been active
  const timeWithBoss = survivalTime - bossStartTime;

  // Boss phases: stronger over time
  if (timeWithBoss < 5) {
    bossPhase = 1;
    boss.speed = 2.5;
    bossEl.style.background = '#000000';
    bossEl.style.borderColor = '#ff0000';
  } else if (timeWithBoss < 10) {
    bossPhase = 2;
    boss.speed = 3.2;
    bossEl.style.background = '#330000';
    bossEl.style.borderColor = '#ff5500';
  } else {
    bossPhase = 3;
    boss.speed = 4.0;
    bossEl.style.background = '#550000';
    bossEl.style.borderColor = '#ffdd00';
  }

  // Direction from boss to player
  const dx = player.x + player.width / 2 - (boss.x + boss.width / 2);
  const dy = player.y + player.height / 2 - (boss.y + boss.height / 2);

  const dist = Math.hypot(dx, dy) || 1;
  const dirX = dx / dist;
  const dirY = dy / dist;

  // Move boss toward player
  boss.x += dirX * boss.speed;
  boss.y += dirY * boss.speed;

  // Keep boss inside arena
  if (boss.x < 0) boss.x = 0;
  if (boss.y < 0) boss.y = 0;
  if (boss.x + boss.width > gameWidth) boss.x = gameWidth - boss.width;
  if (boss.y + boss.height > gameHeight) boss.y = gameHeight - boss.height;

  bossEl.style.left = boss.x + 'px';
  bossEl.style.top = boss.y + 'px';

  // Collision = big fear damage (optionally more in higher phases)
  if (rectsOverlap(player, boss)) {
    let fearHit = 40;
    if (bossPhase === 2) fearHit = 55;
    if (bossPhase === 3) fearHit = 70;

    fear += fearHit;
    if (fear >= maxFear) {
      fear = maxFear;
      endGame();
    }
  }

  // Existing win check if you survive long enough with boss
  // (keep whatever version of this you already use)
  // const timeWithBoss = survivalTime - bossStartTime;  <-- already defined above
  if (timeWithBoss >= BOSS_SURVIVE_TIME && !bossDefeated) {
    bossDefeated = true;
    bossEl.style.display = 'none';
    // Or special win end here
  }
}#boss {
  position: absolute;
  width: 40px;
  height: 40px;
  background: #000000;
  border: 3px solid #ff0000;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(255, 0, 0, 0.7);
  display: none;
  z-index: 3;
  animation: bossPulse 1s infinite ease-in-out;
}

@keyframes bossPulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.15); }
}
