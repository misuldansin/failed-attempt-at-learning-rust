import { Grid } from "../structs/grid.js";
import { PARTICLE, CATEGORY } from "../structs/data.js";
import { Renderer } from "../io/renderer.js";
import { InputManager } from "../io/inputManager.js";
import { Debug } from "../io/debug.js";
import { Utility } from "../utils/utility.js";

export class Engine {
  // Dependencies
  #renderer;
  #inputManager;
  #debug;
  // Game states
  #gameWidth;
  #gameHeight;
  #currentGrid;
  #nextGrid;
  #particlesProcessed = new Set();
  // Game loop variables
  #isRunning = false;
  #animationFrameId = null;
  #renderUpdateInterval = 15; // renders ~60 frames per second
  #physicsInterval = 15; // updates physics 40 frames per second
  // Time tracking for FPS
  #lastFrameTime = 0;
  #frameCount = 0;
  #fps = 0;
  // Time tracking for TPS
  #lastPhysicsTime = 0;
  #tickCount = 0;
  #tps = 0;
  // Time tracking for renderer, debug, and UI updates
  #lastRenderUpdateTime = 0;

  constructor(gameWidth, gameHeight, rendererInstance, inputManagerInstance, debugInstance) {
    if (
      !(rendererInstance instanceof Renderer) ||
      !(inputManagerInstance instanceof InputManager) ||
      !(debugInstance instanceof Debug)
    ) {
      throw new Error("Engine constructor requires valid instances!");
    }
    this.#renderer = rendererInstance;
    this.#inputManager = inputManagerInstance;
    this.#debug = debugInstance;
    this.#gameWidth = gameWidth;
    this.#gameHeight = gameHeight;
    this.#currentGrid = new Grid(this.#gameWidth, this.#gameHeight);

    this.#currentGrid.populateGrid(PARTICLE.EMPTY);
    this.#renderer.queueParticles(this.#currentGrid.dirtyParticles, this.#debug.isOverlayEnabled, {
      r: 238,
      g: 148,
      b: 210,
      a: 220,
    });
  }
  start() {
    if (!this.#isRunning) {
      this.#isRunning = true;
      this.#gameLoop();
    }
  }

  stop() {
    this.#isRunning = false;
    cancelAnimationFrame(this.#animationFrameId);
    this.#animationFrameId = null;
  }
  #gameLoop = (timestamp) => {
    if (!this.#isRunning) return;

    // ---! FPS Calculation !---
    this.#frameCount++;
    const delta = timestamp - this.#lastFrameTime;
    if (delta >= 1000) {
      // Update FPS every second; 1000ms = 1s
      this.#fps = (this.#frameCount * 1000) / delta;
      this.#frameCount = 0;
      this.#lastFrameTime = timestamp;
    }

    // ---! Physics Update (TPS) !---
    const physicsDelta = timestamp - this.#lastPhysicsTime;
    if (physicsDelta >= this.#physicsInterval) {
      // Step 1. process physics this frame
      this.#stepPhysics();

      this.#tickCount++;
      this.#lastPhysicsTime = timestamp;
    }

    // ---! Debug UI Update !---
    const renderDelta = timestamp - this.#lastRenderUpdateTime;
    if (renderDelta >= this.#renderUpdateInterval) {
      this.#tps = (this.#tickCount * 1000) / renderDelta;

      // Process input and update UI
      this.#inputManager.processInput(this.#currentGrid, this.#renderer);

      // Update debug display
      this.#debug.updateDisplay(this.#fps, this.#tps);

      // Render this frame
      this.#renderer.renderThisFrame();

      this.#tickCount = 0;
      this.#lastRenderUpdateTime = timestamp;
    }

    this.#animationFrameId = requestAnimationFrame(this.#gameLoop);
  };

  // --------- Handle physics ---------
  #stepPhysics() {
    // Store dirty particles of the previous frame to update this frame
    let particlesToUpdate = Array.from(this.#currentGrid.dirtyParticles);

    // Exit if there's nothing to update
    if (particlesToUpdate.length === 0) return;

    // Clear particles processed array and current grid's dirty particles to initialise for the next part
    this.#particlesProcessed.clear();
    // Step 2. push particles to be rendered for this frame
    this.#renderer.queueParticles(this.#currentGrid.dirtyParticles, this.#debug.isOverlayEnabled, {
      r: 238,
      g: 148,
      b: 210,
      a: 255,
    });
    // Step 3. clear any game data related to this frame
    this.#currentGrid.clearDirty();

    // Shuffle the entire list to randomize the horizontal order
    particlesToUpdate = Utility.shuffleArray(particlesToUpdate);

    // Sort from top to bottom (y-coordinate)
    particlesToUpdate.sort((particleA, particleB) => particleB.position.y - particleA.position.y);

    // Loop through previous dirty particles and update them
    for (const particle of particlesToUpdate) {
      if (!particle) continue; // If particle is null, don't bother

      // If the particle was already processed this frame, don't bother
      if (this.#particlesProcessed.has(particle.index)) return;

      switch (particle.category) {
        case CATEGORY.SOLID:
          // Handle solids
          break;
        case CATEGORY.LIQUID:
          // Handle liquids
          break;
        case CATEGORY.GAS:
          // Handle gases
          break;
        case CATEGORY.SAND:
          // Handle sands
          this.#handleSandPhysics(particle, this.#currentGrid, this.#particlesProcessed);
          break;
        default:
          continue;
      }
    }
  }
  #handleSandPhysics(particle, currentGrid, particlesProcessed) {
    //let directions = JSON.parse(JSON.stringify(particle.reposeDirections));
    let directions = particle.reposeDirections;

    // let directions = [
    //   [{ dx: 0, dy: 1 }],
    //   [
    //     { dx: 1, dy: 4 },
    //     { dx: -1, dy: 4 },
    //   ],
    // ];

    const targetParticle = this.#currentGrid.tryMoveParticle(particle, directions, true, true, true);
    if (targetParticle) {
      this.#particlesProcessed.add(particle);
      this.#particlesProcessed.add(targetParticle);
    }
  }

  // --------- Helper Functions ---------
}
