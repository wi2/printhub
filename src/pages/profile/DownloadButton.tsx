import { useState } from 'react';
import type { ManifestEntry } from '../../types';
import { SLICER_FORMATS } from '../../types';

type DownloadButtonProps = {
  entry: ManifestEntry;
  onDownloadStarted: () => void;
};

/**
 * Triggers a file download for the profile and notifies the parent on first click
 * so the Import Guide can be revealed. Subsequent clicks re-download without
 * hiding the guide.
 */
export function DownloadButton({ entry, onDownloadStarted }: DownloadButtonProps) {
  const [hasDownloaded, setHasDownloaded] = useState(false);

  function handleDownload() {
    const extension =
      SLICER_FORMATS.find(format => format.id === entry.slicerFormat)?.fileExtension ??
      '';

    const link = document.createElement('a');
    link.href = entry.downloadPath;
    link.download = `${entry.slug}${extension}`;
    link.click();

    if (!hasDownloaded) {
      setHasDownloaded(true);
      onDownloadStarted();
    }
  }

  return (
    <button type="button" className="btn btn-primary" onClick={handleDownload}>
      Download profile
    </button>
  );
}
