import { useState, useEffect } from 'react';
import type { ManifestEntry } from '../../types';
import { PRINTERS, MATERIALS, NOZZLE_SIZES, GOALS } from '../../types';
import { DownloadButton } from './DownloadButton';
import { ImportGuide } from './ImportGuide';
import { FeedbackPrompt } from './FeedbackPrompt';

/**
 * Fades and slides the import guide into view on first download.
 * Uses a one-frame delay so the CSS transition runs after mount.
 */
function ImportGuideReveal({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-0.5rem)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {children}
    </div>
  );
}

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
 * Renders the full profile result: title, highlights, download, import guide,
 * feedback prompt, and share action.
 */
export function ProfileCard({ entry }: ProfileCardProps) {
  const [copied, setCopied] = useState(false);
  const [showImportGuide, setShowImportGuide] = useState(false);

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
        <DownloadButton
          entry={entry}
          onDownloadStarted={() => setShowImportGuide(true)}
        />
        <button type="button" onClick={handleShare}>
          {copied ? 'Copied!' : 'Share this profile'}
        </button>
      </div>

      {showImportGuide && (
        <ImportGuideReveal>
          <p role="status">Download started</p>
          <ImportGuide slicerFormat={entry.slicerFormat} />
        </ImportGuideReveal>
      )}

      <FeedbackPrompt slug={entry.slug} />
    </div>
  );
}
