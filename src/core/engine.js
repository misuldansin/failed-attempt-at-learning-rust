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
  #particlesProcessed = [];
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

      // Update UI
      this.#inputManager.processInput(this.#currentGrid, this.#renderer);

      // Debugger is handled here in the future
      this.#debug.updateDisplay(this.#fps, this.#tps);

      // Render the final result
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
    this.#particlesProcessed = new Array(this.#currentGrid.width * this.#currentGrid.height).fill(false);
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
      switch (particle.category) {
        case CATEGORY.SOLID:
          /** Handle solid particle's physics */
          break;
        case CATEGORY.LIQUID:
          /** Handle liquid particle's physics */
          break;
        case CATEGORY.GAS:
          /** Handle gas particle's physics */
          break;
        case CATEGORY.SAND:
          /** Handle sand particle's physics */
          this.#handleSandPhysics(this.#currentGrid, this.#particlesProcessed, particle);
          break;
        default:
          continue;
      }
    }
  }
  #handleSandPhysics(currentGrid, particlesProcessed, particle) {
    let directions = this.#repose(particle.reposeAngle);
    // let directions = [
    //   [{ dx: 0, dy: 1 }],
    //   [
    //     { dx: 1, dy: 4 },
    //     { dx: -1, dy: 4 },
    //   ],
    // ];

    this.#tryMovingParticle(particle, directions, currentGrid, particlesProcessed);
  }

  // Attempts to move a particle in the provided list of directions
  #tryMovingParticle(particle, directionGroups, grid, particlesProcessed) {
    // If the particle has already been processed this frame, don't bother
    if (particlesProcessed[particle.index]) return;

    // Iterate through each group in the directionGroups
    for (const directions of directionGroups) {
      // Shuffle the directions for random movements
      const shuffledDirections = directions.length > 1 ? Utility.shuffleArray(directions) : directions;

      for (const direction of shuffledDirections) {
        // Get the neighbor in the direction
        const neighbor = grid.getNeighborParticle(particle, direction);

        // If neighbor does not exist, don't bother
        if (!neighbor) continue;

        // if an empty neighbor exists OR if the neighbor is movable and is less dense than the particle...
        if (neighbor.isMovable && particle.density > neighbor.density) {
          // ...swap their places
          grid.swapParticles(particle.index, neighbor.index, true, true);

          return;
        }
      }
    }
  }

  // --------- Helper Functions ---------
  #repose(reposeAngle) {
    let directions = [];

    for (let y = 1; y <= 1; y++) {
      directions.push([{ dx: 0, dy: y }]);

      // Calculate the max dx [tan(repose angle in rads) * dy]
      let maxDx = Math.round(y / Math.tan(reposeAngle * (Math.PI / 180)));
      // maxDx = Math.min(maxDx, 4);
      if (maxDx > 4) continue;

      for (let x = 1; x <= maxDx; x++) {
        if (Math.random() < 0.5) {
          directions.push([
            { dx: 2 * x, dy: y },
            { dx: -2 * x, dy: y },
          ]);
        } else {
          directions.push([
            { dx: x, dy: y },
            { dx: -1 * x, dy: y },
          ]);
        }
      }
    }

    return directions;
  }
}
