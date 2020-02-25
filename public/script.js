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

const usePostalCheckbox = document.querySelector('.hiddenCheckbox')
const postalCodeInput = document.querySelector(".postalCode");
const getFeedButton = document.querySelector('.getFeed');
const feedLinkButton = document.querySelector('.feedLinkCopy');
const hiddenInput = document.querySelector('.hiddenInput');
const successSection = document.querySelector('.success');

getFeedButton.addEventListener('click', () => {
  if (usePostalCheckbox.checked) {
    validatePostal();
  } else {
    geolocationPermission();
  }
});

feedLinkButton.addEventListener('click', () => {
  hiddenInput.select();
  document.execCommand('copy');
  feedLinkButton.classList.add('copied');
});

function validatePostal() {
  if (!postalCodeInput.value) {
    alert('Please enter a postal code');
    return;
  }
  getFeed({
    postal: postalCodeInput.value,
    time: getDate(),
  });
}

function getDate() {
  return new Date().toISOString().replace(/T.*/, '');
}

function geolocationPermission() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(({ coords }, err) => {
      if (err) {
        alert('We were unable to locate your position, please enter a postal code instead');
        return;
      }
      getFeed({
        latitude: coords.latitude,
        longitude: coords.longitude,
        time: getDate(),
      });
    });
  }
}

function getFeed(payload) {
  const params = new URLSearchParams(payload).toString();
  fetch(`https://api.deltazeus.com/forecast?${params}`)
    .then((response) => response.json())
    .then(handleResponse);
}

function handleResponse({ rss, message }) {
  if (message) {
    alert(message);
    return;
  }

  if (rss) {
    feedLinkButton.textContent = rss;
    hiddenInput.value = rss;
    successSection.classList.add('show');
    successSection.scrollIntoView({behavior: 'smooth'});
  }
}