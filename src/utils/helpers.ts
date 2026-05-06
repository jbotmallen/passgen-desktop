import {
  IconBriefcase,
  IconBuildingBank,
  IconCloud,
  IconDatabase,
  IconFlag,
  IconFolder,
  IconHeart,
  IconKey,
  IconLock,
  IconMail,
  IconPlane,
  IconShieldLock,
  IconStar,
  IconUser,
  IconWorld,
  type Icon,
} from '@tabler/icons-react';
import { createElement } from 'react';

import { secureIntBelow, securePick } from '@/utils/secureRandom';

export const pick = <T,>(arr: T[]): T => securePick(arr);

export const randDigit = () => secureIntBelow(10);

export const AVAILABLE_ICONS: Array<{ name: string; component: Icon }> = [
  { name: 'shield', component: IconShieldLock },
  { name: 'user', component: IconUser },
  { name: 'briefcase', component: IconBriefcase },
  { name: 'bank', component: IconBuildingBank },
  { name: 'plane', component: IconPlane },
  { name: 'world', component: IconWorld },
  { name: 'lock', component: IconLock },
  { name: 'key', component: IconKey },
  { name: 'database', component: IconDatabase },
  { name: 'folder', component: IconFolder },
  { name: 'heart', component: IconHeart },
  { name: 'flag', component: IconFlag },
  { name: 'star', component: IconStar },
];

export function renderEntryIcon(name: string, size = 20) {
  switch (name) {
    case 'bank':
      return createElement(IconBuildingBank, { size, stroke: 1.5 });
    case 'cloud':
      return createElement(IconCloud, { size, stroke: 1.5 });
    case 'mail':
      return createElement(IconMail, { size, stroke: 1.5 });
    case 'world':
      return createElement(IconWorld, { size, stroke: 1.5 });
    default:
      return createElement(IconKey, { size, stroke: 1.5 });
  }
}

export function renderStrengthBar(strength: string) {
  if (strength === 'Weak') {
    return createElement(
      'div',
      { className: 'flex gap-1 items-center' },
      createElement(IconStar, { size: 12, className: 'text-destructive fill-destructive' }),
      createElement(
        'div',
        { className: 'w-8 h-1 rounded-full bg-destructive/30' },
        createElement('div', { className: 'w-1/3 h-full bg-destructive rounded-full' }),
      ),
    );
  }

  if (strength === 'Medium') {
    return createElement(
      'div',
      { className: 'w-8 h-1 rounded-full bg-brand/30' },
      createElement('div', { className: 'w-2/3 h-full bg-brand rounded-full' }),
    );
  }

  return createElement(
    'div',
    { className: 'w-8 h-1 rounded-full bg-green-500/30' },
    createElement('div', { className: 'w-full h-full bg-green-500 rounded-full' }),
  );
}

export function renderVaultIcon(iconName: string, size = 32, stroke = 1.5, className = '') {
  const iconObj = AVAILABLE_ICONS.find(i => i.name === iconName) || AVAILABLE_ICONS[0];
  const IconComponent = iconObj.component;
  return createElement(IconComponent, { size, stroke, className });
}
