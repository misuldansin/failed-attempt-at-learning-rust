export class Color {
  rgba = new Uint8ClampedArray(4);

  constructor(hexStr, alpha = 255) {
    const [r, g, b] = this.hexToRGB(hexStr);

    this.rgba[0] = r;
    this.rgba[1] = g;
    this.rgba[2] = b;
    this.rgba[3] = alpha;
  }
  get r() {
    return this.rgba[0];
  }
  get g() {
    return this.rgba[1];
  }
  get b() {
    return this.rgba[2];
  }
  get a() {
    return this.rgba[3];
  }
  hexToRGB(hexStr) {
    // Return black for not correctly encoded hex
    if (!hexStr) return [0, 0, 0];

    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hexStr = hexStr.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexStr);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
  }
  clone() {
    const newColor = new Color("#000000");
    newColor.rgba.set(this.rgba);
    return newColor;
  }
}
