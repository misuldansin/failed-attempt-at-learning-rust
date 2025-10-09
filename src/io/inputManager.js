import { CATEGORY, CATEGORY_DATA, PARTICLE, PARTICLE_DATA } from "../structs/data.js";
import { Renderer } from "../io/renderer.js";

export class InputManager {
  // Dependencies
  #renderer;
  #canvas = document.getElementById("main-canvas");
  // Defaults
  #brushSizeSensitivity = 0.02;
  #maxBrushSize = 16;
  // States
  #currentBrushSize = 4;
  #currentSpeed = 25;
  #currentPressure = 0;
  #currentConcentration = 1;
  #selectedParticle = parseInt(PARTICLE.SAND); // The default selected particle
  #selectedCategory = parseInt(CATEGORY.SAND);
  // UI element refs
  #selectedParticleButton;
  #selectedCategoryButton;
  // Event handler flags
  #latestMouseCoords = { x: 0, y: 0 };
  #isMouseDown = false;
  #shouldChangeBrushSize = false;
  #changeBrushSizeDir = 0.0;

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

  processUIThisFrame(grid) {
    // Handle UI rendering
    const mousePosition = this.#getMousePositionOnGrid();

    const brushOutlineOverlay = this.#calculateBrushOutline(mousePosition.x, mousePosition.y);
    this.#renderer.queueOverlayPixels(brushOutlineOverlay);

    // Handle update UI

    // Paint particles
    if (this.#isMouseDown) {
      const x = mousePosition.x;
      const y = mousePosition.y;
      const brushSize = this.#currentBrushSize;
      const particleData = PARTICLE_DATA[this.#selectedParticle];
      const concentration = this.#currentConcentration;

      grid.fillCircleAt(x, y, brushSize, particleData, concentration);
    }

    // Change brush size
    if (this.#shouldChangeBrushSize) {
      // Calculate new brush size
      const scrollDelta = this.#changeBrushSizeDir * this.#brushSizeSensitivity;
      let newSize = this.#currentBrushSize - scrollDelta;
      // Clamp it between 0 and max brush size
      newSize = Math.floor(newSize);
      newSize = Math.min(this.#maxBrushSize, newSize);
      newSize = Math.max(0, newSize);
      // Set the new brush size
      this.#currentBrushSize = newSize;

      this.#changeBrushSizeDir = 0;
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
      newButton.style.backgroundColor = particle.COLOR;

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

    // Update UI elements
    // ..

    // Add event listerners
    canvas.addEventListener("mousedown", this.#handleCanvasMouseDown);
    canvas.addEventListener("mouseup", this.#handleCanvasMouseUp);
    canvas.addEventListener("mousemove", this.#handleCanvasMouseMove);
    canvas.addEventListener("wheel", this.#handleCanvasWheel);
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
  #handleCanvasMouseDown = (e) => {
    this.#isMouseDown = true;
  };
  #handleCanvasMouseUp = (e) => {
    this.#isMouseDown = false;
  };
  #handleCanvasMouseMove = (e) => {
    this.#latestMouseCoords.x = e.clientX;
    this.#latestMouseCoords.y = e.clientY;
  };
  #handleCanvasWheel = (e) => {
    // Prevent the page from scrolling
    e.preventDefault();
    this.#shouldChangeBrushSize = true;
    this.#changeBrushSizeDir = e.deltaY;
  };

  // Returns a 2d vector of the current mouse position
  #getMousePositionOnGrid() {
    // Get canvas dimensions
    const rect = this.#canvas.getBoundingClientRect();
    const scaleX = this.#canvas.width / rect.width;
    const scaleY = this.#canvas.height / rect.height;

    // Calculate mouse position relative to the canvas
    const x = (this.#latestMouseCoords.x - rect.left) * scaleX;
    const y = (this.#latestMouseCoords.y - rect.top) * scaleY;

    // Return clamped mouse position for a discreet grid
    return { x: Math.floor(x), y: Math.floor(y) };
  }

  // Function to generate the overlay map for the circle outline
  #calculateBrushOutline(centerX, centerY) {
    const radius = this.#currentBrushSize;
    const pixels = [];
    const r = 227;
    const g = 227;
    const b = 227;
    const a = 175;

    const calculateIndex = (x, y) => {
      return y * this.#renderer.renderWidth + x;
    };
    const plotOctets = (x, y) => {
      pixels.push({ index: calculateIndex(centerX + x, centerY + y), r: r, g: g, b: b, a: a });
      pixels.push({ index: calculateIndex(centerX - x, centerY + y), r: r, g: g, b: b, a: a });
      pixels.push({ index: calculateIndex(centerX + x, centerY - y), r: r, g: g, b: b, a: a });
      pixels.push({ index: calculateIndex(centerX - x, centerY - y), r: r, g: g, b: b, a: a });

      pixels.push({ index: calculateIndex(centerX + y, centerY + x), r: r, g: g, b: b, a: a });
      pixels.push({ index: calculateIndex(centerX - y, centerY + x), r: r, g: g, b: b, a: a });
      pixels.push({ index: calculateIndex(centerX + y, centerY - x), r: r, g: g, b: b, a: a });
      pixels.push({ index: calculateIndex(centerX - y, centerY - x), r: r, g: g, b: b, a: a });
    };

    let x = radius;
    let y = 0;
    let P = 1 - radius;

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
