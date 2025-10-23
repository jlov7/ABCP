import type { Meta, StoryObj } from '@storybook/react';
import { Timeline, type TimelineProps } from './Timeline';
import { createMockTimelineData } from '@/utils/mockData';

const meta: Meta<typeof Timeline> = {
  title: 'Components/Timeline',
  component: Timeline,
  parameters: {
    layout: 'centered'
  }
};

export default meta;

type Story = StoryObj<typeof Timeline>;

const data = createMockTimelineData();

export const Default: Story = {
  args: {
    actions: data.actions,
    observations: data.observations,
    decisions: data.decisions
  } satisfies TimelineProps
};
