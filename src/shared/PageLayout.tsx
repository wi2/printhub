import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

type PageLayoutProps = {
  children: ReactNode;
};

/**
 * Consistent page shell: brand header with global navigation, constrained main
 * content, and minimal footer. All routes share this layout. Navigation contains
 * no business logic — route matching only.
 */
export function PageLayout({ children }: PageLayoutProps) {
  const { pathname } = useLocation();
  const isConfigureSection =
    pathname === '/configure' || pathname.startsWith('/profile/');

  return (
    <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 1.5rem' }}>
      <header className="site-header">
        <Link to="/" className="site-brand">
          PrintHub
        </Link>
        <nav aria-label="Main">
          <ul className="site-nav-list">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? 'site-nav-link site-nav-link--active' : 'site-nav-link'
                }
              >
                Home
              </NavLink>
            </li>
            <li>
              <Link
                to="/configure"
                className={
                  isConfigureSection
                    ? 'site-nav-link site-nav-link--active'
                    : 'site-nav-link'
                }
                aria-current={isConfigureSection ? 'page' : undefined}
              >
                Generate Profile
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <nav aria-label="Footer">
          <ul className="footer-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/configure">Generate Profile</Link>
            </li>
          </ul>
        </nav>
        <p className="footer-tagline">Free slicer profiles — no account required.</p>
      </footer>
    </div>
  );
}
