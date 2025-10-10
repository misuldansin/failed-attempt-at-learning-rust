export const Utility = {
  lerp(a, b, t) {
    return a + (b - a) * t;
  },
  shuffleArray(arrayToShuffle) {
    const shuffledArray = [...arrayToShuffle];

    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  },
  repose(reposeAngle) {
    let directions = [];

    for (let y = 1; y <= 1; y++) {
      directions.push([{ dx: 0, dy: y }]);

      // Calculate the max dx [tan(repose angle in rads) * dy]
      let maxDx = Math.round(y / Math.tan(reposeAngle * (Math.PI / 180)));
      // maxDx = Math.min(maxDx, 4);
      if (maxDx > 4) continue;

      for (let x = 1; x <= maxDx; x++) {
        directions.push([
          { dx: x, dy: y },
          { dx: -1 * x, dy: y },
        ]);
      }
    }

    return directions;
  },
};
