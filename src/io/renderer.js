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
    if (alsoOverlayAsDebug) {
      for (const particle of particlesToQueue) {
        this.#queuedOverlayPixels.set(particle.index, debugOverlayColor);
      }
    }
  }
  queueOverlayPixels(pixelsToQueue) {
    if (!pixelsToQueue) return;
    this.#queuedOverlayPixels.clear();

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
  }
  #processParticles(particlesToProcess) {
    if (!particlesToProcess) return;

    for (const particle of particlesToProcess) {
      const index = particle.index;
      let pixelColor = this.#getParticleFinalColor(particle);
      this.#pixelBuffer[index * 4 + 0] = pixelColor.r; // red
      this.#pixelBuffer[index * 4 + 1] = pixelColor.g; // green
      this.#pixelBuffer[index * 4 + 2] = pixelColor.b; // blue
      this.#pixelBuffer[index * 4 + 3] = pixelColor.a; // alpha
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
    if (!particle) return new Color("#000000"); // return black color if particle is null

    let particleColor = new Color(null);
    particleColor.rgba.set(particle.color.rgba);

    // Override particle color based on it's category
    switch (particle.category) {
      case CATEGORY.SOLID:
        break;
      case CATEGORY.LIQUID:
        this.#processConcentrationColor(particleColor, particle.concentration, particle.maxConcentration);
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

    return particleColor;
  }
  #processConcentrationColor(color, Concentration, maxConcentration, darknessMultiplier = 0.5) {
    const darkeningFactor = (Concentration / maxConcentration) * darknessMultiplier;
    const r = color.r;
    const g = color.g;
    const b = color.b;

    const newR = Math.max(0, r - Math.floor(r * darkeningFactor));
    const newG = Math.max(0, g - Math.floor(g * darkeningFactor));
    const newB = Math.max(0, b - Math.floor(b * darkeningFactor));

    color.rgba[0] = newR;
    color.rgba[1] = newG;
    color.rgba[2] = newB;
  }
}
