module.exports = class Coords {
  constructor(latitude, longitude) {
    if (!latitude || !longitude) {
      throw new Error('Must include both latitude and longitude');
    }

    latitude = Number(latitude);
    longitude = Number(longitude);

    this.latitude = Number(latitude.toFixed(1));
    this.longitude = Number(longitude.toFixed(1));
  }

  toString() {
    return `${this.latitude}_${this.longitude}`;
  }
}