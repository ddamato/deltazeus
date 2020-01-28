import fetch from 'node-fetch';
import Coords from './coords.js';

export default async function getCoordsByPostal(postal) {
  const base = `https://geocode.xyz/?auth=${process.env.GEOCODEXYZ_API_KEY}`;
  const { latt, longt } = await fetch(`${base}&locate=${postal}&json=1`).then((res) => res.json())
  return new Coords(latt, longt);
}