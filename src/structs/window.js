export class Window {
  // DOM elements
  hostElement = null;
  #window;
  #titlebar;
  #closeButton;
  #pinButton;
  #container;

  // Flags
  #isDragging = false;

  // States
  #dragOffsetX = 0;
  #dragOffsetY = 0;
  constructor(x, y, hostElement, title = "New Window") {
    if (!(hostElement instanceof Element)) {
      console.error("Invalid html host element for window!");
      return;
    }

    this.hostElement = hostElement;
    this.#initWindow(x, y, this.hostElement, title);
    this.#addEventListener();

    for (let i = 0; i < 30; i++) {
      const buhhun = document.createElement("button");
      buhhun.classList.add("ui-window__content__Button");
      buhhun.textContent = "This is a buhhun";
      this.#container.appendChild(buhhun);
    }
  }
  destroy() {
    this.#closeWindow();
  }

  // --------- INITIALIZE WINDOW ---------
  #initWindow(x, y, hostElement, title) {
    // Create the main window element
    const window = document.createElement("div");
    window.classList.add("ui-window");
    hostElement.appendChild(window);
    this.#window = window;

    // Create title bar element
    const titlebar = document.createElement("div");
    titlebar.classList.add("ui-window__titlebar");
    titlebar.innerText = title;
    this.#window.appendChild(titlebar);
    this.#titlebar = titlebar;

    // Create a contianer for title buttons
    const controlsContainer = document.createElement("div");
    controlsContainer.classList.add("ui-window__controls");
    this.#titlebar.appendChild(controlsContainer);

    // Create pin and close buttons
    const pinIcon = document.createElement("img");
    pinIcon.src = "./assets/icons/pin.svg";

    const pinButton = document.createElement("button");
    pinButton.classList.add("ui-window__title-button");
    pinButton.appendChild(pinIcon);
    controlsContainer.appendChild(pinButton);
    this.#pinButton = pinButton;

    const closeIcon = document.createElement("img");
    closeIcon.src = "./assets/icons/close.svg";

    const closeButton = document.createElement("button");
    closeButton.classList.add("ui-window__title-button");
    closeButton.appendChild(closeIcon);
    controlsContainer.appendChild(closeButton);
    this.#closeButton = closeButton;

    // Create window content container
    const container = document.createElement("div");
    container.classList.add("ui-window__content");
    this.#window.appendChild(container);
    this.#container = container;

    // Set initial position
    this.#window.style.left = `${x}px`;
    this.#window.style.top = `${y}px`;
  }
  #addEventListener() {
    // Dragging behaviour
    this.#titlebar.addEventListener("pointerdown", this.#onPointerDown);
    this.#titlebar.addEventListener("pointermove", this.#onPointerMove);
    this.#titlebar.addEventListener("pointerup", this.#onPointerUp);

    // Title buttons behavior
    this.#closeButton.addEventListener("click", this.#onCloseButtonClick);
    this.#closeButton.addEventListener("pointerdown", this.#stopDragPropagation);

    // Viewport resize behaviour
    window.addEventListener("resize", this.#onViewportResize);
  }
  #onPointerDown = (e) => {
    e.stopPropagation();

    if (e.button === 0) {
      this.#titlebar.setPointerCapture(e.pointerId);
      const rect = this.#window.getBoundingClientRect();
      this.#dragOffsetX = e.clientX - rect.left;
      this.#dragOffsetY = e.clientY - rect.top;

      this.#isDragging = true;
    } else {
      this.#isDragging = false;
    }
  };
  #onPointerUp = (e) => {
    if (this.#isDragging) {
      this.#titlebar.releasePointerCapture(e.pointerId);
      this.#isDragging = false;
    }
  };
  #onPointerMove = (e) => {
    if (this.#isDragging) {
      const newX = e.clientX - this.#dragOffsetX;
      const newY = e.clientY - this.#dragOffsetY;
      this.#moveWindow(newX, newY);
    }
  };
  #onCloseButtonClick = (e) => {
    this.#closeWindow();
  };
  #onViewportResize = (e) => {
    this.#snapWindowBacc();
  };
  #stopDragPropagation = (e) => {
    e.stopPropagation();
  };

  // --------- WINDOW TITLE BUTTONS ---------
  #closeWindow() {
    // Clean up global event listeners
    window.removeEventListener("resize", this.#onViewportResize);

    // Remove this window element from the DOM
    if (this.#window && this.#window.parentElement) {
      this.#window.parentElement.removeChild(this.#window);
    }

    // ! Todo: Notify the window manager...

    // Destroy each elements within this window element
    this.hostElement = null;
    this.#window = null;
    this.#titlebar = null;
    this.#closeButton = null;
    this.#pinButton = null;
    this.#container = null;
  }

  // Move the window's position
  #moveWindow(x, y) {
    // Get the current dimensions of this window element
    const windowWidth = this.#window.offsetWidth;
    const windowHeight = this.#window.offsetHeight;

    // Clamp the position to the viewport
    const finalX = Math.max(0, Math.min(x, window.innerWidth - windowWidth));
    const finalY = Math.max(0, Math.min(y, window.innerHeight - windowHeight));

    // Apply the final position
    this.#window.style.left = `${finalX}px`;
    this.#window.style.top = `${finalY}px`;
  }

  // Snaps the current wondow back if it's outside the viewport
  #snapWindowBacc() {
    // Calculate the maximum allowed top, and left positions
    const windowWidth = this.#window.offsetWidth;
    const windowHeight = this.#window.offsetHeight;
    const maxX = Math.max(0, window.innerWidth - windowWidth);
    const maxY = Math.max(0, window.innerHeight - windowHeight);

    const currentX = this.#window.offsetLeft;
    const currentY = this.#window.offsetTop;
    let newX = currentX;
    let newY = currentY;

    // If the current x position is greater than the maximum allowed X position...
    if (currentX > maxX) {
      // ..Clamp it!
      newX = maxX;
    } else if (currentX < 0) {
      // Otherwise check the other direction and clamp it as well
      newX = 0;
    }

    // If the current Y position is greater than the maxumum allowed Y position...
    if (currentY > maxY) {
      //.Clamp it...
      newY = maxY;
    } else if (currentY < 0) {
      // You get the point
      newY = 0;
    }

    // Only apply the new positions if it's not inside the viewport
    if (newX !== currentX || newY !== currentY) {
      this.#window.style.left = `${newX}px`;
      this.#window.style.top = `${newY}px`;
    }
  }
}
