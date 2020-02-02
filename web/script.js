function repeatingLinearGradient() {
  const minColor = 10;
  const maxColor = 100;

  const percentThreshold = 40;
  let percent = 0;
  const colorStops = [];
  while (percent < 100) {
    const randColor =
      Math.floor(Math.random() * (maxColor - minColor + 1)) + minColor;
    const randPercent = Math.floor(Math.random() * percentThreshold);
    const color = `rgb(0, 0, ${randColor})`;
    const from = percent;
    const to = Math.min(percent + randPercent, 100);
    colorStops.push(`${color} ${from}% ${to}%`);
    percent = to;
  }

  const linearRepeatingGradient = `repeating-linear-gradient(60deg, ${colorStops.join(
    ", "
  )});`;
  document.body.setAttribute("style", `background: ${linearRepeatingGradient}`);
}

repeatingLinearGradient();

const toggle = document.querySelector(".toggleInput");
const inputWrapper = document.querySelector(".inputWrapper");
const postcodeInput = document.querySelector(".inputWrapper input");
toggle.addEventListener("click", () => {
  inputWrapper.classList.toggle("geolocation");
  if (inputWrapper.classList.contains("geolocation")) {
    toggle.dataset.label = 'postal code';
  } else {
    toggle.dataset.label = 'geolocation';
    postcodeInput.focus();
  }
});
