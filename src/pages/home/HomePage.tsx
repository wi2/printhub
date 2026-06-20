import { Link } from 'react-router-dom';
import { PageLayout } from '../../shared/PageLayout';
import { MATERIALS, NOZZLE_SIZES, PRINTERS } from '../../types';

/**
 * Entry point for the product. Communicates the value proposition, how the
 * product works, current MVP scope, and directs visitors to the configure flow.
 * No login, no pricing, no separate About page — this page is the onboarding.
 */
export function HomePage() {
  const supportedMaterials = MATERIALS.filter(m => m.id !== 'tpu');

  return (
    <PageLayout>
      <div className="section-stack">
        <section className="section" aria-labelledby="hero-heading">
          <h1 id="hero-heading">Ready-to-import slicer profiles for your setup</h1>
          <p className="lead">
            Tell us your printer, material, nozzle size, and print goal. We generate a
            slicer profile you can import in one click — tuned for your combination and
            checked against safety limits. No account required.
          </p>
          <Link to="/configure" className="btn btn-primary">
            Generate my profile
          </Link>
        </section>

        <section className="section" aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading">How it works</h2>
          <ol className="steps">
            <li className="step">
              <span className="step-number" aria-hidden="true">
                1
              </span>
              <div className="step-content">
                <h3>Describe your setup</h3>
                <p>
                  Select your printer, material, nozzle size, and whether you want a
                  balanced or quality-focused profile.
                </p>
              </div>
            </li>
            <li className="step">
              <span className="step-number" aria-hidden="true">
                2
              </span>
              <div className="step-content">
                <h3>Download your profile</h3>
                <p>
                  Get a file formatted for your slicer — PrusaSlicer or Bambu Studio /
                  Orca Slicer — with step-by-step import instructions.
                </p>
              </div>
            </li>
            <li className="step">
              <span className="step-number" aria-hidden="true">
                3
              </span>
              <div className="step-content">
                <h3>Print and share feedback</h3>
                <p>
                  Run a test print and tell us how it went. Your report helps improve
                  profiles for everyone.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className="section" aria-labelledby="supported-heading">
          <h2 id="supported-heading">Available now</h2>
          <div className="card">
            <p className="text-small text-muted" style={{ marginTop: 0 }}>
              These combinations are available to generate today. Greyed-out options in
              the form are not yet validated.
            </p>
            <h3>Printers</h3>
            <ul className="tag-list" aria-label="Supported printers">
              {PRINTERS.map(printer => (
                <li key={printer.id}>
                  <span className="tag">{printer.name}</span>
                </li>
              ))}
            </ul>
            <h3>Materials</h3>
            <ul className="tag-list" aria-label="Supported materials">
              {supportedMaterials.map(material => (
                <li key={material.id}>
                  <span className="tag">{material.name}</span>
                </li>
              ))}
            </ul>
            <h3>Nozzle sizes</h3>
            <ul className="tag-list" aria-label="Supported nozzle sizes">
              {NOZZLE_SIZES.map(nozzle => (
                <li key={nozzle.id}>
                  <span className="tag">{nozzle.label}</span>
                </li>
              ))}
            </ul>
            <h3>Print goal</h3>
            <ul className="tag-list" aria-label="Supported print goals">
              <li>
                <span className="tag">Balanced</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="section" aria-labelledby="validation-heading">
          <h2 id="validation-heading">How profiles are validated</h2>
          <div className="card card--info">
            <p style={{ marginTop: 0 }}>
              Every profile passes engineering validation — parameters are resolved from
              curated layer files and checked against safety guardrails for temperature,
              speed, and flow limits.
            </p>
            <p style={{ marginBottom: 0 }}>
              Physical test prints on each target printer are in progress. Until those
              complete, treat your first print as a calibration run and report your
              results so we can confirm real-world performance.
            </p>
          </div>
        </section>

        <section className="section" aria-labelledby="coming-soon-heading">
          <h2 id="coming-soon-heading">Coming soon</h2>
          <ul className="text-muted">
            <li>TPU profiles</li>
            <li>Quality-focused print goal</li>
            <li>Print success counts on profile pages</li>
            <li>Additional material and printer combinations</li>
          </ul>
        </section>
      </div>
    </PageLayout>
  );
}
