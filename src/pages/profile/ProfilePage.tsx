import { useParams } from 'react-router-dom';
import { PageLayout } from '../../shared/PageLayout';

export function ProfilePage() {
  // slug is received here but content is hardcoded until S-3.6
  const { slug: _slug } = useParams();

  return (
    <PageLayout>
      <h1>Bambu A1 Mini · PLA · 0.4mm · Balanced</h1>
      <ul>
        <li>Print speed is set to 180mm/s — fast for efficiency, conservative enough for consistent quality.</li>
        <li>Layer height is 0.2mm — the standard for balanced prints.</li>
        <li>Bed temperature is 55°C. If you see corners lifting, try 60°C.</li>
      </ul>
      <p>New profile — be the first to report results.</p>
      <button type="button">Download profile</button>
    </PageLayout>
  );
}
