import { Renderer } from "./src/io/renderer.js";
import { Engine } from "./src/core/engine.js";
import { InputManager } from "./src/io/inputManager.js";
import { Settings } from "./src/settings.js";
import { Debug } from "./src/io/debug.js";

const gameWidth = Settings.GAME_WIDTH;
const gameHeight = Settings.GAME_HEIGHT;

const renderer = new Renderer(gameWidth, gameHeight);
const inputManager = new InputManager(gameWidth, gameHeight, renderer);
const debug = new Debug(
  document.getElementById("main-panel"),
  Settings.DEBUG_START_ENABLED,
  Settings.DEBUG_OVERLAY_START_ENABLED
);
const engine = new Engine(gameWidth, gameHeight, renderer, inputManager, debug);

engine.start();
