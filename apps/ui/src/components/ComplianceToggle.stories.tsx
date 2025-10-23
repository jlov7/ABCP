import type { Meta, StoryObj } from '@storybook/react';
import { ComplianceToggle } from './ComplianceToggle';

const meta: Meta<typeof ComplianceToggle> = {
  title: 'Components/ComplianceToggle',
  component: ComplianceToggle
};

export default meta;

type Story = StoryObj<typeof ComplianceToggle>;

export const Default: Story = {
  args: {
    label: 'SB 243 Disclosure',
    description: 'Display AI disclosure banner and minors safeguards for demo flows.'
  }
};
