function repeatingLinearGradient() {
  const minColor = 10;
  const maxColor = 100;

  const percentThreshold = 40;
  let percent = 0;
  const colorStops = [];
  while (percent < 100) {
    const randColor = Math.floor(Math.random() * (maxColor - minColor + 1)) + minColor;
    const randPercent = Math.floor(Math.random() * percentThreshold);
    const color = `rgb(0, 0, ${randColor})`;
    const from = percent;
    const to = Math.min(percent + randPercent, 100);
    colorStops.push(`${color} ${from}% ${to}%`);
    percent = to;
  }

  const linearRepeatingGradient = `repeating-linear-gradient(60deg, ${colorStops.join(", ")});`;
  document.body.setAttribute("style", `background: ${linearRepeatingGradient}`);
}

repeatingLinearGradient();

const elem = {
  controlsContainer: document.querySelector('.controls'),
  usePostalCheckbox: document.querySelector('.controls-usePostal'),
  postalCodeInput: document.querySelector('.controls-input'),
  getFeedButton: document.querySelector('.controls-getFeed'),
  copyMessageSpan: document.querySelector('.controls-copyMessage'),
}

async function handleClick() {
  if (this.dataset.feed) {
    // click to copy
    elem.postalCodeInput.select();
    document.execCommand('copy');
    elem.copyMessageSpan.textContent = 'Copied!';
    return;
  }
  
  const time = new Date().toISOString().replace(/T.*/, '');
  let payload;

  if (elem.usePostalCheckbox.checked) {
    // use postal
    if (postalCodeInput.value) {
      payload = {
        postal: postalCodeInput.value,
        time,
      }
    }
  }

  if (navigator.geolocation) {
    // use geolocation
    const position = await getPosition();
    if (position) {
      payload = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        time,
      }
    }
  }

  if (payload) {
    getFeed(payload);
  }
}

function getPosition(options) {
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));
}

elem.getFeedButton.addEventListener('click', handleClick);

function getFeed(payload) {
  const params = new URLSearchParams(payload).toString();
  elem.controlsContainer.classList.add('is-loading');
  fetch(`https://api.deltazeus.com/forecast?${params}`)
    .then((response) => response.json())
    .then(handleResponse);
}

function handleResponse({ rss, message }) {
  elem.controlsContainer.classList.remove('is-loading');
  elem.controlsContainer.classList.add('is-complete');

  if (message) {
    alert(message);
    return;
  }

  if (rss) {
    // overload the current postal code input for copying
    elem.postalCodeInput.value = rss;
    elem.getFeedButton.dataset.feed = rss;
  }
}