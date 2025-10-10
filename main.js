import { Renderer } from "./src/io/renderer.js";
import { Engine } from "./src/core/engine.js";
import { InputManager } from "./src/io/inputManager.js";
import { Settings } from "./src/settings.js";
import { Debug } from "./src/io/debug.js";

const renderer = new Renderer(Settings.GAMEWIDTH, Settings.GAMEHEIGHT);
const inputManager = new InputManager(renderer);
const debug = new Debug(document.getElementById("main-panel"), true, false);
const engine = new Engine(Settings.GAMEWIDTH, Settings.GAMEHEIGHT, renderer, inputManager, debug);

engine.start();
