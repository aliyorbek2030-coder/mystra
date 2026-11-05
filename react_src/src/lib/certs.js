import { CQ, CM, CS } from './certData';

const randomItem = items =>
  items[Math.floor(Math.random() * items.length)];

// Use only for a frontend preview; this does not create a real certificate.
export function buildCert(student, avgScore, date) {
  return {
    quote: randomItem(CQ),
    msg: randomItem(CM),
    style: CS[Math.floor(Date.now() / 1000) % CS.length],
    date: date || new Date().toISOString(),
    avgScore,
  };
}

// Certificates are created by Django when a qualifying record is approved.
// Do not create certificates in localStorage.
export function giveCert() {
  console.warn(
    'giveCert() is deprecated. Django creates certificates automatically.'
  );
  return false;
}