import { useId } from 'react';
import { GOALS } from '../../types';

type GoalSelectorProps = {
  value: string | undefined;
  onChange: (goalId: string) => void;
};

/**
 * Two-card selector for print goals. Each card shows the goal name and its
 * description so the user can make an informed choice.
 *
 * aria-labelledby on each radio points to the name <span> only — not the
 * description — so the radio's accessible name is "Balanced", not the full
 * card text. The description is readable via aria-describedby.
 */
export function GoalSelector({ value, onChange }: GoalSelectorProps) {
  const groupName = useId();
  const baseId = useId();

  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Print Goal</legend>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {GOALS.map(goal => {
          const isSelected = goal.id === value;
          const nameId = `${baseId}-${goal.id}-name`;
          const descId = `${baseId}-${goal.id}-desc`;
          return (
            <label
              key={goal.id}
              style={{
                flex: '1 1 180px',
                display: 'block',
                padding: '0.75rem 1rem',
                border: `2px solid ${isSelected ? '#111' : '#ccc'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#f0f0f0' : '#fff',
                userSelect: 'none',
              }}
            >
              {/* sr-only: accessible but not visible — label handles interaction.
                  aria-labelledby points to the name span only so the radio's
                  accessible name is "Balanced" rather than the full card text. */}
              <input
                type="radio"
                name={groupName}
                value={goal.id}
                checked={isSelected}
                onChange={() => onChange(goal.id)}
                aria-labelledby={nameId}
                aria-describedby={descId}
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: 0,
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0,0,0,0)',
                  whiteSpace: 'nowrap',
                  border: 0,
                }}
              />
              <div id={nameId} style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                {goal.name}
              </div>
              <div id={descId} style={{ fontSize: '0.875rem', color: '#555' }}>
                {goal.description}
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
