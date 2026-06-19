import { useState } from 'react';
import type { ManifestEntry } from '../../types';
import { PRINTERS, MATERIALS, NOZZLE_SIZES, GOALS } from '../../types';

/**
 * Constructs the profile page title by mapping manifest entry IDs to their
 * human-readable display names from the domain constants.
 * Falls back to the raw ID if an entry is not found (e.g. future additions).
 */
function formatTitle(entry: ManifestEntry): string {
  const printer = PRINTERS.find(p => p.id === entry.printer)?.name ?? entry.printer;
  const material = MATERIALS.find(m => m.id === entry.material)?.name ?? entry.material;
  const nozzle = NOZZLE_SIZES.find(n => n.id === entry.nozzle)?.label ?? entry.nozzle;
  const goal = GOALS.find(g => g.id === entry.goal)?.name ?? entry.goal;
  return `${printer} · ${material} · ${nozzle} · ${goal}`;
}

type ProfileCardProps = {
  entry: ManifestEntry;
};

/**
 * Renders the full profile content: title, highlights, confidence count,
 * download button stub, and a clipboard share button.
 * The download button is a visible placeholder — actual download wired in S-3.7.
 */
export function ProfileCard({ entry }: ProfileCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <h1>{formatTitle(entry)}</h1>

      <ul>
        {entry.highlights.map(highlight => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>

      <p>New profile — be the first to report results.</p>

      <div>
        <button type="button">Download profile</button>
        <button type="button" onClick={handleShare}>
          {copied ? 'Copied!' : 'Share this profile'}
        </button>
      </div>
    </div>
  );
}
