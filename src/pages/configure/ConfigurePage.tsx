import { PageLayout } from '../../shared/PageLayout';
import { CombinationForm } from './CombinationForm';

export function ConfigurePage() {
  return (
    <PageLayout>
      <h1>Configure your profile</h1>
      <CombinationForm />
    </PageLayout>
  );
}
