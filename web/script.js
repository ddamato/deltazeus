function repeatingLinearGradient() {
  const minColor = 200;
  const maxColor = 250;

  const percentThreshold = 40;
  let percent = 0;
  const colorStops = [];
  while(percent < 100) {
    const randColor = Math.floor(Math.random() * (maxColor - minColor + 1)) + minColor;
    const randPercent = Math.floor(Math.random() * percentThreshold);
    const color = `rgb(150, 0, ${randColor})`;
    const from = percent;
    const to = Math.min(percent + randPercent, 100);
    colorStops.push(`${color} ${from}% ${to}%`);
    percent = to;
  }

  const linearRepeatingGradient = `repeating-linear-gradient(60deg, ${colorStops.join(', ')});`
  document.body.setAttribute('style', `background: ${linearRepeatingGradient}`);
}

repeatingLinearGradient();