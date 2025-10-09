import { CATEGORY, CATEGORY_DATA, PARTICLE, PARTICLE_DATA } from "../structs/data.js";
import { Renderer } from "../io/renderer.js";
import { Color } from "../structs/color.js";

export class InputManager {
  // Default settings
  #brushSizeSensitivity = 0.02;
  #maxBrushSize = 16;

  // Dependencies and DOM elements
  #renderer;
  #canvas = document.getElementById("main-canvas");
  #selectedParticleButton;
  #selectedCategoryButton;

  // Input / Output states
  isPainting = false;
  isErasing = false;
  latestMouseCoords = { x: 0, y: 0 };
  shouldChangeBrushSize = false;
  changeBrushSizeDir = 0;
  #activePointerId = null;
  #activeButton = null;

  // Variables
  #selectedParticle = parseInt(PARTICLE.SAND); // The default selected particle
  #selectedCategory = parseInt(CATEGORY.SAND);
  #currentBrushSize = 4;
  #currentSpeed = 25;
  #currentPressure = 0;
  #currentConcentration = 1;

  constructor(rendererInstance) {
    if (!(rendererInstance instanceof Renderer)) {
      throw new Error("InputManager constructor requires valid instances!");
    }
    this.#renderer = rendererInstance;

    // Initialize UI elements
    this.#initCategoryButtons();
    this.#initParticleButtons();
    this.#addEventListeners();

    // Update particle palette after initializing UI elements
    this.#updateParticlePalette(this.#selectedCategoryButton);
  }

  processInput(grid, renderer) {
    // --- Handle UI rendering ---
    const mousePosition = { x: Math.floor(this.latestMouseCoords.x), y: Math.floor(this.latestMouseCoords.y) };
    const brushOutlineOverlay = this.#calculateBrushOutline(mousePosition.x, mousePosition.y);
    renderer.queueOverlayPixels(brushOutlineOverlay);

    // --- Handle input ---

    // Paint particles
    if (this.isPainting || this.isErasing) {
      const x = mousePosition.x;
      const y = mousePosition.y;
      const particleId = this.isPainting ? this.#selectedParticle : PARTICLE.EMPTY;
      grid.fillCircleAt(x, y, this.#currentBrushSize, particleId, this.#currentConcentration);
    }

    // Change brush size
    if (this.shouldChangeBrushSize) {
      // Calculate new brush size
      const scrollDelta = this.changeBrushSizeDir * this.#brushSizeSensitivity;
      let newSize = this.#currentBrushSize - scrollDelta;
      // Clamp it between 0 and max brush size
      newSize = Math.floor(newSize);
      newSize = Math.min(this.#maxBrushSize, newSize);
      newSize = Math.max(0, newSize);
      // Set the new brush size
      this.#currentBrushSize = newSize;
      this.changeBrushSizeDir = 0;
    }
  }

  // Initialise category buttons for particles and display them on the particle-category-bar
  #initCategoryButtons() {
    const categoryBar = document.getElementById("particle-category-bar");

    // Clear any existing html elements
    categoryBar.innerHTML = "";

    // Create and append category buttons
    for (const key in CATEGORY_DATA) {
      const category = CATEGORY_DATA[key];

      // Create new category button
      const newButton = document.createElement("button");
      newButton.className = "category-button";

      // Create image icon for the new category button
      const categoryIcon = document.createElement("img");
      categoryIcon.src = category.ICON;
      categoryIcon.alt = category.NAME;
      categoryIcon.classList.add("category-icon");

      // Add datasets and append it to category button container
      newButton.dataset.categoryId = category.ID;
      newButton.appendChild(categoryIcon);
      categoryBar.appendChild(newButton);

      // Grab the category button that correspond to the selected category
      if (!this.#selectedCategoryButton && parseInt(category.ID) === this.#selectedCategory) {
        this.#selectedCategoryButton = newButton;
      }
    }
  }

  // Initialise particle buttons and display them on the particle-palette
  #initParticleButtons() {
    const buttonContainer = document.getElementById("particle-button-container");

    // Clear any existing html elements
    buttonContainer.innerHTML = "";

    // Create and append particle buttons
    for (const key in PARTICLE_DATA) {
      const particle = PARTICLE_DATA[key];

      // Create a new particle button
      const newButton = document.createElement("button");
      newButton.className = "particle-button";
      newButton.textContent = particle.NAME;

      // Apply background and text colors
      const particleBaseColor = particle.COLOR_BASE;
      const particleVariantColor = particle.COLOR_VARIANT;
      const particleTextColor = Color.pickContrastColor(Color.hexToRGBA(particleBaseColor));
      const inverseShadowColor = Color.invertColor(particleTextColor);

      newButton.style.setProperty("--particle-button-base-color", particleBaseColor);
      newButton.style.setProperty("--particle-button-variant-color", particleVariantColor);
      newButton.style.color = Color.RGBAToHex(particleTextColor);
      newButton.style.textShadow = `1px 1px 2px rgba(${inverseShadowColor.r}, ${inverseShadowColor.g}, ${inverseShadowColor.b}, 0.6)`;

      // Add datasets and append it to particle button container
      newButton.dataset.particleId = particle.ID;
      newButton.dataset.category = particle.CATEGORY;
      buttonContainer.appendChild(newButton);

      // Grab the particle button that correspond to the selected particle
      if (!this.#selectedParticleButton && parseInt(particle.ID) === this.#selectedParticle) {
        this.#selectedParticleButton = newButton;
      }
    }
  }

  #addEventListeners() {
    // Get references to DOM elements
    const canvas = this.#canvas;
    const particleCategoryBar = document.getElementById("particle-category-bar");
    const particleButtonContainer = document.getElementById("particle-button-container");

    // Pointer events (mouse, touch, and stylus)
    canvas.addEventListener("pointerdown", this.#onPointerDown);
    canvas.addEventListener("pointermove", this.#onPointerMove);
    canvas.addEventListener("pointerup", this.#onPointerUp);
    canvas.addEventListener("pointercancel", this.#onPointerCancel);
    canvas.addEventListener("lostpointercapture", this.#onPointerCancel);

    // Mouse wheel
    canvas.addEventListener("wheel", this.#onWheel, { passive: false });

    // Disable right click context manu
    canvas.addEventListener("contextmenu", this.#onContextMenu);

    // Window fallbacks
    window.addEventListener("pointerup", this.#onWindowPointerUp);
    window.addEventListener("mouseup", this.#onWindowPointerUp); // fallback
    document.addEventListener("visibilitychange", this.#onVisibilityChange);

    // Category bar and button container
    particleCategoryBar.addEventListener("click", (e) => {
      // Get the first category button inside the category bar
      const button = e.target.closest(".category-button");
      if (button) this.#updateParticlePalette(button);
    });
    particleButtonContainer.addEventListener("click", (e) => {
      const button = e.target.closest(".particle-button");
      if (button) this.#updateSelectedParticle(button);
    });
  }
  #onPointerDown = (e) => {
    this.#activePointerId = e.pointerId;

    // Left mouse button
    if (e.button === 0) {
      this.isPainting = true;
      this.isErasing = false;
      this.#activeButton = "left";
    }
    // Right mouse button
    else if (e.button === 2) {
      this.isErasing = true;
      this.isPainting = false;
      this.#activeButton = "right";
    }
    // Middle mouse button
    else {
      this.isPainting = false;
      this.isErasing = false;
      this.#activeButton = null;
    }

    // Capture pointer to keep receiving pointer events even if pointer leaves the canvas
    try {
      this.#canvas.setPointerCapture(e.pointerId);
    } catch (err) {}

    // Get canvas dimensions
    const rect = this.#canvas.getBoundingClientRect();
    const scaleX = this.#canvas.width / rect.width;
    const scaleY = this.#canvas.height / rect.height;

    // Calculate mouse position relative to the canvas
    this.latestMouseCoords.x = (e.clientX - rect.left) * scaleX;
    this.latestMouseCoords.y = (e.clientY - rect.top) * scaleY;
  };
  #onPointerUp = (e) => {
    if (this.#activePointerId === e.pointerId) {
      this.#activePointerId = null;
      this.#activeButton = null;
      try {
        this.#canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }

    // Clear flags on pointerup
    this.isPainting = false;
    this.isErasing = false;
  };
  #onPointerMove = (e) => {
    // Get canvas dimensions
    const rect = this.#canvas.getBoundingClientRect();
    const scaleX = this.#canvas.width / rect.width;
    const scaleY = this.#canvas.height / rect.height;

    // Calculate mouse position relative to the canvas
    this.latestMouseCoords.x = (e.clientX - rect.left) * scaleX;
    this.latestMouseCoords.y = (e.clientY - rect.top) * scaleY;

    // Only update if user actually changed hold state mid drag
    if (typeof e.buttons === "number") {
      const leftPressed = (e.buttons & 1) === 1;
      const rightPressed = (e.buttons & 2) === 2;
      this.isPainting = leftPressed;
      this.isErasing = rightPressed;
    }
  };
  #onPointerCancel = (e) => {
    this.isPainting = false;
    this.isErasing = false;

    if (this.#activePointerId === e.pointerId) {
      try {
        this.#canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
      this.#activePointerId = null;
      this.#activeButton = null;
    }
  };
  #onWindowPointerUp = (e) => {
    this.isPainting = false;
    this.isErasing = false;
    this.#activePointerId = null;
    this.#activeButton = null;
  };
  #onVisibilityChange = () => {
    if (document.hidden) {
      this.isPainting = false;
      this.isErasing = false;
      this.#activePointerId = null;
      this.#activeButton = null;
    }
  };
  #onWheel = (e) => {
    e.preventDefault();
    this.shouldChangeBrushSize = true;
    this.changeBrushSizeDir = e.deltaY;
  };

  #onContextMenu = (e) => {
    e.preventDefault();
  };

  // Function to generate the overlay map for the circle outline
  #calculateBrushOutline(centerX, centerY) {
    const radius = this.#currentBrushSize;
    const pixels = [];
    const r = 227;
    const g = 227;
    const b = 227;
    const a = 180;

    const width = this.#renderer.renderWidth;
    const height = this.#renderer.renderHeight;
    const offsets = [-1, 1];

    const plotOctets = (x, y) => {
      for (const bigY of offsets) {
        for (const bigX of offsets) {
          const newX = centerX + x * bigX;
          const newY = centerY + y * bigY;
          const newx = centerX + y * bigX;
          const newy = centerY + x * bigY;

          if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
            const index = newY * width + newX;
            pixels.push({ index: index, r: r, g: g, b: b, a: a });
          }
          if (newx >= 0 && newx < width && newy >= 0 && newy < height) {
            const index = newy * width + newx;
            pixels.push({ index: index, r: r, g: g, b: b, a: a });
          }
        }
      }
    };

    let x = radius;
    let y = 0;
    let P = radius - radius;

    plotOctets(x, y);

    while (y < x) {
      y++;
      if (P < 0) {
        P += 2 * y + 1;
      } else {
        x--;
        P += 2 * (y - x) + 1;
      }
      plotOctets(x, y);
    }
    return pixels;
  }

  // Update particle palette html element
  #updateParticlePalette(categoryButton) {
    if (!categoryButton) return;

    // Unselect old category button and selected the new one
    this.#selectedCategoryButton.classList.remove("selected");
    categoryButton.classList.add("selected");

    // Update selected category
    this.#selectedCategoryButton = categoryButton;
    const newSelectedCategory = parseInt(categoryButton.dataset.categoryId);
    this.#selectedCategory = newSelectedCategory ? newSelectedCategory : CATEGORY.SAND;

    // ! Todo : Show only the relevant UI control based on the selected category

    // Update particle buttons to only show particles of selected category
    let particleButtonToSelect =
      PARTICLE_DATA[this.#selectedParticle].CATEGORY === this.#selectedCategory ? this.#selectedParticleButton : null;

    document.querySelectorAll(".particle-button").forEach((button) => {
      if (parseInt(button.dataset.category) === this.#selectedCategory) {
        button.style.display = "";

        // Get the first button of selected category to be selected if no initial button was selected
        if (!particleButtonToSelect) particleButtonToSelect = button;
      } else button.style.display = "none";
    });

    // Update select particle
    this.#updateSelectedParticle(particleButtonToSelect);
  }

  #updateSelectedParticle(particleButton) {
    // Do not update selected particle if no valid particle button is given
    if (!particleButton) return;

    // Unselect old particle button and selected the new one
    this.#selectedParticleButton.classList.remove("selected");
    particleButton.classList.add("selected");

    // Update selected particle and selected particle button
    this.#selectedParticleButton = particleButton;
    const newSelectedParticle = parseInt(particleButton.dataset.particleId);
    this.#selectedParticle = newSelectedParticle ? newSelectedParticle : PARTICLE.EMPTY;
  }
}
