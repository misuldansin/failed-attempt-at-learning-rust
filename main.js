import { Renderer } from "./src/io/renderer.js";
import { Engine } from "./src/core/engine.js";
import { InputManager } from "./src/io/inputManager.js";
import { Settings } from "./src/settings.js";
import { Debug } from "./src/io/debug.js";

const renderer = new Renderer(Settings.GAME_WIDTH, Settings.GAME_HEIGHT);
const inputManager = new InputManager(renderer);
const debug = new Debug(
  document.getElementById("main-panel"),
  Settings.DEBUG_START_ENABLED,
  Settings.DEBUG_OVERLAY_START_ENABLED
);
const engine = new Engine(Settings.GAME_WIDTH, Settings.GAME_HEIGHT, renderer, inputManager, debug);

engine.start();
