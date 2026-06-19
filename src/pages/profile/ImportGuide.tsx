import { SLICER_FORMATS } from '../../types';
import { getImportGuide } from './importGuides';

type ImportGuideProps = {
  slicerFormat: string;
};

/**
 * Step-by-step slicer import instructions shown after the first download.
 * Content is determined by the printer's default slicer format from the manifest.
 */
export function ImportGuide({ slicerFormat }: ImportGuideProps) {
  const guide = getImportGuide(slicerFormat);
  if (!guide) return null;

  const slicerName =
    SLICER_FORMATS.find(format => format.id === slicerFormat)?.name ?? slicerFormat;

  return (
    <section aria-labelledby="import-guide-heading">
      <h2 id="import-guide-heading">How to import your profile into {slicerName}</h2>
      <ol>
        {guide.steps.map(step => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p>
        <strong>Tip:</strong> {guide.tip}
      </p>
    </section>
  );
}
