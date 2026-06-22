import { useState } from 'react';
import type { ManifestEntry } from '../../types';
import { PRINTERS, MATERIALS, NOZZLE_SIZES, GOALS, SLICER_FORMATS } from '../../types';
import { DownloadButton } from './DownloadButton';
import { ImportGuide } from './ImportGuide';
import { FeedbackPrompt } from './FeedbackPrompt';

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

/** Human-readable labels for the configuration summary chips. */
function formatConfigTags(entry: ManifestEntry): string[] {
  const printer = PRINTERS.find(p => p.id === entry.printer)?.name ?? entry.printer;
  const material = MATERIALS.find(m => m.id === entry.material)?.name ?? entry.material;
  const nozzle = NOZZLE_SIZES.find(n => n.id === entry.nozzle)?.label ?? entry.nozzle;
  const goal = GOALS.find(g => g.id === entry.goal)?.name ?? entry.goal;
  const slicer =
    SLICER_FORMATS.find(f => f.id === entry.slicerFormat)?.name ?? entry.slicerFormat;
  return [printer, material, nozzle, goal, slicer];
}

function formatDownloadFilename(entry: ManifestEntry): string {
  const extension =
    SLICER_FORMATS.find(f => f.id === entry.slicerFormat)?.fileExtension ?? '';
  return `${entry.slug}${extension}`;
}

type ProfileCardProps = {
  entry: ManifestEntry;
  profileVersion: number;
};

/**
 * Renders the full profile result: configuration summary, highlights, validation
 * status, download with file details, import guide, and feedback prompt.
 */
export function ProfileCard({ entry, profileVersion }: ProfileCardProps) {
  const [copied, setCopied] = useState(false);
  const [showImportGuide, setShowImportGuide] = useState(false);
  const configTags = formatConfigTags(entry);
  const downloadFilename = formatDownloadFilename(entry);
  const slicerName =
    SLICER_FORMATS.find(f => f.id === entry.slicerFormat)?.name ?? entry.slicerFormat;

  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="section-stack">
      <section aria-labelledby="profile-title">
        <h1 id="profile-title">{formatTitle(entry)}</h1>
        <ul className="tag-list" aria-label="Configuration summary">
          {configTags.map(tag => (
            <li key={tag}>
              <span className="tag">{tag}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="highlights-heading">
        <h2 id="highlights-heading">Key settings in this profile</h2>
        <ul className="highlights-list">
          {entry.highlights.map(highlight => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </section>

      <section className="card card--info" aria-labelledby="validation-status-heading">
        <h2 id="validation-status-heading">Validation status</h2>
        <p style={{ marginTop: 0 }}>
          This profile passed engineering validation — settings are within safety
          guardrails for your printer and material. Physical test prints on this exact
          setup are in progress.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>New profile — be the first to report results.</strong> After your
          print, let us know how it went so we can confirm real-world performance.
        </p>
      </section>

      <section className="card" aria-labelledby="before-printing-heading">
        <h2 id="before-printing-heading">Before you print</h2>
        <ul style={{ marginBottom: 0 }}>
          <li>Confirm your printer and filament match the configuration above.</li>
          <li>
            For PETG, make sure your filament is dry — moisture causes stringing and weak
            layers.
          </li>
          <li>Start with a small test print before committing to a long job.</li>
        </ul>
      </section>

      <section aria-labelledby="download-heading">
        <h2 id="download-heading">Download</h2>
        <p className="text-muted">
          Import this file into {slicerName}. Step-by-step instructions appear after your
          first download.
        </p>
        <div className="btn-group">
          <DownloadButton
            entry={entry}
            onDownloadStarted={() => setShowImportGuide(true)}
          />
          <button type="button" className="btn btn-secondary" onClick={handleShare}>
            {copied ? 'Copied!' : 'Share this profile'}
          </button>
        </div>
        <p className="file-info" aria-label="Download filename">
          {downloadFilename}
        </p>
      </section>

      {showImportGuide && (
        <section aria-labelledby="import-guide-heading">
          <p role="status" className="sr-only">
            Download started
          </p>
          <ImportGuide slicerFormat={entry.slicerFormat} />
        </section>
      )}

      <FeedbackPrompt slug={entry.slug} profileVersion={profileVersion} />
    </div>
  );
}
