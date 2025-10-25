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
const context = canvas.getContext("2d");

const layers = [
    document.getElementById("background"),
];

const tiles = document.getElementById("tile");

const player = document.getElementById('player');

var scrollX = 0;
let currentLevel = [];
let bucket_collected = 0;

let gameStarted = false;
let gameOver = false;

levels = [
  [],
]; //level layout in arrays inside arrays

const SCREEN_WIDTH = 816;
const SCREEN_HEIGHT = 480;
const TILE_SIZE = 32;
let distanceFromFloor = 0;
let nearestFloorHeight = -59;

// Player state
const player_1 = {
	pWidth: 100,
  pHeight: 59,
  levelX: 140,
  levelY: 480-32-59,
  renderX: 100,
  renderY: 480-32-59,
  velocityY: 0,
};

var drawTile = function(x, y) {
    context.drawImage(tiles, x, y, 32, 32);
}

var drawLevelTiles = function(level, hTiles, vTiles, scrollX) {
    for (var i=0; i<hTiles; i++) {
        for (var j=0; j<vTiles; j++) {
            if (level[j][i] == 1) {
                drawTile(32*i-scrollX, j*32);
            }
        }
    }
}

// Input state
const keys = { left: false, right: false, jump: false };

// Camera state: we'll translate the world to keep the player centered when moving right
const camera = { x: 0, y: 0 };

// Collectible state
let waterCollected = 0;

// Helper: set element styles for position/size
function setRect(el, x, y, w, h) {
	el.style.position = 'absolute';
	el.style.left = x + 'px';
	el.style.top = y + 'px';
	if (w != null) el.style.width = w + 'px';
	if (h != null) el.style.height = h + 'px';
}

// Initialize sizes and positions
function init() {
	// Set player element size and initial position
	playerEl.classList.add('player');
	setRect(playerEl, player.x, player.y, player.w, player.h);

	// Ensure world is positioned relative so children absolute positions are world coords
	world.style.position = 'absolute';

	// Attach input listeners
	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);

	// Start loop
	requestAnimationFrame(gameLoop);
}

function onKeyDown(e) {
	if (e.code === 'ArrowLeft') keys.left = true;
	if (e.code === 'ArrowRight') keys.right = true;
	if (e.code === 'Space') keys.jump = true;
}

function onKeyUp(e) {
	if (e.code === 'ArrowLeft') keys.left = false;
	if (e.code === 'ArrowRight') keys.right = false;
	if (e.code === 'Space') keys.jump = false;
}

// Simple AABB collision test
function rectsOverlap(a, b) {
	return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

// Find ground/platforms from DOM (class .platform)
function getPlatforms() {
	const els = Array.from(document.querySelectorAll('.platform'));
	return els.map(el => ({
		x: parseFloat(el.style.left) || 0,
		y: parseFloat(el.style.top) || 0,
		w: parseFloat(el.style.width) || el.offsetWidth,
		h: parseFloat(el.style.height) || el.offsetHeight,
	}));
}

// Game loop
function gameLoop() {
	// Apply horizontal input: allow left movement but prevent going off-screen left in world coords
	if (keys.right) {
		player.vx = MOVE_SPEED;
		player.facing = 'right';
	} else if (keys.left) {
		player.vx = -MOVE_SPEED;
		player.facing = 'left';
	} else {
		player.vx = 0;
	}

	// Jump — only if on ground
	if (keys.jump && player.onGround) {
		player.vy = -JUMP_SPEED;
		player.onGround = false;
	}

	// Gravity
	player.vy += GRAVITY;

	// Integrate position
	player.x += player.vx;
	player.y += player.vy;

	// Platforms collision (simple: snap to top of first platform we hit)
	const platforms = getPlatforms();
	player.onGround = false;
	for (const p of platforms) {
		const playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
		const platformBox = { x: p.x, y: p.y, w: p.w, h: p.h };
		if (rectsOverlap(playerBox, platformBox)) {
			// Simple resolution: if falling, place on top
			if (player.vy >= 0 && player.y + player.h - player.vy <= p.y + 5) {
				player.y = p.y - player.h;
				player.vy = 0;
				player.onGround = true;
			} else if (player.vy < 0 && player.y >= p.y + p.h - 5) {
				// hit head on bottom of platform
				player.y = p.y + p.h;
				player.vy = 0;
			} else {
				// horizontal collision: simple push out
				if (player.vx > 0) player.x = p.x - player.w;
				if (player.vx < 0) player.x = p.x + p.w;
				player.vx = 0;
			}
		}
	}

	// Prevent going left off the world (world x cannot be negative)
	if (player.x < 0) {
		player.x = 0;
		player.vx = 0;
	}

	// Camera logic: when the player moves right, keep them centered in the gameScreen
	const screenWidth = gameScreen.clientWidth;
	const centerX = screenWidth / 2 - player.w / 2;

	// Only move camera when player is to the right of the center point (player world x > camera.x + centerX)
	if (player.x > camera.x + centerX) {
		// Move camera so player stays centered
		camera.x = player.x - centerX;
	}
	// If player moves left, camera does NOT follow; camera.x stays the same (so background won't move left)

	// Apply camera transform to world: translate left by camera.x
	world.style.transform = `translateX(${-camera.x}px)`;

	// Update player DOM position relative to world coordinates
	setRect(playerEl, player.x, player.y, player.w, player.h);

	// Check collectibles overlap with player
	const collectibles = Array.from(document.querySelectorAll('.collectible'));
	for (const cEl of collectibles) {
		const cx = parseFloat(cEl.style.left) || cEl.offsetLeft;
		const cy = parseFloat(cEl.style.top) || cEl.offsetTop;
		const cw = cEl.offsetWidth || 24;
		const ch = cEl.offsetHeight || 24;
		if (rectsOverlap({ x: player.x, y: player.y, w: player.w, h: player.h }, { x: cx, y: cy, w: cw, h: ch })) {
			// Pickup: remove from DOM and increment counter
			cEl.remove();
			waterCollected += 1;
			waterCountEl.textContent = String(waterCollected);
		}
	}

	// Request next frame
	requestAnimationFrame(gameLoop);
}

// Start the game
init();
console.log('JavaScript file is linked correctly.');
