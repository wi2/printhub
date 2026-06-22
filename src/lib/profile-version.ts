type CanonicalProfileVersionResponse = {
  metadata: {
    version: number;
  };
};

/**
 * Loads metadata.version from the canonical JSON profile artifact for a slug.
 * Throws when the profile is missing or the version field is invalid.
 */
export async function loadProfileVersion(slug: string): Promise<number> {
  const response = await fetch(`/profiles/${encodeURIComponent(slug)}.json`);

  if (!response.ok) {
    throw new Error(`Failed to load profile version: ${response.status}`);
  }

  const profile = (await response.json()) as CanonicalProfileVersionResponse;
  const version = profile.metadata?.version;

  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new Error('Invalid profile version in canonical profile');
  }

  return version;
}
