import type { Preview } from 'storybook';

import '../app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      context: '#storybook-root',
      test: 'error',
    },
  },
};

export default preview;
