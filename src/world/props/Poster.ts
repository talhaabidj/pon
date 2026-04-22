/**
 * Poster — Wall poster / art print.
 * Creates a simple framed rectangle with a colored fill.
 */

import * as THREE from 'three';

const POSTER_COLORS = [0x7c6ef0, 0xf06e7c, 0x6ef0c0, 0xf0c06e];
const CAT_POSTER_INDEX = 1;

const catArtTexture = new THREE.TextureLoader().load('/cat.png');
catArtTexture.colorSpace = THREE.SRGBColorSpace;
catArtTexture.wrapS = THREE.ClampToEdgeWrapping;
catArtTexture.wrapT = THREE.ClampToEdgeWrapping;

export function createPoster(colorIndex = 0): THREE.Group {
  const poster = new THREE.Group();
  poster.name = 'poster';

  const isCatPoster = colorIndex === CAT_POSTER_INDEX;
  const color = POSTER_COLORS[colorIndex % POSTER_COLORS.length]!;

  // —— Frame ——
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x5f5a54,
    roughness: 0.58,
    metalness: 0.18,
  });
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.55, 0.024),
    frameMat,
  );
  poster.add(frame);

  // Inner matte board gives depth and separates art from frame.
  const matBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.355, 0.505, 0.008),
    new THREE.MeshStandardMaterial({
      color: 0xf2ece3,
      roughness: 0.9,
    }),
  );
  matBoard.position.z = 0.009;
  poster.add(matBoard);

  // —— Art fill (colored plane) ——
  const artMat = new THREE.MeshStandardMaterial({
    color: isCatPoster ? 0xffffff : color,
    roughness: isCatPoster ? 0.86 : 0.8,
    emissive: isCatPoster ? 0x000000 : color,
    emissiveIntensity: isCatPoster ? 0 : 0.04,
    ...(isCatPoster ? { map: catArtTexture } : {}),
  });
  const art = new THREE.Mesh(
    new THREE.BoxGeometry(0.318, 0.458, 0.002),
    artMat,
  );
  art.position.z = 0.013;
  poster.add(art);

  if (!isCatPoster) {
    // Layered internal design with crisp, non-overlapping geometry.
    const designMatStrong = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
      roughness: 0.9,
    });
    const designMatSoft = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.09,
      roughness: 0.9,
    });

    const borderInset = new THREE.Mesh(
      new THREE.BoxGeometry(0.286, 0.426, 0.0015),
      designMatSoft,
    );
    borderInset.position.set(0, 0, 0.0141);
    poster.add(borderInset);

    for (let i = 0; i < 4; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.33, 0.0013),
        designMatSoft,
      );
      const x = -0.11 + i * 0.065;
      stripe.position.set(x, 0.04, 0.0144);
      stripe.rotation.z = colorIndex % 2 === 0 ? -0.03 : 0.03;
      poster.add(stripe);
    }

    const diagonalBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.036, 0.0014),
      designMatStrong,
    );
    diagonalBand.position.set(-0.02, -0.11, 0.0146);
    diagonalBand.rotation.z = colorIndex % 2 === 0 ? -0.2 : 0.2;
    poster.add(diagonalBand);

    const motif = new THREE.Mesh(
      new THREE.RingGeometry(0.042, 0.056, 24),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.14,
        roughness: 0.85,
        side: THREE.DoubleSide,
      }),
    );
    motif.position.set(0.08, -0.09, 0.0148);
    poster.add(motif);
  }

  // Very subtle glass sheen.
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.325, 0.466),
    new THREE.MeshBasicMaterial({
      color: 0xe9f2ff,
      transparent: true,
      opacity: 0.06,
    }),
  );
  glass.position.set(0.004, 0.003, 0.0145);
  poster.add(glass);

  // Hanging details (hook + wire).
  const hook = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.01, 10),
    new THREE.MeshStandardMaterial({ color: 0x9d9992, roughness: 0.45, metalness: 0.55 }),
  );
  hook.rotation.x = Math.PI / 2;
  hook.position.set(0, 0.285, 0.004);
  poster.add(hook);

  const wire = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.003, 0.003),
    new THREE.MeshStandardMaterial({ color: 0x7a746c, roughness: 0.65, metalness: 0.15 }),
  );
  wire.position.set(0, 0.268, 0.003);
  poster.add(wire);

  return poster;
}
