import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'Agentic Browser Control Plane',
  tagline: 'Personal R&D — standards-first governance for agentic web actions',
  url: 'https://example.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'abcp',
  projectName: 'docs',
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts'
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css'
        }
      }
    ]
  ],
  themeConfig: {
    colorMode: {
      defaultMode: 'dark'
    },
    navbar: {
      title: 'ABCP R&D',
      items: [
        { to: '/docs/intro', label: 'Documentation', position: 'left' }
      ]
    },
    prism: {
      theme: prismThemes.dracula,
      darkTheme: prismThemes.dracula
    },
    announcementBar: {
      id: 'r-and-d',
      content: 'Personal R&D project — not a product. Signed provenance and disclosures included.'
    }
  }
};

export default config;
