import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {site} from './site.config';

const repositoryFullName = process.env.GITHUB_REPOSITORY ?? site.repository.defaultFullName;
const [organizationName, projectName] = repositoryFullName.split('/');

if (!organizationName || !projectName) {
  throw new Error(`Invalid repository name "${repositoryFullName}". Expected "owner/repository".`);
}

function normalizeBaseUrl(value: string): string {
  return `/${value}`.replace(/\/{2,}/g, '/').replace(/\/?$/, '/');
}

function projectLink(label: string, href: string): string {
  return `<a href="${href}">${label}</a>`;
}

function footerCredit(): string {
  const credits = [`© ${new Date().getFullYear()} ${site.author}`];
  if (site.lineage.designedWith) {
    credits.push(`designed with ${projectLink(site.lineage.designedWith.label, site.lineage.designedWith.href)}`);
  }
  if (site.lineage.poweredBy) {
    credits.push(`powered by ${projectLink(site.lineage.poweredBy.label, site.lineage.poweredBy.href)}`);
  }
  return credits.join(' · ');
}

const isUserPagesRepository = projectName === `${organizationName}.github.io`;
const url = (process.env.SITE_URL ?? `https://${organizationName}.github.io`).replace(/\/$/, '');
const baseUrl = normalizeBaseUrl(process.env.SITE_BASE_URL ?? (isUserPagesRepository ? '/' : projectName));
const repositoryUrl = `https://github.com/${repositoryFullName}`;

const config: Config = {
  title: site.title,
  tagline: site.tagline,
  url,
  baseUrl,
  organizationName,
  projectName,
  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: {hooks: {onBrokenMarkdownLinks: 'throw'}},
  future: {v4: true},
  customFields: {visualTheme: site.theme, deploymentBaseUrl: baseUrl},
  i18n: {
    defaultLocale: site.defaultLocale,
    locales: Object.keys(site.locales),
    localeConfigs: site.locales,
  },
  presets: [[
    'classic',
    {
      docs: {
        path: './docs/fr',
        routeBasePath: '/',
        sidebarPath: './sidebars.ts',
      },
      blog: false,
      theme: {customCss: './src/css/custom.css'},
    } satisfies Preset.Options,
  ]],
  themeConfig: {
    metadata: [{name: 'description', content: site.description}],
    colorMode: {respectPrefersColorScheme: true},
    navbar: {
      title: site.title,
      items: [
        {type: 'docSidebar', sidebarId: 'docsSidebar', position: 'left', label: 'Sommaire'},
        {to: '/publications/', label: 'Publications', position: 'left'},
        {href: repositoryUrl, label: 'GitHub', position: 'right'},
      ],
    },
    footer: {style: 'dark', copyright: footerCredit()},
    prism: {theme: prismThemes.github, darkTheme: prismThemes.dracula},
  } satisfies Preset.ThemeConfig,
};

export default config;
