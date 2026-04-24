export interface PromptAction {
  key: string;
  label: string;
}

export function renderPromptActions(
  actionsEl: HTMLElement,
  actions: readonly PromptAction[],
) {
  actionsEl.innerHTML = '';
  actionsEl.classList.toggle('hidden', actions.length === 0);

  actions.forEach((action) => {
    const actionEl = document.createElement('div');
    actionEl.className = 'shop-prompt-action';
    actionEl.setAttribute('data-key', action.key);

    const keyEl = document.createElement('kbd');
    keyEl.className = 'shop-prompt-key';
    keyEl.textContent = action.key;

    const labelEl = document.createElement('span');
    labelEl.className = 'shop-prompt-label';
    labelEl.textContent = action.label;

    actionEl.appendChild(keyEl);
    actionEl.appendChild(labelEl);
    actionsEl.appendChild(actionEl);
  });
}
