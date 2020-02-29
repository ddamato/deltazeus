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
  thresholdContainer: document.querySelector('.thresholds'),
  locationsContainer: document.querySelector('.locations'),
}

const DZ_API_URL = 'https://api.deltazeus.com';
const YANDEX_STATIC_MAP_URL = 'https://static-maps.yandex.ru/1.x'

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
    elem.controlsContainer.classList.add('is-loading');
    if (postalCodeInput.value) {
      payload = {
        postal: postalCodeInput.value,
        time,
      }
    }
  }

  if (navigator.geolocation) {
    // use geolocation
    elem.controlsContainer.classList.add('is-loading');
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
  fetch(`${DZ_API_URL}/forecast?${params}`)
    .then((response) => response.json())
    .then(handleResponse);
}

function getThresholds() {
  fetch(`${DZ_API_URL}/thresholds`)
    .then((response) => response.json())
    .then(handleThresholds);
}

function getActive() {
  fetch(`${DZ_API_URL}/active`)
    .then((response) => response.json())
    .then(handleActive);
}

function handleActive({ active }) {
  if (active.length < 2) {
    return;
  }

  elem.locationsContainer.innerHTML = '';

  const h2 = document.createElement('h2');
  h2.classList.add('h2');
  h2.textContent = 'Current feed locations';

  const params = createLocationQuery(active);
  const img = document.createElement('img');
  img.src = `${YANDEX_STATIC_MAP_URL}/?${params}`;

  elem.locationsContainer.appendChild(h2);
  elem.locationsContainer.appendChild(img);
}

function createLocationQuery(active) {
  const pt = active.map(({ latitude, longitude }) => `${longitude},${latitude},flag`).join('~');
  return new URLSearchParams({ l: 'map', lang: 'en_US', pt }).toString();
}

getActive();

function handleThresholds({ thresholds }) {
  elem.thresholdContainer.innerHTML = '';

  const h2 = document.createElement('h2');
  h2.classList.add('h2');
  h2.textContent = 'Current significant thresholds';

  const container = document.createElement('div');
  const table = document.createElement('table');
  table.classList.add('table');
  const ths = document.createElement('tr');
  const tds = document.createElement('tr');

  container.appendChild(table);
  elem.thresholdContainer.appendChild(h2);
  elem.thresholdContainer.appendChild(container);

  Object.keys(thresholds).forEach((threshold) => {
    const th = document.createElement('th');
    th.textContent = threshold;
    ths.appendChild(th);

    const td = document.createElement('td');
    td.textContent = thresholds[threshold];
    tds.appendChild(td);
  });
  table.appendChild(ths);
  table.appendChild(tds);
}

getThresholds();

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