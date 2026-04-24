import * as THREE from 'three';

export interface WindowCurtainParams {
  backPaneW: number;
  sidePaneW: number;
  paneH: number;
  frameT: number;
}

export function addWindowCurtains(root: THREE.Group, params: WindowCurtainParams) {
  const blindRailMat = new THREE.MeshStandardMaterial({
    color: 0xb9c8da,
    roughness: 0.76,
    metalness: 0.04,
  });
  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0x6f7883,
    roughness: 0.92,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const curtainFoldMat = new THREE.MeshStandardMaterial({
    color: 0x606a75,
    roughness: 0.9,
  });
  const curtainAccentMat = new THREE.MeshStandardMaterial({
    color: 0x525b66,
    roughness: 0.88,
  });
  const curtainHighlightMat = new THREE.MeshStandardMaterial({
    color: 0x7c8793,
    roughness: 0.86,
  });
  const curtainFineLineMat = new THREE.MeshStandardMaterial({
    color: 0x454d57,
    roughness: 0.9,
  });
  const curtainHeight = params.paneH + params.frameT * 2;
  const curtainFoldHeight = curtainHeight - 0.01;
  const curtainCenterY = 0;
  const curtainCapY = params.paneH / 2 + params.frameT + 0.01;

  const backCurtainCenterX = -params.backPaneW - params.frameT - 0.06;
  const backCurtain = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, curtainHeight),
    curtainMat,
  );
  backCurtain.position.set(backCurtainCenterX, curtainCenterY, 0.05);
  root.add(backCurtain);

  for (const dx of [-0.11, -0.056, 0, 0.056, 0.11]) {
    const fold = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, curtainFoldHeight, 0.014),
      curtainFoldMat,
    );
    fold.position.set(backCurtainCenterX + dx, curtainCenterY, 0.056);
    root.add(fold);
  }

  const backCurtainCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.02, 0.018),
    blindRailMat,
  );
  backCurtainCap.position.set(backCurtainCenterX, curtainCapY, 0.05);
  root.add(backCurtainCap);

  const sideCurtainCenterZ = params.sidePaneW + params.frameT + 0.06;
  const sideCurtain = new THREE.Mesh(
    new THREE.BoxGeometry(0.013, curtainHeight, 0.178),
    curtainMat,
  );
  sideCurtain.position.set(-0.054, curtainCenterY, sideCurtainCenterZ);
  root.add(sideCurtain);

  const sideCurtainInner = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, curtainHeight - 0.032, 0.148),
    curtainAccentMat,
  );
  sideCurtainInner.position.set(-0.046, curtainCenterY, sideCurtainCenterZ);
  root.add(sideCurtainInner);

  const sideFoldOffsets = [-0.072, -0.048, -0.024, 0, 0.024, 0.048, 0.072] as const;
  sideFoldOffsets.forEach((dz, idx) => {
    const deeperFold = idx % 2 === 0;
    const fold = new THREE.Mesh(
      new THREE.BoxGeometry(deeperFold ? 0.013 : 0.011, curtainFoldHeight, deeperFold ? 0.012 : 0.01),
      curtainFoldMat,
    );
    fold.position.set(deeperFold ? -0.047 : -0.044, curtainCenterY, sideCurtainCenterZ + dz);
    root.add(fold);
  });

  for (const dz of [-0.06, -0.036, -0.012, 0.012, 0.036, 0.06] as const) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(0.005, curtainHeight - 0.028, 0.007),
      curtainAccentMat,
    );
    seam.position.set(-0.0415, curtainCenterY, sideCurtainCenterZ + dz);
    root.add(seam);

    const seamHighlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.002, curtainHeight - 0.036, 0.005),
      curtainHighlightMat,
    );
    seamHighlight.position.set(-0.039, curtainCenterY, sideCurtainCenterZ + dz);
    root.add(seamHighlight);
  }

  for (const dz of [-0.074, -0.06, -0.046, -0.032, -0.018, -0.004, 0.01, 0.024, 0.038, 0.052, 0.066] as const) {
    const fineLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, curtainHeight - 0.036, 0.004),
      curtainFineLineMat,
    );
    fineLine.position.set(-0.0365, curtainCenterY, sideCurtainCenterZ + dz);
    root.add(fineLine);
  }

  for (const dz of [-0.067, -0.039, -0.011, 0.017, 0.045, 0.073] as const) {
    const fineHighlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.0017, curtainHeight - 0.05, 0.003),
      curtainHighlightMat,
    );
    fineHighlight.position.set(-0.0345, curtainCenterY, sideCurtainCenterZ + dz);
    root.add(fineHighlight);
  }

  const sideCurtainValance = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.03, 0.19),
    curtainAccentMat,
  );
  sideCurtainValance.position.set(-0.049, curtainCapY - 0.01, sideCurtainCenterZ);
  root.add(sideCurtainValance);

  const sideCurtainTie = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.04, 0.108),
    blindRailMat,
  );
  sideCurtainTie.position.set(-0.044, 0.02, sideCurtainCenterZ);
  root.add(sideCurtainTie);

  const sideCurtainTieKnot = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.022, 0.03),
    blindRailMat,
  );
  sideCurtainTieKnot.position.set(-0.038, 0.02, sideCurtainCenterZ);
  root.add(sideCurtainTieKnot);

  const sideCurtainHem = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.018, 0.172),
    curtainAccentMat,
  );
  sideCurtainHem.position.set(-0.051, -curtainHeight / 2 + 0.009, sideCurtainCenterZ);
  root.add(sideCurtainHem);

  const sideCurtainCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.028, 0.206),
    blindRailMat,
  );
  sideCurtainCap.position.set(-0.055, curtainCapY - 0.004, sideCurtainCenterZ);
  root.add(sideCurtainCap);
}
