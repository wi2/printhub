import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageLayout } from '../../shared/PageLayout';
import type { Manifest, ManifestEntry } from '../../types';
import { ProfileCard } from './ProfileCard';

type ProfileState =
  | { status: 'loading' }
  | { status: 'found'; entry: ManifestEntry }
  | { status: 'not-found' };

export function ProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<ProfileState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    fetch('/combinations.json')
      .then(r => r.json() as Promise<Manifest>)
      .then(manifest => {
        if (cancelled) return;
        const entry = manifest.combinations.find(c => c.slug === slug);
        setState(entry ? { status: 'found', entry } : { status: 'not-found' });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'not-found' });
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <PageLayout>
      {state.status === 'loading' && null}

      {state.status === 'found' && <ProfileCard entry={state.entry} />}

      {state.status === 'not-found' && (
        <div>
          <h1>This profile is no longer available</h1>
          <p>The combination you&apos;re looking for has been removed or was never validated.</p>
          <Link to="/configure">Configure a new profile</Link>
        </div>
      )}
    </PageLayout>
  );
}
