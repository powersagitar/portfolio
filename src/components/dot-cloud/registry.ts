import { about } from './shapes/about';
import { badge } from './shapes/badge';
import { contact } from './shapes/contact';
import { home } from './shapes/home';
import { howto } from './shapes/howto';
import { mssg } from './shapes/mssg';
import { writing } from './shapes/writing';
import type { CloudKey, ShapeDef } from './types';

// `satisfies`, not an annotation: TypeScript still fails on a missing or
// unknown key, and each entry keeps its own build type.
export const SHAPES = {
  home,
  about,
  badge,
  howto,
  mssg,
  writing,
  contact,
} satisfies Record<CloudKey, ShapeDef>;
