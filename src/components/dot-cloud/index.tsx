'use client';

import dynamic from 'next/dynamic';

// Client only: the canvas needs WebGL and the window size.
export const DotCloud = dynamic(() => import('./DotCloud'), { ssr: false });
