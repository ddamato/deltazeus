import axios from 'axios';
import Coords from './coords.js';

export default async function getCoordsByPostal(postal) {
  const base = `https://geocode.xyz/?auth=${process.env.GEOCODEXYZ_API_KEY}`;
  try {
    const { data } = await axios.get(`${base}&locate=${postal}&json=1`);
    return new Coords(data.latt, data.longt);
  } catch (err) {
    throw new Error(err);
  }
}