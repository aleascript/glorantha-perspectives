import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkLocalImageBaseUrl from './plugins/remark-local-image-base-url.mjs';
import {site} from './site.config';

const repositoryFullName =
  process.env.GITHUB_REPOSITORY ?? site.repository.defaultFullName;
const [organizationName, projectName] = repositoryFullName.split('/');

if (!organizationName || !projectName) {
  throw new Error(
    `Invalid repository name "${repositoryFullName}". Expected "owner/repository".`,
  );
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
    credits.push(
      `designed with ${projectLink(
        site.lineage.designedWith.label,
        site.lineage.designedWith.href,
      )}`,
    );
  }

  if (site.lineage.poweredBy) {
    credits.push(
      `powered by ${projectLink(
        site.lineage.poweredBy.label,
        site.lineage.poweredBy.href,
      )}`,
    );
  }

  return credits.join(' · ');
}

const isUserPagesRepository = projectName === `${organizationName}.github.io`;
const url = (process.env.SITE_URL ?? `https://${organizationName}.github.io`).replace(
  /\/$/,
  '',
);
const baseUrl = normalizeBaseUrl(
  process.env.SITE_BASE_URL ?? (isUserPagesRepository ? '/' : projectName),
);
const repositoryUrl = `https://github.com/${repositoryFullName}`;
const locales = Object.keys(site.locales);
const requestedLocale = process.env.DOCUSAURUS_CURRENT_LOCALE;
const contentLocale =
  requestedLocale && requestedLocale !== 'undefined'
    ? requestedLocale
    : site.defaultLocale;

if (!locales.includes(contentLocale)) {
  throw new Error(`No content directory configured for locale "${contentLocale}".`);
}

function localizedBaseUrl(locale: string): string {
  return locale === site.defaultLocale
    ? baseUrl
    : normalizeBaseUrl(`${baseUrl}${locale}`);
}

// Locale base URLs control document routes. Static assets remain rooted at the
// deployment base URL, even for non-default locales; raw Markdown JSX images
// therefore must not inherit the locale segment.
const localeConfigs = Object.fromEntries(
  Object.entries(site.locales).map(([locale, localeConfig]) => [
    locale,
    {...localeConfig, baseUrl: localizedBaseUrl(locale)},
  ]),
);

const config: Config = {
  title: site.title,
  tagline: site.tagline,
  url,
  baseUrl,
  organizationName,
  projectName,
  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  future: {v4: true},
  customFields: {
    visualTheme: site.theme,
    deploymentBaseUrl: baseUrl,
  },
  i18n: {
    defaultLocale: site.defaultLocale,
    locales,
    localeConfigs,
  },
  presets: [
    [
      'classic',
      {
        docs: {
          path: `./docs/${contentLocale}`,
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          remarkPlugins: [
            [remarkLocalImageBaseUrl, {baseUrl}],
          ],
        },
        blog: false,
        theme: {customCss: './src/css/custom.css'},
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    metadata: [{name: 'description', content: site.description}],
    colorMode: {respectPrefersColorScheme: true},
    navbar: {
title: site.title,
      ...(site.identity.logo
        ? {
            logo: {
              alt: `${site.title} logo`,
              src: site.identity.logo,
            },
          }
        : {}),
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Sommaire',
        },
        {to: '/publications/', label: 'Publications', position: 'left'},
        ...(locales.length > 1
          ? [
              {
                type: 'localeDropdown' as const,
                position: 'right' as const,
                queryString: '?persistLocale=true',
              },
            ]
          : []),
        {href: repositoryUrl, label: 'GitHub', position: 'right'},
      ],
    },
    footer: {style: 'dark', copyright: footerCredit()},
    prism: {theme: prismThemes.github, darkTheme: prismThemes.dracula},
  } satisfies Preset.ThemeConfig,
};

export default config;
