import type { CreatureProximityState } from '../creatures/CreatureManager';

export interface CreatureInfo {
  setProximity(state: CreatureProximityState): void;
}

export function createCreatureInfo(): CreatureInfo {
  const info = document.createElement('aside');
  info.className = 'creature-info';
  info.setAttribute('aria-live', 'polite');
  info.setAttribute('aria-hidden', 'true');

  const name = document.createElement('strong');
  name.className = 'creature-info__name';
  const subtitle = document.createElement('span');
  subtitle.className = 'creature-info__subtitle';
  info.append(name, subtitle);
  document.body.appendChild(info);

  return {
    setProximity(state: CreatureProximityState): void {
      name.textContent = state.name;
      subtitle.textContent = state.subtitle;
      info.classList.toggle('is-visible', state.isNearby);
      info.setAttribute('aria-hidden', String(!state.isNearby));
    },
  };
}
