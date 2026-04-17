/**
 * End-of-night report scene summarizing task, economy, collection, and secret progress.
 */
import { Color, PerspectiveCamera, Scene } from 'three';
import { GAME_CONFIG } from '../core/Config';
import type { NightReport } from '../core/GameSession';
import type { GameContext, GameScene, SceneId, SceneTransitionPayload } from '../core/Scene';
import type { WebGLRenderer } from 'three';

export class EndScene implements GameScene {
  public readonly id: SceneId = 'end';
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(
    GAME_CONFIG.camera.fov,
    1,
    GAME_CONFIG.camera.near,
    GAME_CONFIG.camera.far,
  );
  private overlay: HTMLElement | null = null;

  public constructor() {
    this.scene.background = new Color(0x12140f);
    this.camera.position.set(0, 0, 2);
  }

  public enter(context: GameContext, payload?: SceneTransitionPayload): void {
    const report = (payload?.report as NightReport | undefined) ?? context.session.getLastReport();
    const overlay = document.createElement('div');
    overlay.className = 'scene-overlay end-shell';
    overlay.innerHTML = `
      <main class="end-report" data-testid="end-report">
        <p class="eyebrow">Shift report</p>
        <h2>Night ${report.night} closed at ${report.endedAt}</h2>
        <dl>
          <div><dt>Tasks</dt><dd>${report.tasksCompleted}/${report.tasksTotal}</dd></div>
          <div><dt>Wages</dt><dd>${report.wagesEarned} yen</dd></div>
          <div><dt>Tokens spent</dt><dd>${report.tokensSpent}</dd></div>
          <div><dt>Items gained</dt><dd>${report.itemsGained.length}</dd></div>
        </dl>
        <section>
          <h3>Capsules</h3>
          ${
            report.itemsGained.length > 0
              ? report.itemsGained
                  .map((result) => `<p>${result.item.name} · ${result.rarity}</p>`)
                  .join('')
              : '<p>No pulls this shift. The machines remember restraint.</p>'
          }
        </section>
        <section>
          <h3>Signals</h3>
          ${
            report.secrets.length > 0
              ? report.secrets.map((secret) => `<p>${secret}</p>`).join('')
              : '<p>Nothing impossible happened loudly.</p>'
          }
        </section>
        <button type="button" data-testid="return-bedroom">Return to Bedroom</button>
      </main>
    `;
    overlay
      .querySelector<HTMLButtonElement>('[data-testid="return-bedroom"]')
      ?.addEventListener('click', () => {
        context.switchScene('bedroom');
      });
    context.uiRoot.append(overlay);
    this.overlay = overlay;
  }

  public exit(): void {
    this.overlay?.remove();
    this.overlay = null;
  }

  public update(): void {
    // End report is DOM-only for now.
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
  }
}
