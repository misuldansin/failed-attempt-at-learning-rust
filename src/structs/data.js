// CATEGORY DEFINITIONS
// --------------------------------------------------------
// Each category must have a unique numeric ID
// ========================================================
export const CATEGORY = Object.freeze({
  ANY: 0,
  SOLID: 1,
  LIQUID: 2,
  GAS: 3,
  SAND: 4,
  ELECTRONICS: 5,
});

// PARTICLE DEFINITIONS
// --------------------------------------------------------
// Each particle must have a unique numeric ID
// ========================================================
export const PARTICLE = Object.freeze({
  // --- Utility (0-9) ---
  ANY: 0,

  // --- Solids (10–99) ---
  EMPTY: 10,
  STONE: 11,
  WALL: 12,
  WOOD: 13,
  METAL: 14,
  ICE: 15,
  GLASS: 16,

  // --- Liquids (100–199) ---
  WATER: 100,
  OIL: 101,
  LAVA: 102,
  MUD: 103,
  ACID: 104,
  STEAM: 105,
  ALCOHOL: 106,

  // --- Gases (200–299) ---
  SMOKE: 200,
  FIRE: 201,
  CHLORINE: 202,
  HYDROGEN: 203,
  VAPOR: 204,

  // --- Sands (300–399) ---
  SAND: 300,
  WET_SAND: 301,
  DUST: 302,
  GRAVEL: 303,
  VOLCANIC_ASH: 304,
  COARSE_GRAVEL: 305,
  QUARTZ_SAND: 306,

  // ---Electronics (400–499) ---
  POWER: 400,
  OUTLET: 401,
  GROUND: 402,
  SOURCE: 403,
  DRAIN: 404,
  BASE: 405,
  TERMINAL: 406,
  WIRE: 407,
  COPPER_WIRE: 408,
  SILVER_WIRE: 409,
  RESISTOR: 411,
  CAPACITOR: 412,
  INDUCTOR: 413,
  DIODE: 414,
  TRANSISTOR: 415,
  LED: 416,
  BATTERY: 417,
});

// CATEGORY DATA
// --------------------------------------------------------
// Contains metadata for each CATEGORY type
// ========================================================
export const CATEGORY_DATA = Object.freeze({
  [CATEGORY.SOLID]: {
    ID: CATEGORY.SOLID,
    NAME: "Solids",
    ICON: "./assets/icons/solid.svg",
  },
  [CATEGORY.LIQUID]: {
    ID: CATEGORY.LIQUID,
    NAME: "Liquids",
    ICON: "./assets/icons/liquid.svg",
  },
  [CATEGORY.GAS]: {
    ID: CATEGORY.GAS,
    NAME: "Gases",
    ICON: "./assets/icons/gas.svg",
  },
  [CATEGORY.SAND]: {
    ID: CATEGORY.SAND,
    NAME: "Sands",
    ICON: "./assets/icons/sand.svg",
  },
  [CATEGORY.ELECTRONICS]: {
    ID: CATEGORY.ELECTRONICS,
    NAME: "Electronics",
    ICON: "./assets/icons/electronics.svg",
  },
});

// PARTICLE DATA
// --------------------------------------------------------
// Contains metadata for each PARTICLE type
// ========================================================
export const PARTICLE_DATA = Object.freeze({
  // --- Solids ---
  [PARTICLE.EMPTY]: {
    ID: PARTICLE.EMPTY,
    NAME: "Empty",
    COLOR_BASE: "#0E0E11", // 0E0E11 ? 19191D
    COLOR_VARIANT: "#0E0E11",
    CATEGORY: CATEGORY.SOLID,
    ISMOVABLE: false,
    DENSITY: 0,
  },

  [PARTICLE.STONE]: {
    ID: PARTICLE.STONE,
    NAME: "Stone",
    COLOR_BASE: "#7C7872",
    COLOR_VARIANT: "#5E5A55",
    CATEGORY: CATEGORY.SOLID,
    ISMOVABLE: false,
    DENSITY: 100,
  },

  [PARTICLE.WALL]: {
    ID: PARTICLE.WALL,
    NAME: "Wall",
    COLOR_BASE: "#9A9A9A",
    COLOR_VARIANT: "#7E7E7E",
    CATEGORY: CATEGORY.SOLID,
    ISMOVABLE: false,
    DENSITY: 9999,
  },

  [PARTICLE.WOOD]: {
    ID: PARTICLE.WOOD,
    NAME: "Wood",
    COLOR_BASE: "#9B6430",
    COLOR_VARIANT: "#70461F",
    CATEGORY: CATEGORY.SOLID,
    ISMOVABLE: false,
    DENSITY: 50,
  },

  [PARTICLE.METAL]: {
    ID: PARTICLE.METAL,
    NAME: "Metal",
    COLOR_BASE: "#B7B9C0",
    COLOR_VARIANT: "#8A8C91",
    CATEGORY: CATEGORY.SOLID,
    ISMOVABLE: false,
    DENSITY: 200,
  },

  [PARTICLE.ICE]: {
    ID: PARTICLE.ICE,
    NAME: "Ice",
    COLOR_BASE: "#C6E7F1",
    COLOR_VARIANT: "#A1D2E0",
    CATEGORY: CATEGORY.SOLID,
    ISMOVABLE: false,
    DENSITY: 90,
  },

  [PARTICLE.GLASS]: {
    ID: PARTICLE.GLASS,
    NAME: "Glass",
    COLOR_BASE: "#A5E0E8",
    COLOR_VARIANT: "#79C6D0",
    CATEGORY: CATEGORY.SOLID,
    ISMOVABLE: false,
    DENSITY: 150,
  },

  // --- Liquids ---
  [PARTICLE.WATER]: {
    ID: PARTICLE.WATER,
    NAME: "Water",
    COLOR_BASE: "#3BA9E0",
    COLOR_VARIANT: "#2A8AC0",
    CATEGORY: CATEGORY.LIQUID,
    ISMOVABLE: true,
    DENSITY: 1,
    MAXCONCENTRATION: 10,
  },

  [PARTICLE.OIL]: {
    ID: PARTICLE.OIL,
    NAME: "Oil",
    COLOR_BASE: "#4B3A22",
    COLOR_VARIANT: "#3B2E1B",
    CATEGORY: CATEGORY.LIQUID,
    ISMOVABLE: true,
    DENSITY: 0.8,
    MAXCONCENTRATION: 15,
  },

  [PARTICLE.LAVA]: {
    ID: PARTICLE.LAVA,
    NAME: "Lava",
    COLOR_BASE: "#FF6B1A",
    COLOR_VARIANT: "#D13A00",
    CATEGORY: CATEGORY.LIQUID,
    ISMOVABLE: true,
    DENSITY: 3.5,
    MAXCONCENTRATION: 5,
  },

  [PARTICLE.MUD]: {
    ID: PARTICLE.MUD,
    NAME: "Mud",
    COLOR_BASE: "#7A4E26",
    COLOR_VARIANT: "#54361B",
    CATEGORY: CATEGORY.LIQUID,
    ISMOVABLE: true,
    DENSITY: 1.5,
    MAXCONCENTRATION: 8,
  },

  [PARTICLE.ACID]: {
    ID: PARTICLE.ACID,
    NAME: "Acid",
    COLOR_BASE: "#7EF14E",
    COLOR_VARIANT: "#5DC93A",
    CATEGORY: CATEGORY.LIQUID,
    ISMOVABLE: true,
    DENSITY: 1.1,
    MAXCONCENTRATION: 12,
  },

  [PARTICLE.STEAM]: {
    ID: PARTICLE.STEAM,
    NAME: "Steam",
    COLOR_BASE: "#DADADA",
    COLOR_VARIANT: "#B9B9B9",
    CATEGORY: CATEGORY.LIQUID,
    ISMOVABLE: true,
    DENSITY: 0.5,
    MAXCONCENTRATION: 20,
  },

  [PARTICLE.ALCOHOL]: {
    ID: PARTICLE.ALCOHOL,
    NAME: "Alcohol",
    COLOR_BASE: "#D9F0FA",
    COLOR_VARIANT: "#CBE4F2",
    CATEGORY: CATEGORY.LIQUID,
    ISMOVABLE: true,
    DENSITY: 0.78,
    MAXCONCENTRATION: 10,
  },

  // --- Gases ---
  [PARTICLE.SMOKE]: {
    ID: PARTICLE.SMOKE,
    NAME: "Smoke",
    COLOR_BASE: "#5A4740",
    COLOR_VARIANT: "#3E302A",
    CATEGORY: CATEGORY.GAS,
    ISMOVABLE: true,
    DENSITY: 0.1,
  },

  [PARTICLE.FIRE]: {
    ID: PARTICLE.FIRE,
    NAME: "Fire",
    COLOR_BASE: "#FF8C33",
    COLOR_VARIANT: "#E25822",
    CATEGORY: CATEGORY.GAS,
    ISMOVABLE: true,
    DENSITY: -0.1,
  },

  [PARTICLE.CHLORINE]: {
    ID: PARTICLE.CHLORINE,
    NAME: "Chlorine",
    COLOR_BASE: "#D6E64C",
    COLOR_VARIANT: "#C1D136",
    CATEGORY: CATEGORY.GAS,
    ISMOVABLE: true,
    DENSITY: 2.0,
  },

  [PARTICLE.HYDROGEN]: {
    ID: PARTICLE.HYDROGEN,
    NAME: "Hydrogen",
    COLOR_BASE: "#E1F2FF",
    COLOR_VARIANT: "#D1EBFF",
    CATEGORY: CATEGORY.GAS,
    ISMOVABLE: true,
    DENSITY: -0.5,
  },

  [PARTICLE.VAPOR]: {
    ID: PARTICLE.VAPOR,
    NAME: "Vapor",
    COLOR_BASE: "#BFBFBF",
    COLOR_VARIANT: "#AFAFAF",
    CATEGORY: CATEGORY.GAS,
    ISMOVABLE: true,
    DENSITY: 0.05,
  },

  // --- Sands ---
  [PARTICLE.SAND]: {
    ID: PARTICLE.SAND,
    NAME: "Sand",
    COLOR_BASE: "#E2C661",
    COLOR_VARIANT: "#C6A84D",
    CATEGORY: CATEGORY.SAND,
    ISMOVABLE: true,
    DENSITY: 2,
    REPOSE_ANGLE: 45,
  },
  [PARTICLE.WET_SAND]: {
    ID: PARTICLE.WET_SAND,
    NAME: "Wet Sand",
    COLOR_BASE: "#C4A74D",
    COLOR_VARIANT: "#8D7A3A",
    CATEGORY: CATEGORY.SAND,
    ISMOVABLE: true,
    DENSITY: 3,
    REPOSE_ANGLE: 55,
  },
  [PARTICLE.DUST]: {
    ID: PARTICLE.DUST,
    NAME: "Dust",
    COLOR_BASE: "#CFCBB8",
    COLOR_VARIANT: "#BEB8A3",
    CATEGORY: CATEGORY.SAND,
    ISMOVABLE: true,
    DENSITY: 1,
    REPOSE_ANGLE: 20,
  },
  [PARTICLE.GRAVEL]: {
    ID: PARTICLE.GRAVEL,
    NAME: "Gravel",
    COLOR_BASE: "#6A635A",
    COLOR_VARIANT: "#3F3B35",
    CATEGORY: CATEGORY.SAND,
    ISMOVABLE: true,
    DENSITY: 4,
    REPOSE_ANGLE: 30,
  },
  [PARTICLE.VOLCANIC_ASH]: {
    ID: PARTICLE.VOLCANIC_ASH,
    NAME: "Volcanic Ash",
    COLOR_BASE: "#474241",
    COLOR_VARIANT: "#2F2C2B",
    CATEGORY: CATEGORY.SAND,
    ISMOVABLE: true,
    DENSITY: 1.5,
    REPOSE_ANGLE: 15,
  },
  [PARTICLE.COARSE_GRAVEL]: {
    ID: PARTICLE.COARSE_GRAVEL,
    NAME: "Coarse Gravel",
    COLOR_BASE: "#7C7469",
    COLOR_VARIANT: "#686155",
    CATEGORY: CATEGORY.SAND,
    ISMOVABLE: true,
    DENSITY: 2.7,
    REPOSE_ANGLE: 50,
  },
  [PARTICLE.QUARTZ_SAND]: {
    ID: PARTICLE.QUARTZ_SAND,
    NAME: "Quartz Sand",
    COLOR_BASE: "#E1E0DA",
    COLOR_VARIANT: "#CBC9C2",
    CATEGORY: CATEGORY.SAND,
    ISMOVABLE: true,
    DENSITY: 2.3,
    REPOSE_ANGLE: 70,
  },

  // --- Electronics ---
  [PARTICLE.POWER]: {
    ID: PARTICLE.POWER,
    NAME: "Power",
    COLOR_BASE: "#E03A3A",
    COLOR_VARIANT: "#B62E2E",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.OUTLET]: {
    ID: PARTICLE.OUTLET,
    NAME: "Outlet",
    COLOR_BASE: "#FF9F1C",
    COLOR_VARIANT: "#D67A00",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.GROUND]: {
    ID: PARTICLE.GROUND,
    NAME: "Ground",
    COLOR_BASE: "#6E6A73",
    COLOR_VARIANT: "#504D54",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.SOURCE]: {
    ID: PARTICLE.SOURCE,
    NAME: "Source",
    COLOR_BASE: "#E27A3F",
    COLOR_VARIANT: "#B75C29",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.DRAIN]: {
    ID: PARTICLE.DRAIN,
    NAME: "Drain",
    COLOR_BASE: "#3F7AE2",
    COLOR_VARIANT: "#295CB7",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.BASE]: {
    ID: PARTICLE.BASE,
    NAME: "Base",
    COLOR_BASE: "#9B5F93",
    COLOR_VARIANT: "#7A3E73",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.TERMINAL]: {
    ID: PARTICLE.TERMINAL,
    NAME: "Terminal",
    COLOR_BASE: "#B3733A",
    COLOR_VARIANT: "#8F532B",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.WIRE]: {
    ID: PARTICLE.WIRE,
    NAME: "Wire",
    COLOR_BASE: "#B7B7B7",
    COLOR_VARIANT: "#8E8E8E",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.COPPER_WIRE]: {
    ID: PARTICLE.COPPER_WIRE,
    NAME: "Copper Wire",
    COLOR_BASE: "#B87333",
    COLOR_VARIANT: "#995C28",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.SILVER_WIRE]: {
    ID: PARTICLE.SILVER_WIRE,
    NAME: "Silver Wire",
    COLOR_BASE: "#E0E0E0",
    COLOR_VARIANT: "#BFBFBF",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.RESISTOR]: {
    ID: PARTICLE.RESISTOR,
    NAME: "Resistor",
    COLOR_BASE: "#E8D04C",
    COLOR_VARIANT: "#C2AA38",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.CAPACITOR]: {
    ID: PARTICLE.CAPACITOR,
    NAME: "Capacitor",
    COLOR_BASE: "#345995",
    COLOR_VARIANT: "#26406E",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.INDUCTOR]: {
    ID: PARTICLE.INDUCTOR,
    NAME: "Inductor",
    COLOR_BASE: "#8B5E3C",
    COLOR_VARIANT: "#6C462C",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.DIODE]: {
    ID: PARTICLE.DIODE,
    NAME: "Diode",
    COLOR_BASE: "#C0392B",
    COLOR_VARIANT: "#962D22",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.TRANSISTOR]: {
    ID: PARTICLE.TRANSISTOR,
    NAME: "Transistor",
    COLOR_BASE: "#222831",
    COLOR_VARIANT: "#1A1E25",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.LED]: {
    ID: PARTICLE.LED,
    NAME: "LED",
    COLOR_BASE: "#E6E940",
    COLOR_VARIANT: "#C4C72F",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
  [PARTICLE.BATTERY]: {
    ID: PARTICLE.BATTERY,
    NAME: "Battery",
    COLOR_BASE: "#FFB84C",
    COLOR_VARIANT: "#E0A040",
    CATEGORY: CATEGORY.ELECTRONICS,
    ISMOVABLE: false,
    DENSITY: 0,
  },
});
