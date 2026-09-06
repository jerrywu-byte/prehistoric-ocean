export function createCrosshair(): void {
  const crosshair = document.createElement('div');
  crosshair.id = 'crosshair';
  crosshair.setAttribute('aria-hidden', 'true');
  document.body.appendChild(crosshair);
}
