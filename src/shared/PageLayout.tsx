import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type PageLayoutProps = {
  children: ReactNode;
};

/**
 * Consistent page shell: brand header, constrained main content, minimal footer.
 * All three routes share this layout for visual and navigational consistency.
 */
export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 1.5rem' }}>
      <header className="site-header">
        <Link to="/" className="site-brand">
          PrintHub
        </Link>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <p style={{ margin: 0 }}>
          Free slicer profiles — no account required.{' '}
          <Link to="/configure">Generate a profile</Link>
        </p>
      </footer>
    </div>
  );
}
