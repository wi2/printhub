import { Link } from 'react-router-dom';
import { PageLayout } from '../../shared/PageLayout';

/**
 * Entry point for the product. Communicates the value proposition and
 * directs the visitor to the configure flow. No login, no pricing.
 */
export function HomePage() {
  return (
    <PageLayout>
      <h1>Generate your slicer profile in seconds</h1>
      <p>
        Tell us your printer, material, nozzle size, and print goal. We give you a
        ready-to-import slicer profile, validated on real hardware. No account required.
      </p>
      <Link to="/configure">Generate my profile</Link>
    </PageLayout>
  );
}
