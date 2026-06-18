import type { ReactNode } from 'react';

type PageLayoutProps = {
  children: ReactNode;
};

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 1.5rem' }}>
      {children}
    </div>
  );
}
