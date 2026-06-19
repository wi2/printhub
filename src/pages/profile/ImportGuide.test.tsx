import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImportGuide } from './ImportGuide';

describe('ImportGuide', () => {
  describe('Bambu Studio / Orca Slicer', () => {
    it('renders the Stage 4 import steps from the spec', () => {
      render(<ImportGuide slicerFormat="bambu-orca" />);

      expect(screen.getByRole('heading', { name: /bambu studio \/ orca slicer/i })).toBeInTheDocument();
      expect(screen.getByText('Open Bambu Studio')).toBeInTheDocument();
      expect(screen.getByText(/file → import → import configs/i)).toBeInTheDocument();
      expect(screen.getByText('Select the file you just downloaded')).toBeInTheDocument();
      expect(screen.getByText(/click ok when prompted/i)).toBeInTheDocument();
      expect(screen.getByText(/filament dropdown/i)).toBeInTheDocument();
      expect(screen.getByText(/process dropdown/i)).toBeInTheDocument();
      expect(screen.getByText('Slice your model as normal')).toBeInTheDocument();
    });

    it('renders the Bambu inline tip from the spec', () => {
      render(<ImportGuide slicerFormat="bambu-orca" />);

      expect(
        screen.getByText(/not the same as the built-in bambu filament profiles/i),
      ).toBeInTheDocument();
    });
  });

  describe('PrusaSlicer', () => {
    it('renders the Stage 4 import steps from the spec', () => {
      render(<ImportGuide slicerFormat="prusaslicer" />);

      expect(screen.getByRole('heading', { name: /prusaslicer/i })).toBeInTheDocument();
      expect(screen.getByText('Open PrusaSlicer')).toBeInTheDocument();
      expect(screen.getByText(/file → import → import config bundle/i)).toBeInTheDocument();
      expect(screen.getByText('Select the file you just downloaded')).toBeInTheDocument();
      expect(
        screen.getByText(/print settings, filament settings, and printer dropdowns/i),
      ).toBeInTheDocument();
      expect(screen.getByText('Select all three before slicing')).toBeInTheDocument();
    });

    it('renders a PrusaSlicer-specific inline tip', () => {
      render(<ImportGuide slicerFormat="prusaslicer" />);

      expect(screen.getByText(/^Tip:/i)).toBeInTheDocument();
      expect(screen.getByText(/use the imported print settings/i)).toBeInTheDocument();
    });
  });
});
