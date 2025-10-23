import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    backgrounds: {
      default: 'night',
      values: [
        { name: 'night', value: '#05070f' },
        { name: 'day', value: '#f8fafc' }
      ]
    }
  }
};

export default preview;
