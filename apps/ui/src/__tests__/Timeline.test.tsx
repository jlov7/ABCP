import { render, screen } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import { Timeline } from '@/components/Timeline';
import { createMockTimelineData } from '@/utils/mockData';

describe('Timeline', () => {
  it('renders actions with policy and observation details', () => {
    const data = createMockTimelineData();
    render(
      <Timeline
        actions={data.actions}
        decisions={data.decisions}
        observations={data.observations}
      />
    );

    const actionTexts = screen.getAllByText(/navigate/i);
    expect(actionTexts.length).toBeGreaterThan(0);
    expect(screen.getByText(/baseline gemini agent/i)).toBeInTheDocument();
    expect(screen.getByText(/allow/i, { selector: 'dd' })).toBeInTheDocument();
    expect(
      screen.getByText(/gemini computer use navigated to/i, { selector: 'dd' })
    ).toBeInTheDocument();
  });
});
