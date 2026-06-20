import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalSelector } from './GoalSelector';

describe('GoalSelector', () => {
  it('renders Balanced as a selectable option', () => {
    render(<GoalSelector value={undefined} onChange={() => {}} />);

    expect(screen.getByRole('radio', { name: 'Balanced' })).toBeEnabled();
  });

  it('renders Quality as disabled with a Coming soon label', () => {
    render(<GoalSelector value={undefined} onChange={() => {}} />);

    expect(screen.getByRole('radio', { name: 'Quality' })).toBeDisabled();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });

  it('does not select Quality when the disabled card is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GoalSelector value={undefined} onChange={onChange} />);

    await user.click(screen.getByText('Quality'));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Quality' })).not.toBeChecked();
  });

  it('calls onChange when Balanced is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GoalSelector value={undefined} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Balanced' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('balanced');
  });
});
