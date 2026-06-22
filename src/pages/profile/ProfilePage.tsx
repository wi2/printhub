import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  _resetManifestCache,
  findManifestEntryBySlug,
  loadManifest,
} from '../../lib/manifest';
import { loadProfileVersion } from '../../lib/profile-version';
import { PageLayout } from '../../shared/PageLayout';
import type { ManifestEntry } from '../../types';
import { ProfileCard } from './ProfileCard';

type ProfileState =
  | { status: 'loading' }
  | { status: 'found'; entry: ManifestEntry; profileVersion: number }
  | { status: 'not-found' }
  | { status: 'error' };

export function ProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<ProfileState>({ status: 'loading' });
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = useCallback(() => {
    _resetManifestCache();
    setRetryCount(count => count + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    loadManifest()
      .then(async manifest => {
        if (cancelled) return;
        const entry = slug ? findManifestEntryBySlug(slug, manifest) : undefined;

        if (!entry) {
          setState({ status: 'not-found' });
          return;
        }

        const profileVersion = await loadProfileVersion(entry.slug);
        if (!cancelled) {
          setState({ status: 'found', entry, profileVersion });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [slug, retryCount]);

  return (
    <PageLayout>
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <ol className="breadcrumb-list">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/configure">Generate Profile</Link>
          </li>
          <li aria-current="page">Profile</li>
        </ol>
      </nav>

      {state.status === 'loading' && (
        <p role="status">Loading profile, please wait.</p>
      )}

      {state.status === 'found' && (
        <ProfileCard entry={state.entry} profileVersion={state.profileVersion} />
      )}

      {state.status === 'not-found' && (
        <div>
          <h1>This profile is no longer available</h1>
          <p>The combination you&apos;re looking for has been removed or was never validated.</p>
          <Link to="/configure">Configure a new profile</Link>
        </div>
      )}

      {state.status === 'error' && (
        <div>
          <h1>Could not load profile</h1>
          <p role="alert">
            Something went wrong while loading profile data. Check your connection and try again.
          </p>
          <button type="button" onClick={handleRetry}>
            Try again
          </button>
        </div>
      )}
    </PageLayout>
  );
}
