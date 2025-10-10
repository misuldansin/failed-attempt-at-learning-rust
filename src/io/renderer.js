import { CATEGORY, PARTICLE } from "../structs/data.js";
import { Color } from "../structs/color.js";

export class Renderer {
  // DOMs and dependencies
  #canvas;
  #ctx;
  // Defaults
  #renderWidth;
  #renderHeight;
  // States
  #pixelBuffer;
  #queuedParticles = [];
  #queuedOverlayPixels = new Map();

  constructor(renderingWidth, renderingHeight) {
    this.#renderWidth = renderingWidth;
    this.#renderHeight = renderingHeight;
    this.#pixelBuffer = new Uint8ClampedArray(this.#renderWidth * this.#renderHeight * 4);
    this.#canvas = document.getElementById("main-canvas");
    this.#ctx = this.#canvas.getContext("2d");

    this.#initRenderer();
  }
  get renderWidth() {
    return this.#renderWidth;
  }
  get renderHeight() {
    return this.#renderHeight;
  }
  queueParticles(particlesToQueue, alsoOverlayAsDebug = false, debugOverlayColor = { r: 191, g: 20, b: 20, a: 175 }) {
    if (!particlesToQueue) return;

    // Queue particles to be processed later by the renderer loop
    this.#queuedParticles.push(...particlesToQueue);

    // Handle debug overlays
    const width = this.#renderWidth;
    const height = this.#renderHeight;
    if (alsoOverlayAsDebug) {
      for (const particle of particlesToQueue) {
        const flippedY = height - 1 - particle.position.y;
        const index = flippedY * width + particle.position.x;
        this.#queuedOverlayPixels.set(index, debugOverlayColor);
      }
    }
  }
  queueOverlayPixels(pixelsToQueue) {
    if (!pixelsToQueue) return;
    //this.#queuedOverlayPixels.clear();

    for (const pixel of pixelsToQueue) {
      this.#queuedOverlayPixels.set(pixel.index, pixel);
    }
  }
  renderThisFrame() {
    // Step 1. proccess queued particles this frame
    this.#processParticles(this.#queuedParticles);

    // Step 2. add overlay data
    let finalPixelBuffer = new Uint8ClampedArray(this.#pixelBuffer);
    this.#addOverlayPixels(this.#queuedOverlayPixels, finalPixelBuffer);

    // Step 3. render the final result
    this.#drawGrid(finalPixelBuffer);

    // Step 4. clear any rendering data related to this frame
    this.#queuedParticles.length = 0;
    this.#queuedOverlayPixels.clear();
  }
  #initRenderer() {
    this.#canvas.width = this.#renderWidth;
    this.#canvas.height = this.#renderHeight;
    this.#ctx.imageSmoothingEnabled = false; // Set canvas to render image using nearest-neighbor scaling; for pixelart look

    // Flip that
    this.#ctx.translate(0, this.#canvas.height);
    this.#ctx.scale(1, -1);
  }
  #processParticles(particlesToProcess) {
    if (!particlesToProcess) return;

    const width = this.#renderWidth;
    const height = this.#renderHeight;

    for (const particle of particlesToProcess) {
      const particleX = particle.position.x;
      const particleY = particle.position.y;
      const flippedY = height - 1 - particleY;
      const index = flippedY * width + particleX;

      let pixelColor = this.#getParticleFinalColor(particle);
      this.#pixelBuffer[index * 4 + 0] = pixelColor[0]; // red
      this.#pixelBuffer[index * 4 + 1] = pixelColor[1]; // green
      this.#pixelBuffer[index * 4 + 2] = pixelColor[2]; // blue
      this.#pixelBuffer[index * 4 + 3] = pixelColor[3]; // alpha
    }
  }
  #addOverlayPixels(overlayPixels, pixelBufferToOverride) {
    if (!overlayPixels) return;

    for (const [index, pixel] of overlayPixels) {
      const bufferIndex = index * 4;

      // Get the default color values from the buffer
      const dr = pixelBufferToOverride[index * 4 + 0];
      const dg = pixelBufferToOverride[index * 4 + 1];
      const db = pixelBufferToOverride[index * 4 + 2];
      const da = pixelBufferToOverride[index * 4 + 3];

      // Get source (overlay) color values
      const sr = pixel.r;
      const sg = pixel.g;
      const sb = pixel.b;
      const sa = pixel.a;

      // Normalize source Alpha
      const normalSA = sa / 255.0;

      // Apply blending formula (C_out = C_sourse * alpha_sourse + C_dest * (1 - alpha_sourse))
      const outR = Math.round(sr * normalSA + dr * (1.0 - normalSA));
      const outG = Math.round(sg * normalSA + dg * (1.0 - normalSA));
      const outB = Math.round(sb * normalSA + db * (1.0 - normalSA));
      //const outA = Math.round(sa * normalSA + da * (1.0 - normalSA));
      const outA = Math.min(da, sa);

      // Write blended color values to the Buffer
      pixelBufferToOverride[bufferIndex + 0] = outR;
      pixelBufferToOverride[bufferIndex + 1] = outG;
      pixelBufferToOverride[bufferIndex + 2] = outB;
      pixelBufferToOverride[bufferIndex + 3] = outA;
    }
  }
  #drawGrid(pixelBufferToDraw) {
    const imageData = new ImageData(pixelBufferToDraw, this.#renderWidth, this.#renderHeight);
    this.#ctx.putImageData(imageData, 0, 0);
  }
  // Calculate final pixel color for the given particle reference
  #getParticleFinalColor(particle) {
    // return black color if particle is null
    if (!particle) return new Uint8ClampedArray([0, 0, 0, 255]);

    let particleFinalColor = new Uint8ClampedArray(particle.color);

    // Override particle color based on it's category
    switch (particle.category) {
      case CATEGORY.SOLID:
        break;
      case CATEGORY.LIQUID:
        //this.#processConcentrationColor(particleFinalColor, particle.concentration, particle.maxConcentration);
        break;
      case CATEGORY.GAS:
        break;
      case CATEGORY.SAND:
        break;
      case CATEGORY.ELECTRONICS:
        break;
      default:
        break;
    }

    return particleFinalColor;
  }
  #processConcentrationColor(color, Concentration, maxConcentration, darknessMultiplier = 0.5) {
    const darkeningFactor = (Concentration / (maxConcentration - 1)) * darknessMultiplier;
    const r = color[0];
    const g = color[1];
    const b = color[2];
    const newR = r - r * darkeningFactor;
    const newG = g - g * darkeningFactor;
    const newB = b - b * darkeningFactor;
    color[0] = newR;
    color[1] = newG;
    color[2] = newB;
  }
}
