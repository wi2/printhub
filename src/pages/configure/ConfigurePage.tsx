import { PageLayout } from '../../shared/PageLayout';
import { CombinationForm } from './CombinationForm';

/**
 * Configure route wrapper. Introduces the form purpose before the four inputs.
 */
export function ConfigurePage() {
  return (
    <PageLayout>
      <h1>Configure your profile</h1>
      <p className="lead">
        A slicer profile is a preset file with print speeds, temperatures, layer heights,
        and other settings tuned for your printer and material. Select your setup below —
        we&apos;ll generate a file ready to import into your slicer.
      </p>
      <p className="text-small text-muted">
        Only validated combinations can be generated. Materials or nozzle sizes shown as
        unavailable have not been tested for your selected printer yet.
      </p>
      <CombinationForm />
    </PageLayout>
  );
}
