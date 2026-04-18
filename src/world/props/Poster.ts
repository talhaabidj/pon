/**
 * Poster — Wall poster / art print.
 * Creates a simple framed rectangle with a colored fill.
 */

import * as THREE from 'three';

const POSTER_COLORS = [0x7c6ef0, 0xf06e7c, 0x6ef0c0, 0xf0c06e];

export function createPoster(colorIndex = 0): THREE.Group {
  const poster = new THREE.Group();
  poster.name = 'poster';

  const color = POSTER_COLORS[colorIndex % POSTER_COLORS.length]!;

  // —— Frame ——
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.5,
    metalness: 0.3,
  });
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.55, 0.02),
    frameMat,
  );
  poster.add(frame);

  // —— Art fill (colored plane) ——
  const artMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    emissive: color,
    emissiveIntensity: 0.05,
  });
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.49),
    artMat,
  );
  art.position.z = 0.011;
  poster.add(art);

  return poster;
}
