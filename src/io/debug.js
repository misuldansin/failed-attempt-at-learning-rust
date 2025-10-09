export class Debug {
  // Map containing any and all Debug DOM elements
  #elements = new Map();
  #isEnabled;
  #isOverlayEnabled;
  constructor(containerToAttachDebug, isEnabled = false) {
    this.#isEnabled = isEnabled;
    this.#isOverlayEnabled = true;
    this.#initDebug(containerToAttachDebug);
  }
  get isEnabled() {
    return this.#isEnabled;
  }
  get isOverlayEnabled() {
    return this.#isOverlayEnabled;
  }

  updateDisplay(fps, tps) {
    // If debugger is disabled, don't bother
    if (!this.#isEnabled) return;

    const fpsElement = this.#elements.get("fps");
    if (fpsElement) {
      fpsElement.textContent = `FPS: ${fps.toFixed(2)}`;
    }

    const tpsElement = this.#elements.get("tps");
    if (tpsElement) {
      tpsElement.textContent = `TPS: ${tps.toFixed(2)}`;
    }
  }

  #initDebug(containerToAttachDebug) {
    // Initialise the main debug container
    const debugContainer = document.createElement("div");
    debugContainer.classList.add("debug-container");
    containerToAttachDebug.appendChild(debugContainer);
    this.#elements.set("debug-container", debugContainer);

    // Initialise info container
    const infoContainer = document.createElement("div");
    infoContainer.classList.add("debug-info-container");
    debugContainer.appendChild(infoContainer);
    this.#elements.set("info-container", infoContainer);

    // Initialise fps and tps elements inside the info container
    const fpsElement = document.createElement("div");
    fpsElement.classList.add("debug-info");
    infoContainer.appendChild(fpsElement);
    this.#elements.set("fps", fpsElement);

    const tpsElement = document.createElement("div");
    tpsElement.classList.add("debug-info");
    infoContainer.appendChild(tpsElement);
    this.#elements.set("tps", tpsElement);
  }
}
