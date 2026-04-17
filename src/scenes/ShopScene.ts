/**
 * Night gacha shop scene with task, economy, token conversion, and pull interactions.
 */
import {
  AmbientLight,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
} from 'three';
import { MACHINES } from '../data/machines';
import { GAME_CONFIG } from '../core/Config';
import type { CapsulePullResult } from '../systems/CapsuleSystem';
import type { GameContext, GameScene, SceneId } from '../core/Scene';
import type { WebGLRenderer } from 'three';

export class ShopScene implements GameScene {
  public readonly id: SceneId = 'shop';
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(
    GAME_CONFIG.camera.fov,
    1,
    GAME_CONFIG.camera.near,
    GAME_CONFIG.camera.far,
  );
  private readonly floorGeometry = new PlaneGeometry(9, 7);
  private readonly boxGeometry = new BoxGeometry(1, 1, 1);
  private readonly cylinderGeometry = new CylinderGeometry(0.24, 0.24, 0.9, 24);
  private readonly floorMaterial = new MeshStandardMaterial({ color: 0x151812, roughness: 0.82 });
  private readonly counterMaterial = new MeshStandardMaterial({ color: 0x303828, roughness: 0.7 });
  private readonly machineGroup = new Group();
  private overlay: HTMLElement | null = null;
  private context: GameContext | null = null;
  private notice = 'Shift checklist received. The machines are listening.';

  public constructor() {
    this.scene.background = new Color(0x0f110f);
    this.camera.position.set(0, 4.2, 6.5);
    this.camera.lookAt(0, 0.85, -0.55);
    this.buildShop();
  }

  public enter(context: GameContext): void {
    this.context = context;
    if (context.session.getSnapshot().tasks.length === 0) {
      context.session.beginNight();
    }
    this.syncMachineVisibility();
    this.renderOverlay();
  }

  public exit(): void {
    this.overlay?.remove();
    this.overlay = null;
  }

  public update(deltaSeconds: number): void {
    this.machineGroup.rotation.y = Math.sin(performance.now() * 0.0002) * deltaSeconds * 1.5;
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public render(renderer: WebGLRenderer): void {
    renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.exit();
    this.floorGeometry.dispose();
    this.boxGeometry.dispose();
    this.cylinderGeometry.dispose();
    this.floorMaterial.dispose();
    this.counterMaterial.dispose();
  }

  private buildShop(): void {
    const floor = new Mesh(this.floorGeometry, this.floorMaterial);
    floor.rotation.x = -Math.PI / 2;

    const backWall = new Mesh(this.boxGeometry, new MeshStandardMaterial({ color: 0x1a1d17 }));
    backWall.scale.set(9, 3.2, 0.12);
    backWall.position.set(0, 1.6, -3.5);

    const counter = new Mesh(this.boxGeometry, this.counterMaterial);
    counter.scale.set(2.4, 0.75, 0.85);
    counter.position.set(2.9, 0.45, -0.6);

    const sign = new Mesh(this.boxGeometry, new MeshStandardMaterial({ color: 0xff6f91 }));
    sign.scale.set(1.7, 0.38, 0.08);
    sign.position.set(0.5, 2.8, -3.42);

    for (const machine of MACHINES) {
      const body = new Group();
      const base = new Mesh(
        this.boxGeometry,
        new MeshStandardMaterial({
          color: machine.id === 'machine-wondertrade' ? 0xff6f91 : 0x273028,
          roughness: 0.56,
          metalness: 0.05,
        }),
      );
      base.scale.set(0.82, 1.2, 0.5);
      base.position.set(0, 0.6, 0);

      const globe = new Mesh(
        this.cylinderGeometry,
        new MeshStandardMaterial({ color: 0x4bd9be, roughness: 0.35, metalness: 0.02 }),
      );
      globe.rotation.z = Math.PI / 2;
      globe.position.set(0, 1.15, 0.28);

      const handle = new Mesh(
        this.cylinderGeometry,
        new MeshStandardMaterial({ color: 0xc9f46c, roughness: 0.5 }),
      );
      handle.scale.set(0.35, 0.35, 0.35);
      handle.rotation.x = Math.PI / 2;
      handle.position.set(0.27, 0.62, 0.31);

      body.add(base, globe, handle);
      body.position.set(machine.position.x, machine.position.y, machine.position.z);
      body.rotation.y = machine.position.rotationY;
      body.userData.machineId = machine.id;
      this.machineGroup.add(body);
    }

    const ambient = new AmbientLight(0xf7f7ef, 0.9);
    const strip = new DirectionalLight(0x4bd9be, 2.4);
    strip.position.set(-1.5, 4.5, 2.8);
    const counterLight = new DirectionalLight(0xff6f91, 1.3);
    counterLight.position.set(3, 2.5, 1);

    this.scene.add(floor, backWall, counter, sign, this.machineGroup, ambient, strip, counterLight);
  }

  private syncMachineVisibility(): void {
    if (!this.context) {
      return;
    }
    const unlocked = this.context.session.getSnapshot().unlockedMachineIds;
    this.machineGroup.children.forEach((child) => {
      const machineId = String(child.userData.machineId);
      child.visible = unlocked.includes(machineId);
    });
  }

  private renderOverlay(): void {
    if (!this.context) {
      return;
    }

    const snapshot = this.context.session.getSnapshot();
    const unlocked = new Set(snapshot.unlockedMachineIds);
    const tasks = snapshot.tasks;
    const overlay = document.createElement('div');
    overlay.className = 'scene-overlay shop-shell';
    overlay.innerHTML = `
      <header class="shop-hud">
        <div>
          <p class="eyebrow">Night ${snapshot.night}</p>
          <h2 data-testid="shop-title">Gacha Department Store</h2>
        </div>
        <div class="hud-pills">
          <span>${snapshot.clock}</span>
          <span>${tasks.filter((task) => task.completed).length}/${tasks.length} tasks</span>
          <span>${snapshot.money} yen</span>
          <span>${snapshot.tokens} tokens</span>
          <span>${snapshot.collectedCount}/${snapshot.totalItems} prizes</span>
        </div>
      </header>
      <section class="shop-panel task-panel" data-testid="task-panel">
        <p class="eyebrow">Checklist</p>
        ${tasks
          .map(
            (task) => `
              <button type="button" data-task-id="${task.id}" ${task.completed ? 'disabled' : ''}>
                <span>${task.completed ? 'Done' : 'Work'}</span>
                <strong>${task.label}</strong>
                <small>${task.reward} yen · ${task.minutes} min</small>
              </button>
            `,
          )
          .join('')}
      </section>
      <section class="shop-panel machine-panel">
        <p class="eyebrow">Counter and machines</p>
        <button type="button" data-testid="convert-tokens">Convert wages to tokens</button>
        <div class="machine-list">
          ${MACHINES.filter((machine) => unlocked.has(machine.id))
            .map(
              (machine) => `
                <button type="button" data-machine-id="${machine.id}" ${
                  snapshot.tokens < machine.tokenCost ? 'disabled' : ''
                }>
                  <strong>${machine.seriesName}</strong>
                  <span>${machine.tokenCost} token${machine.tokenCost > 1 ? 's' : ''}</span>
                </button>
              `,
            )
            .join('')}
        </div>
        <button type="button" class="end-shift" data-testid="end-shift">End Shift</button>
      </section>
      <footer class="context-prompt" data-testid="shop-notice">${this.notice}</footer>
    `;

    overlay.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const taskButton = target.closest<HTMLButtonElement>('[data-task-id]');
      const machineButton = target.closest<HTMLButtonElement>('[data-machine-id]');

      if (taskButton?.dataset.taskId) {
        this.completeTask(taskButton.dataset.taskId);
        return;
      }

      if (machineButton?.dataset.machineId) {
        this.pullMachine(machineButton.dataset.machineId);
        return;
      }

      if (target.closest('[data-testid="convert-tokens"]')) {
        const result = this.context?.session.convertAllMoneyToTokens();
        this.notice =
          result && result.tokensGained > 0
            ? `Converted ${result.moneySpent} yen into ${result.tokensGained} token(s).`
            : 'The counter clerk shakes the tray. Not enough wages for a token yet.';
        this.refreshOverlay();
      }

      if (target.closest('[data-testid="end-shift"]')) {
        const report = this.context?.session.endNight();
        this.context?.switchScene('end', { report });
      }
    });

    this.context.uiRoot.append(overlay);
    this.overlay = overlay;
  }

  private completeTask(taskId: string): void {
    if (!this.context) {
      return;
    }

    const task = this.context.session.completeTask(taskId);
    this.notice = `${task.targetName}: ${task.type.replace('_', ' ')} complete. +${task.reward} yen.`;
    this.refreshOverlay();
  }

  private pullMachine(machineId: string): void {
    if (!this.context) {
      return;
    }

    try {
      const result: CapsulePullResult = this.context.session.pullCapsule(machineId);
      this.context.switchScene('reveal', { result });
    } catch (error) {
      this.notice = error instanceof Error ? error.message : 'The handle refuses to turn.';
      this.refreshOverlay();
    }
  }

  private refreshOverlay(): void {
    this.overlay?.remove();
    this.overlay = null;
    this.renderOverlay();
  }
}
