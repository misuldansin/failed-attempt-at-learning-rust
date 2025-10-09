import { CATEGORY, PARTICLE } from "../structs/data.js";
import { Color } from "../structs/color.js";

export class Grid {
  width;
  height;
  #data;
  #dirtyParticles;

  constructor(width, height, dataOverride = null) {
    this.width = width;
    this.height = height;
    this.#data = new Array(width * height).fill(null);
    this.#dirtyParticles = new Set();
  }
  get data() {
    return this.#data;
  }
  get dirtyParticles() {
    return this.#dirtyParticles;
  }

  //
  createParticleAt(x, y, particleData, markAsDirty = false, markNeighborsAsDirty = false) {
    if (!this.isInBounds(x, y) || !particleData) return false;

    // PARTICLE FACTORY!!!!!!!!!!
    // ..We create a new particle object...
    let newParticle = {
      id: particleData.ID,
      name: particleData.NAME,
      color: new Color(particleData.COLOR),
      position: { x: x, y: y },
      index: y * this.width + x,
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
        break;
      case CATEGORY.ELECTRONICS:
        newParticle.node = null;
        break;
      default:
        console.log("Error: None implemented category type:" + newParticle);
    }
    // ..Prob should make a separate Factory function...

    // Add it to grid data
    this.#data[y * this.width + x] = newParticle;

    // Dirty cell handling
    if (markAsDirty) {
      // Add it's neighbors as well
      if (markNeighborsAsDirty) {
        const offsets = [
          { dx: -1, dy: -1 },
          { dx: 0, dy: -1 },
          { dx: 1, dy: -1 },
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
          { dx: -1, dy: 1 },
          { dx: 0, dy: 1 },
          { dx: 1, dy: 1 },
        ];
        const newParticleNeighbors = this.getValidNeighborParticles(newParticle, offsets);
        if (newParticleNeighbors) {
          for (const neighbor of newParticleNeighbors) this.#dirtyParticles.add(neighbor);
        }
      }

      this.#dirtyParticles.add(newParticle);
    }
  }

  //
  getParticleAt(x, y) {
    if (!this.isInBounds(x, y)) return null;
    return this.#data[y * this.width + x];
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

    for (const offset of offsets) {
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

  // Function to draw a circle of particles in the grid
  fillCircleAt(x, y, radius, particleDataToFill, concentrationOverride = 1) {
    concentrationOverride = concentrationOverride > 0 ? concentrationOverride : 1;

    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        if (i * i + j * j <= radius * radius) {
          const px = x + i;
          const py = y + j;

          // Only draw if the particle to draw is within current grid's bounds
          if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
            const prevParticle = this.getParticleAt(px, py);

            const prevParticleCheck = prevParticle === null || prevParticle.id === PARTICLE.EMPTY;
            const newParticleCheck =
              particleDataToFill.ID === PARTICLE.EMPTY || particleDataToFill.ID === prevParticle.id;

            if (prevParticleCheck || newParticleCheck) {
              this.createParticleAt(px, py, particleDataToFill, true, true);
              this.getParticleAt(px, py).concentration = concentrationOverride;
            }
          }
        }
      }
    }
  }

  clearDirtyParticles() {
    this.#dirtyParticles.clear();
  }

  isInBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}
