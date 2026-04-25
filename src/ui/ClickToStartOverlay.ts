interface ClickToStartOverlayOptions {
  id: string;
  zIndex: number;
  titleText?: string;
  onActivate: () => void;
}

const OVERLAY_HIDE_MS = 160;

export class ClickToStartOverlay {
  private readonly options: ClickToStartOverlayOptions;
  private element: HTMLDivElement | null = null;
  private visible = false;

  constructor(options: ClickToStartOverlayOptions) {
    this.options = options;
  }

  show() {
    const overlay = this.ensureElement();
    this.visible = true;
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
  }

  hide() {
    const overlay = this.element;
    if (!overlay) return;

    this.visible = false;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    window.setTimeout(() => {
      if (!this.visible && this.element === overlay) {
        overlay.style.display = 'none';
      }
    }, OVERLAY_HIDE_MS);
  }

  dispose() {
    this.visible = false;
    this.element?.remove();
    this.element = null;
  }

  private ensureElement(): HTMLDivElement {
    if (this.element) return this.element;

    const overlay = document.createElement('div');
    overlay.id = this.options.id;
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: ${this.options.zIndex};
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(10, 12, 18, 0.52);
      backdrop-filter: blur(6px) saturate(0.72);
      color: var(--info-heading);
      user-select: none;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.16s ease;
      font-family: var(--font-primary);
    `;

    const title = document.createElement('div');
    title.className = 'info-heading';
    title.innerText = this.options.titleText ?? 'CLICK TO START';
    title.style.margin = '0';
    title.style.textTransform = 'uppercase';
    title.style.textShadow = '0 0 26px rgba(255, 255, 255, 0.22)';
    overlay.appendChild(title);

    overlay.addEventListener('click', this.options.onActivate);

    document.body.appendChild(overlay);
    this.element = overlay;
    return overlay;
  }
}
