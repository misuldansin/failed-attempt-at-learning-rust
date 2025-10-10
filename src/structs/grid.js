import { CATEGORY, PARTICLE, PARTICLE_DATA } from "../structs/data.js";
import { Color } from "../structs/color.js";
import { Utility } from "../utils/utility.js";

export class Grid {
  width;
  height;
  #data;
  #dirtyParticles;
  NEIGHBOR = {
    TOP_LEFT: { dx: -1, dy: -1 },
    TOP_MIDDLE: { dx: 0, dy: -1 },
    TOP_RIGHT: { dx: 1, dy: -1 },
    LEFT: { dx: -1, dy: 0 },
    RIGHT: { dx: 1, dy: 0 },
    DOWN_LEFT: { dx: -1, dy: 1 },
    DOWN_MIDDLE: { dx: 0, dy: 1 },
    DOWN_RIGHT: { dx: 1, dy: 1 },
  };
  PROCESSED_PARTICLE_DATA = {};

  constructor(width, height, dataOverride = null) {
    this.width = width;
    this.height = height;
    this.#data = new Array(width * height).fill(null);
    this.#dirtyParticles = new Set();

    this.#processParticleData(PARTICLE_DATA);
  }
  get data() {
    return this.#data;
  }
  get dirtyParticles() {
    return this.#dirtyParticles;
  }
  isInBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
  clearDirty() {
    this.#dirtyParticles.clear();
  }

  // --------- Helper Functions ---------
  #processParticleData(rawParticleData) {
    for (const key in rawParticleData) {
      const particle = rawParticleData[key];

      // Modify particle data
      if (particle.CATEGORY === CATEGORY.SAND) {
        particle.REPOSE_DIRECTIONS = Utility.calculateRepose(particle.REPOSE_ANGLE);
      }

      this.PROCESSED_PARTICLE_DATA[key] = particle;
    }

    // Make the newly created particle data a const
    Object.freeze(this.PROCESSED_PARTICLE_DATA);
  }

  // Particle factory
  #createNewParticle(particleId) {
    const particleData = this.PROCESSED_PARTICLE_DATA[particleId];

    // Generate a random color for this particle between the particle's base and variant colors
    const baseColor = Color.hexToRGBA(particleData.COLOR_BASE);
    const variantColor = Color.hexToRGBA(particleData.COLOR_VARIANT);
    const newColor = Color.colorBetween(baseColor, variantColor, Math.random());

    let newParticle = {
      id: particleData.ID,
      name: particleData.NAME,
      color: newColor,
      position: null,
      index: 0,
      category: particleData.CATEGORY,
      isMovable: particleData.ISMOVABLE,
      density: particleData.DENSITY,
    };

    // ..Then we assign category specific properties to it...
    switch (particleData.CATEGORY) {
      case CATEGORY.SOLID:
        break;
      case CATEGORY.LIQUID:
        newParticle.concentration = 1;
        newParticle.maxConcentration = particleData.MAXCONCENTRATION;
        break;
      case CATEGORY.GAS:
        break;
      case CATEGORY.SAND:
        newParticle.reposeAngle = particleData.REPOSE_ANGLE;
        newParticle.reposeDirections = particleData.REPOSE_DIRECTIONS;
        break;
      case CATEGORY.ELECTRONICS:
        newParticle.node = null;
        break;
      default:
        console.log("Error: None implemented category type:" + newParticle);
    }

    return newParticle;
  }

  // --------- Public Functions ---------

  // Create a new particle at the given x and y coords. Existing particle at that coords will be removed.
  createParticleAt(x, y, particleId, markAsDirty = false, markNeighborsAsDirty = false) {
    // Don't create a particle if the given location and the particle id is invalid
    if (!this.isInBounds(x, y) || !particleId) return false;

    // Create a new particle and assign it's position in the grid
    let newParticle = this.#createNewParticle(particleId);
    newParticle.position = { x: x, y: y };
    newParticle.index = y * this.width + x;

    // Add the newly created particle to the grid
    this.#data[y * this.width + x] = newParticle;

    // Handle dirty particles
    if (markAsDirty) {
      // Add the neighboring particles too
      if (markNeighborsAsDirty) {
        const newParticleNeighbors = this.getValidNeighborParticles(newParticle, this.NEIGHBOR);
        if (newParticleNeighbors) {
          for (const neighbor of newParticleNeighbors) this.#dirtyParticles.add(neighbor);
        }
      }

      this.#dirtyParticles.add(newParticle);
    }
  }

  // Returns particle reference at x and y coords, returns null if coords are out of bounds
  getParticleAt(x, y) {
    if (!this.isInBounds(x, y)) return null;
    return this.#data[y * this.width + x];
  }

  // Tries to move a particle based on provided direction groups. Stops as soon as the particle moves.
  tryMoveParticle(particle, directionGroups, dumpThemNerds = false, markAsDirty = false, markNeighborsAsDirty = false) {
    if (!particle || !directionGroups) return null;

    for (const directions of directionGroups) {
      if (!directions) continue;
      // Shuffle the directions for random movements
      const shuffledDirections = directions.length > 1 ? Utility.shuffleArray(directions) : directions;

      // Iterate through directions and check if particle can move there
      for (const direction of shuffledDirections) {
        // Add random 'dumps' in the x axis
        let finalDX = direction.dx;
        if (dumpThemNerds) {
          if (Math.random() > 0.5) {
            finalDX = direction.dx * -2;
          }
        }

        // Get the target particle
        const targetX = particle.position.x + finalDX;
        const targetY = particle.position.y + direction.dy;

        const target = this.getParticleAt(targetX, targetY);
        if (!target) continue;

        // If target particle is movable and has lower density than the current particle..
        // ..We move the current particle to the target particle (swap them)
        if (target.isMovable && particle.density > target.density) {
          // Swap particles in the data array
          this.#data[target.index] = particle;
          this.#data[particle.index] = target; // particle's index hasn't changed yet, so we can safly use it here

          // Update their postion and index
          const particlePosition = { x: particle.position.x, y: particle.position.y };
          const particleIndex = particle.index;
          particle.position = target.position;
          target.position = particlePosition;
          particle.index = target.index;
          target.index = particleIndex;

          // Mark them as dirty
          if (markAsDirty) {
            this.#dirtyParticles.add(particle);
            this.#dirtyParticles.add(target);

            // Add the neighbors of the NEW positions to the dirty set
            if (markNeighborsAsDirty) {
              const particleNeighbors = this.getValidNeighborParticles(particle, this.NEIGHBOR);
              const targetNeighbors = this.getValidNeighborParticles(target, this.NEIGHBOR);
              if (particleNeighbors) {
                for (const neighbor of particleNeighbors) {
                  this.#dirtyParticles.add(neighbor);
                }
              }
              if (targetNeighbors) {
                for (const neighbor of targetNeighbors) {
                  this.#dirtyParticles.add(neighbor);
                }
              }
            }
          }

          return target; // Particle was moved successfully
        }
      }
    }
    return null; // Particle could not be moved successfully
  }

  // Swap particle A and B location on the data array.
  swapParticles(particleAIndex, particleBIndex, markAsDirty = false, markNeighborsAsDirty = false) {
    if (particleAIndex === particleBIndex) return false;
    if (particleAIndex < 0 || particleAIndex >= this.#data.length) return false;
    if (particleBIndex < 0 || particleBIndex >= this.#data.length) return false;

    const particleA = this.#data[particleAIndex];
    const particleB = this.#data[particleBIndex];
    if (!particleA || !particleB) return false;

    const particleAPos = { ...particleA.position };
    const particleBPos = { ...particleB.position };

    particleA.position = particleBPos;
    particleB.position = particleAPos;
    this.#data[particleAIndex] = particleB;
    this.#data[particleBIndex] = particleA;

    // Recalculate indexes for both particles
    particleA.index = particleA.position.y * this.width + particleA.position.x;
    particleB.index = particleB.position.y * this.width + particleB.position.x;

    // Dirty cell handling
    if (markAsDirty) {
      // Add the new positions of both particles to the dirty set
      this.#dirtyParticles.add(particleA);
      this.#dirtyParticles.add(particleB);

      // Add the neighbors of the NEW positions to the dirty set
      if (markNeighborsAsDirty) {
        const particleANeighbors = this.getValidNeighborParticles(particleA, this.NEIGHBOR);
        const particleBNeighbors = this.getValidNeighborParticles(particleB, this.NEIGHBOR);
        if (particleANeighbors) {
          for (const neighbor of particleANeighbors) {
            this.#dirtyParticles.add(neighbor);
          }
        }
        if (particleBNeighbors) {
          for (const neighbor of particleBNeighbors) {
            this.#dirtyParticles.add(neighbor);
          }
        }
      }
    }

    return true;
  }

  // Returns a neighbor in the offset direction of a given particle
  getNeighborParticle(particle, offset) {
    const neighborX = particle.position.x + offset.dx;
    const neighborY = particle.position.y + offset.dy;

    return this.getParticleAt(neighborX, neighborY);
  }

  // Always returns an array that's either empty or has valid neighbors
  getValidNeighborParticles(particle, offsets, category = CATEGORY.ANY, type = PARTICLE.ANY) {
    let neighbors = [];
    if (!particle) return neighbors;

    for (const key in offsets) {
      const offset = offsets[key];
      const neighborX = particle.position.x + offset.dx;
      const neighborY = particle.position.y + offset.dy;
      const neighbor = this.getParticleAt(neighborX, neighborY);
      if (!neighbor) continue; // if neighbor is null or invalid, don't bother

      // Category and type checks
      const isCategoryTrue = category === CATEGORY.ANY || neighbor.category === category;
      const isTypeTrue = type === PARTICLE.ANY || neighbor.id === type;

      if (isCategoryTrue && isTypeTrue) {
        neighbors.push(neighbor);
      }
    }
    return neighbors;
  }

  //
  populateGrid(particleId) {
    const gridWidth = this.width;
    const gridHeight = this.height;

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        this.createParticleAt(x, y, particleId, true);
      }
    }
  }

  //
  markParticleDirty(particle, markNeighborsAsDirty = false) {
    this.#dirtyParticles.add(particle);

    // Add the neighbors of the NEW positions to the dirty set
    if (markNeighborsAsDirty) {
      const particleNeighbors = this.getValidNeighborParticles(particle, this.NEIGHBOR);
      if (particleNeighbors) {
        for (const neighbor of particleNeighbors) {
          this.#dirtyParticles.add(neighbor);
        }
      }
    }
  }

  // Function to draw a circle of particles in the grid
  fillCircleAt(x, y, radius, particleId, concentrationOverride = 1) {
    const newConcentration = concentrationOverride > 0 ? concentrationOverride : 1;

    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        if (i * i + j * j <= radius * radius) {
          const px = x + i;
          const py = y + j;

          // Only draw if the particle to draw is within current grid's bounds
          if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
            const prevParticle = this.getParticleAt(px, py);

            if (prevParticle === null || prevParticle.id === PARTICLE.EMPTY || particleId === PARTICLE.EMPTY) {
              this.createParticleAt(px, py, particleId, true, true);
              this.getParticleAt(px, py).concentration = newConcentration;
            }
          }
        }
      }
    }
  }
}
