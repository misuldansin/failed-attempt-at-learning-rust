export const Color = {
  hexToRGBA(hex) {
    if (!hex) return new Uint8ClampedArray([0, 0, 0, 255]);
    const h = hex.replace("#", "");
    const bigint = parseInt(h.length === 6 ? h + "FF" : h, 16);
    return new Uint8ClampedArray([(bigint >> 24) & 255, (bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]);
  },
  RGBAToHex(rgba) {
    const [r, g, b, a = 255] = rgba;
    const toHex = (v) => v.toString(16).padStart(2, "0");

    if (a === 255) {
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    } else {
      return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`.toUpperCase();
    }
  },
  colorBetween(start, end, t) {
    const dr = end[0] - start[0];
    const dg = end[1] - start[1];
    const db = end[2] - start[2];
    const da = end[3] - start[3];
    return new Uint8ClampedArray([start[0] + dr * t, start[1] + dg * t, start[2] + db * t, start[3] + da * t]);
  },
  generateGradient(start, end, resolution = 6) {
    const dr = end[0] - start[0];
    const dg = end[1] - start[1];
    const db = end[2] - start[2];
    const da = end[3] - start[3];
    const step = 1 / (resolution - 1);
    const colors = new Array(resolution);
    for (let i = 0; i < resolution; i++) {
      const t = i * step;
      colors[i] = new Uint8ClampedArray([start[0] + dr * t, start[1] + dg * t, start[2] + db * t, start[3] + da * t]);
    }
    return colors;
  },
  pickContrastColor(baseColor, lightColor = [255, 255, 255, 255], darkColor = [50, 50, 56, 255]) {
    const r = baseColor[0];
    const g = baseColor[1];
    const b = baseColor[2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 210 ? lightColor : darkColor;
  },
  invertColor(rgba) {
    return {
      r: 255 - rgba.r,
      g: 255 - rgba.g,
      b: 255 - rgba.b,
      a: 255 - rgba.a,
    };
  },
};
