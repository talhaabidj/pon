import * as THREE from 'three';

export interface BuiltShopTrash {
  group: THREE.Group;
}

interface TrashSpec {
  kind: 'paper' | 'can' | 'cup';
  x: number;
  z: number;
  rotY: number;
  tint: number;
}

// Sparse, fixed positions hugging the walls/corners so props never block the
// main walking paths or the machine service zones (Z≈-4.2 and Z≈-1.6 rows).
// Positions chosen well away from the exit opening (center at Z=+6).
const TRASH_SPECS: TrashSpec[] = [
  { kind: 'paper', x: -6.4, z: 5.1, rotY: 0.7, tint: 0xe8e2d4 },
  { kind: 'can', x: 6.35, z: 4.6, rotY: 1.3, tint: 0x9bb6c8 },
  { kind: 'cup', x: -6.3, z: 2.1, rotY: -0.5, tint: 0xfafafa },
  { kind: 'paper', x: 6.4, z: 1.4, rotY: 2.1, tint: 0xd9d2c0 },
  { kind: 'can', x: -6.35, z: -5.1, rotY: 0.2, tint: 0xb0452f },
  { kind: 'paper', x: -2.6, z: 5.55, rotY: -1.1, tint: 0xe2dcc8 },
];

function makePaper(tint: number): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: tint,
    roughness: 0.95,
    metalness: 0.02,
  });
  // Crumpled wad — low-poly icosahedron with a faint scale jitter.
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 0), mat);
  ball.scale.set(1.0, 0.78, 0.92);
  ball.position.y = 0.05;
  group.add(ball);
  return group;
}

function makeCan(tint: number): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: tint,
    roughness: 0.38,
    metalness: 0.72,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xbfc3c8,
    roughness: 0.34,
    metalness: 0.82,
  });
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.12, 14),
    bodyMat,
  );
  // Laid on its side.
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.032;
  group.add(body);
  const top = new THREE.Mesh(
    new THREE.CircleGeometry(0.032, 14),
    capMat,
  );
  top.rotation.y = Math.PI / 2;
  top.position.set(0.06, 0.032, 0);
  group.add(top);
  return group;
}

function makeCup(tint: number): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: tint,
    roughness: 0.82,
    metalness: 0.02,
  });
  // Truncated cone, tipped slightly.
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.028, 0.09, 14, 1, true),
    mat,
  );
  cup.rotation.z = 1.35;
  cup.position.set(0, 0.042, 0);
  group.add(cup);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x5a4433,
    roughness: 0.88,
  });
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.042, 0.006, 6, 14),
    rimMat,
  );
  rim.rotation.y = Math.PI / 2;
  rim.rotation.x = Math.PI / 2 + 1.35;
  rim.position.set(-0.042, 0.082, 0);
  group.add(rim);
  return group;
}

export function buildShopTrash(): BuiltShopTrash {
  const group = new THREE.Group();
  group.name = 'shop-trash';

  for (const spec of TRASH_SPECS) {
    let prop: THREE.Group;
    switch (spec.kind) {
      case 'paper':
        prop = makePaper(spec.tint);
        break;
      case 'can':
        prop = makeCan(spec.tint);
        break;
      case 'cup':
        prop = makeCup(spec.tint);
        break;
    }
    prop.position.set(spec.x, 0, spec.z);
    prop.rotation.y = spec.rotY;
    group.add(prop);
  }

  return { group };
}
