export function fixedCoords(latitude, longitude) {
  return { 
    latitude: Number(latitude.toFixed(1)),
    longitude: Number(longitude.toFixed(1))
  }
}

export function concatCoords({ latitude, longitude }) {
  return `${latitude}_${longitude}`;
}