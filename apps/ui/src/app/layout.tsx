import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Agentic Browser Control Plane (R&D)',
  description: 'Personal R&D control plane for observing agentic browser actions.',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
