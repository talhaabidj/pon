import * as THREE from 'three';

export function addShopCeilingLighting(
  group: THREE.Group,
  fixtureCanopyMat: THREE.Material,
  fixtureDiffuserMat: THREE.Material,
) {
  const ambient = new THREE.AmbientLight(0xfff1de, 0.58);
  group.add(ambient);

  const hemi = new THREE.HemisphereLight(0xffead2, 0x1a1620, 0.3);
  group.add(hemi);

  const addCeilingFixture = (x: number, z: number, length = 2.4, rotationY = 0) => {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.08, 0.44),
      fixtureCanopyMat,
    );
    base.position.set(x, 3.96, z);
    base.rotation.y = rotationY;
    group.add(base);

    const diffuser = new THREE.Mesh(
      new THREE.BoxGeometry(length - 0.06, 0.04, 0.38),
      fixtureDiffuserMat,
    );
    diffuser.position.set(x, 3.9, z);
    diffuser.rotation.y = rotationY;
    group.add(diffuser);

    const light = new THREE.RectAreaLight(0xffdec2, 7.2, length - 0.08, 0.36);
    light.position.set(x, 3.88, z);
    light.rotation.x = -Math.PI / 2;
    light.rotation.z = -rotationY;
    group.add(light);
  };

  const fixturePositions: Array<[number, number, number]> = [
    [-4.8, -2.65, 0],
    [-1.6, -2.65, 0],
    [1.6, -2.65, 0],
    [4.8, -2.65, 0],
    [-4.8, 1.05, 0],
    [-1.6, 1.05, 0],
    [1.6, 1.05, 0],
    [4.8, 1.05, 0],
    [-4.8, 4.75, 0],
    [-1.6, 4.75, 0],
    [1.6, 4.75, 0],
    [4.8, 4.75, 0],
  ];
  fixturePositions
    .filter(([, z]) => z <= 1.05)
    .forEach(([x, z, rot]) => {
      addCeilingFixture(x, z, 2.4, rot);
    });

  const bounceLights = [
    { power: 700, position: [-4.8, 2.2, -1.9] as const },
    { power: 680, position: [4.3, 2.18, -1.3] as const },
    { power: 520, position: [0, 2.2, 3.0] as const },
  ];
  bounceLights.forEach((spec) => {
    const bounce = new THREE.PointLight(0xffd7ad, 1.0, 0, 2);
    bounce.power = spec.power;
    bounce.position.set(spec.position[0], spec.position[1], spec.position[2]);
    group.add(bounce);
  });
}
