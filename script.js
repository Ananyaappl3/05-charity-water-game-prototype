// script.js

// Basic 2D platformer skeleton using DOM elements and simple physics.
// Designed for beginners: plain JavaScript, no canvas or external libs.

// Constants for game tuning
const GRAVITY = 0.8; // acceleration per frame
const FRICTION = 0.9; // air/ground friction for horizontal movement
const MOVE_SPEED = 4; // horizontal speed
const JUMP_SPEED = 14; // initial jump velocity

// Cached DOM elements
const canvas = document.getElementById('main_screen');
if (!canvas) throw new Error('Canvas element with id "main_screen" not found.');
const context = canvas.getContext("2d");

const layers = [
    document.getElementById("background"),
];

const tiles = document.getElementById("tile");
const bucket = document.getElementById("collect_container");

const player_1 = document.getElementById('player');

// Base logical resolution (game world coordinates)
const BASE_WIDTH = 816;
const BASE_HEIGHT = 480;
let SCREEN_WIDTH = BASE_WIDTH;
let SCREEN_HEIGHT = BASE_HEIGHT;
// Header height in CSS pixels (matches the header height in index.html)
const HEADER_CSS_HEIGHT = 48;
// computed logical offset (in game logical pixels) that corresponds to the header height
let headerLogicalOffset = 0;

var scrollX = 0;
let currentLevel = [];
let bucket_collected = 0;
let totalBuckets = 0;

let gameStarted = false;
let gameOver = false;

var pressedKeys = {};
window.onkeyup   = function(e) { pressedKeys[e.keyCode] = false; }
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true;  }

// Resize canvas to fit window while keeping logical coordinates
function resizeCanvasToWindow() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    const scale = Math.min(cssW / BASE_WIDTH, cssH / BASE_HEIGHT);

    // physical pixel size
    canvas.width = Math.round(BASE_WIDTH * scale * dpr);
    canvas.height = Math.round(BASE_HEIGHT * scale * dpr);
    // CSS size (appearance)
    canvas.style.width = `${Math.round(BASE_WIDTH * scale)}px`;
    canvas.style.height = `${Math.round(BASE_HEIGHT * scale)}px`;

    // map logical coords to canvas pixels
    context.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

    // keep logical screen size constant for game math
    SCREEN_WIDTH = BASE_WIDTH;
    SCREEN_HEIGHT = BASE_HEIGHT;

    // compute how tall the header is in logical game units so HUD can be drawn below it
    headerLogicalOffset = HEADER_CSS_HEIGHT / scale;
}

const levels = [
  [
    [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [ 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [ 1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [ 1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [ 1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1],
    [ 1,1,1,1,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,12,0,0,0,0,0,0,1,1],
    [ 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
]; //level layout in arrays inside arrays

const TILE_SIZE = 32;
let distanceFromFloor = 0;
let nearestFloorHeight = -59;

// Player state
let player = {
	pWidth: 28,
  pHeight: 32,
  levelX: 140,
  levelY: 480-32-59,
  renderX: 100,
  renderY: 480-32-59,
  velocityY: 0,
};

// Control / jump flags
let playerJumping = false;
let jumpPressedLastFrame = false;
let newJumpPress = false;

var drawTile = function(img, x, y) {
    context.drawImage(img, x, y, 32, 32);
}

var drawLevelTiles = function(level, hTiles, vTiles, scrollX) {
    for (var i=0; i<hTiles; i++) {
        for (var j=0; j<vTiles; j++) {
            const dx = 32 * i - scrollX;
            const dy = 32 * j;
            if (level[j][i] == 1) {
                // draw tile cell as 32x32
                context.drawImage(tiles, dx, dy, 32, 32);
            }
            else if (level[j][i] == 12) {
              // draw bucket collectible at 32x32 so it matches tile grid
              context.drawImage(bucket, dx, dy, 32, 32);
              }
            }
    }
}

var checkSpriteTileCollision = function(sprite, tileX, tileY, tileIndex, collisions) {
    if ((sprite.levelX + sprite.pWidth >= tileX &&
        sprite.levelX <= tileX + TILE_SIZE) && 
        (sprite.levelY + sprite.pHeight >= tileY &&
            sprite.levelY <= tileY + TILE_SIZE)) {
                let intersect = {
                    x: Math.max(sprite.levelX,tileX),
                    y: Math.max(sprite.levelY,tileY),
                }
                intersect.width = Math.min(sprite.levelX + sprite.pWidth, 
                    tileX + TILE_SIZE) - intersect.x;
                intersect.height = Math.min(sprite.levelY + sprite.pHeight, 
                    tileY + TILE_SIZE) - intersect.y;
                if (sprite.levelX+sprite.pWidth/2 > tileX+TILE_SIZE/2 && 
                    intersect.height > intersect.width) collisions.left = true;
                if (sprite.levelX+sprite.pWidth/2 < tileX+TILE_SIZE/2 && 
                    intersect.height > intersect.width) collisions.right = true;
                if (sprite.levelY+sprite.pHeight/2 < tileY+TILE_SIZE/2 && 
                    intersect.width > intersect.height && intersect.width > 4) {
                    collisions.top = true;
                    collisions.topY = tileY;
                }
                if (sprite.levelY+sprite.pHeight/2 > tileY+TILE_SIZE/2 && 
                    intersect.width > intersect.height && intersect.width > 4) {
                        collisions.bottom = true;
                }
        }
}

var checkSpriteTileCollisions = function(sprite, level) {
    let levelWidth = level[0].length;
    let levelHeight = level.length;
    let collisions = {
        left: false,
        right: false,
        top: false,
        bottom: false,
        topY: null,
    }
    for (let i=0; i<levelWidth; i++) {
        for (let j=0; j<levelHeight; j++) {
            if (level[j][i] != 0) {
                checkSpriteTileCollision(sprite, i*TILE_SIZE, 
                    j*TILE_SIZE, level[j][i], collisions);
            }
        }
    }
    return collisions;
}

var resetGame = function() {
  player = {
    pWidth: 28,
    pHeight: 32,
    levelX: 140,
    levelY: 480-32-59,
    renderX: 100,
    renderY: 480-32-59,
    velocityY: 0,
  };
  currentLevel = JSON.parse(JSON.stringify(levels[0]));
    // recompute total buckets for the level
    totalBuckets = (function countBuckets(level) {
        let c = 0;
        for (let j = 0; j < level.length; j++) {
            for (let i = 0; i < level[j].length; i++) {
                if (level[j][i] === 12) c++;
            }
        }
        return c;
    })(currentLevel);
    // reset jump / control flags
    playerJumping = false;
    jumpPressedLastFrame = false;
    newJumpPress = false;
  scrollX = 0;
  bucket_collected = 0;
  distanceFromFloor = 0;
  nearestFloorHeight = -59;
    // hide level complete message if visible
    try {
        const msg = document.getElementById('level-message');
        if (msg) msg.style.display = 'none';
    } catch (e) { /* DOM may not be ready */ }
}

// Game loop
var gameLoop = function(interval) {

    /* Clear Screen (logical coords) */
    context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    /* Update scroll position: center player when possible (clamped to level bounds) */
    if (currentLevel && currentLevel[0]) {
        const levelPixelWidth = currentLevel[0].length * TILE_SIZE;
        let desiredScroll = player.levelX - SCREEN_WIDTH/2 + player.pWidth/2;
        if (desiredScroll < 0) desiredScroll = 0;
        const maxScroll = Math.max(0, levelPixelWidth - SCREEN_WIDTH);
        if (desiredScroll > maxScroll) desiredScroll = maxScroll;
        scrollX = desiredScroll;
    }
    player.renderX = player.levelX - scrollX;
    player.renderY = player.levelY;

    /* Draw Parallax Layers */
    for (var i=0; i<layers.length; i++) {
        if (i==0) {
            context.drawImage(layers[i], 0, 0, 816, 480);
        } else {
            var sx=0.0050*scrollX*Math.pow(2, i);
            if (i==1) sx-=0;
            else if (i==4) sx-=Math.floor(sx/263)*263;
            else sx-=Math.floor(sx/272)*272;
            var sy=0;
            var swidth=272;
            var sheight=160;
            context.drawImage(layers[i], sx, sy, swidth, sheight, 0, 0, 816, 480);
        }
    }

   drawLevelTiles(currentLevel, currentLevel[0].length, currentLevel.length, scrollX);

   context.fillRect(player.renderX, player.renderY, player.pWidth, player.pHeight);

   context.drawImage(
    player_1,           // your Image object
    0, 0,                 // start at top-left corner of the source image
    player.pWidth,     // width of one frame (whole image)
    player.pHeight,    // height of one frame (whole image)
    player.renderX,         // where to draw on the canvas (x)
    player.renderY,         // where to draw on the canvas (y)
    player.pWidth,     // draw width
    player.pHeight     // draw height
);

  // Check collisions with the tile map
  let collisions = checkSpriteTileCollisions({
      levelX: player.levelX + 25,
      levelY: player.levelY,
      pWidth: 50,
      pHeight: player.pHeight
  }, currentLevel);

    // Movement speed (interval is ms, convert to seconds)
    const speed = 240 * (interval / 1000);

  /* A - move left */
  if (pressedKeys["65"]) {
      if (player.levelX > -25 && !collisions.left) {
          player.levelX -= speed;
      }
  }

  /* D - move right */
  if (pressedKeys["68"]) {
      if (player.levelX + player.pWidth - 25 - 30 < 
          currentLevel[0].length * TILE_SIZE && !collisions.right) {
          player.levelX += speed;
      }
  }

  /* W - jump (simple version) */
  if (pressedKeys["87"]) {
      playerJumping = true;
  } else {
      playerJumping = false;
  }

    /* Physics */
    if ((player.velocityY >= 0 && collisions.top)) {
        nearestFloorHeight = SCREEN_HEIGHT-collisions.topY;
    } else nearestFloorHeight = -player.pHeight;

    distanceFromFloor = SCREEN_HEIGHT - 
        nearestFloorHeight - (player.levelY + player.pHeight);
    // Simple gravity: apply when there is distance to the floor
    if (distanceFromFloor > 0) {
        player.velocityY += 0.5;      /* Gravity */
    } else {
        player.velocityY = 0;
    }
    if (distanceFromFloor <= 0) {
        player.levelY = SCREEN_HEIGHT - nearestFloorHeight - 
            player.pHeight;
    }
      
    /* Traditional Jump */
    if (playerJumping && !newJumpPress && 
      distanceFromFloor <= 0 && !jumpPressedLastFrame) {
        newJumpPress = true;
      } else newJumpPress = false;
      if (newJumpPress) {
        player.levelY -= 1;
        player.velocityY = -10;
      }
      
    if ((player.velocityY > 0 && collisions.top) || 
        (player.velocityY < 0 && player.levelY <= -10) ||
        (player.velocityY < 0 && collisions.bottom)) {
        player.velocityY = 0;
    }
    player.levelY += player.velocityY;

    //bucket collection
    for (let j = 0; j < currentLevel.length; j++) {
        for (let i = 0; i < currentLevel[j].length; i++) {
            if (currentLevel[j][i] === 12) { // 12 means bucket
                let touchedBucket = { top: false, bottom: false, left: false, right: false, topY: null };

                checkSpriteTileCollision(
                    {
                        levelX: player.levelX + 25,
                        levelY: player.levelY,
                        pWidth: 50,
                        pHeight: player.pHeight
                    },
                    i * TILE_SIZE,  // bucket X position
                    j * TILE_SIZE,  // bucket Y position
                    12,             // tile index
                    touchedBucket
                );

                if (touchedBucket.top || touchedBucket.bottom || touchedBucket.left || touchedBucket.right) {
                    bucket_collected += 1;
                    currentLevel[j][i] = 0; // remove bucket from level
                    // if all buckets have been collected, reset the game after a short delay
                    if (totalBuckets > 0 && bucket_collected >= totalBuckets) {
                        // show a short "level complete" message, then reset the level
                        try {
                          const msg = document.getElementById('level-message');
                          if (msg) {
                            msg.textContent = 'Level complete!';
                            msg.style.display = 'flex';
                          }
                        } catch (e) { /* ignore if DOM missing */ }
                        // delay so player sees the final pickup + message, then reset
                        setTimeout(function() {
                            resetGame();
                        }, 1000);
                    }
                }
            }
        }
    }

    if (player.levelX + player.pWidth/2 >= 
        TILE_SIZE*currentLevel[0].length) {
        gameStarted = false;
    }

    if (player.levelY >= SCREEN_HEIGHT) {
        gameOver = true;
        gameStarted = false;
    }
  }

        const interval = 1000 / 60;

    /* Start game after all assets load to avoid blank draws */
    window.addEventListener('load', function() {
        // make canvas fit the window and set transform before starting
        resizeCanvasToWindow();
        window.addEventListener('resize', resizeCanvasToWindow);
                currentLevel = JSON.parse(JSON.stringify(levels[0]));
                // compute total buckets for this level
                totalBuckets = 0;
                for (let jj = 0; jj < currentLevel.length; jj++) {
                    for (let ii = 0; ii < currentLevel[jj].length; ii++) {
                        if (currentLevel[jj][ii] === 12) totalBuckets++;
                    }
                }
        setInterval(function() {
            gameLoop(interval);  // update + render your gameplay

                    // Draw bucket icon and count in HUD
                    const hudX = 10;
                    // place HUD below the header (headerLogicalOffset is in logical game pixels)
                    const hudY = 8 + (headerLogicalOffset || 0);
                    const hudIconSize = 24; // draw the bucket icon at 24x24
                    // draw a small background for readability
                    context.fillStyle = 'rgba(0,0,0,0.3)';
                    context.fillRect(hudX - 6, hudY - 6, 120, 36);
                    // draw bucket image
                    if (bucket && bucket.complete) {
                        context.drawImage(bucket, hudX, hudY, hudIconSize, hudIconSize);
                    }
                    // draw count next to icon
                    context.font = "20px sans-serif";
                    context.fillStyle = "white";
                    context.fillText("x " + bucket_collected, hudX + hudIconSize + 12, hudY + 20);

            // remember last-frame jump press for jump edge detection
            jumpPressedLastFrame = playerJumping;
        }, interval);
    });

console.log('JavaScript file is linked correctly.');
