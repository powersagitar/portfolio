import { about } from './shapes/about';
import { badge } from './shapes/badge';
import { contact } from './shapes/contact';
import { home } from './shapes/home';
import { howto } from './shapes/howto';
import { mssg } from './shapes/mssg';
import { writing } from './shapes/writing';
import type { CloudKey, ShapeDef } from './types';

export const SHAPES: Record<CloudKey, ShapeDef> = {
  home,
  about,
  badge,
  howto,
  mssg,
  writing,
  contact,
};
