export interface ControlsHint {
  readonly startButton: HTMLButtonElement;
  setExploring(isExploring: boolean): void;
}

const CONTROL_ITEMS = [
  ['WASD', '移動'],
  ['Space', '上浮'],
  ['Shift', '下潛'],
  ['滑鼠', '觀看'],
] as const;

export function createControlsHint(): ControlsHint {
  const hint = document.createElement('aside');
  hint.className = 'controls-hint';
  hint.setAttribute('aria-label', '潛水操作說明');

  const startButton = document.createElement('button');
  startButton.className = 'controls-hint__start-button';
  startButton.type = 'button';
  startButton.textContent = '開始探索';
  hint.appendChild(startButton);

  const controls = document.createElement('div');
  controls.className = 'controls-hint__grid';

  for (const [key, action] of CONTROL_ITEMS) {
    const item = document.createElement('span');
    item.className = 'controls-hint__item';
    item.innerHTML = `<kbd>${key}</kbd><span>${action}</span>`;
    controls.appendChild(item);
  }

  hint.appendChild(controls);

  const escapeHint = document.createElement('p');
  escapeHint.className = 'controls-hint__escape';
  escapeHint.textContent = 'Esc　解除滑鼠控制';
  hint.appendChild(escapeHint);
  document.body.appendChild(hint);

  return {
    startButton,
    setExploring(isExploring: boolean): void {
      hint.classList.toggle('is-exploring', isExploring);
      startButton.hidden = isExploring;
    },
  };
}
