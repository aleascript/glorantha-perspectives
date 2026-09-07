export type ProjectLink = {label: string; href: string};
export type SiteLineage = {designedWith: ProjectLink | null; poweredBy: ProjectLink | null};
export type ThemePalette = {primary: string; background: string; surface: string; text: string; muted: string; border: string};
export type SiteTheme = {
  colors: {light: ThemePalette; dark: ThemePalette};
  typography: {body: string; heading: string; mono: string; headingWeight: number};
  shape: {radius: string; borderWidth: string; navbarShadow: string};
  layout: {contentWidth: string};
};

export const site = {
  title: 'Glorantha Perspectives',
  tagline: 'Explorez Glorantha par ceux qui la vivent',
  description: 'Un jeu de rôle pour explorer Glorantha à travers les vérités, croyances et choix de ses habitants.',
  author: 'AleaScript',
  defaultLocale: 'fr',
  locales: {fr: {htmlLang: 'fr', label: 'Français'}},
  repository: {defaultFullName: 'aleascript/glorantha-perspectives'},
  lineage: {
    designedWith: {label: 'Resonance', href: 'https://aleascript.github.io/resonance/'},
    poweredBy: {label: 'Regard', href: 'https://aleascript.github.io/regard/'},
  } as SiteLineage,
  theme: {
    colors: {
      light: {primary: '#7a4e2f', background: '#fbf7ef', surface: '#f3eadc', text: '#2b241f', muted: '#74685e', border: '#d9c9b7'},
      dark: {primary: '#d6a36f', background: '#17120f', surface: '#211a16', text: '#f1e8de', muted: '#b9aa9b', border: '#493b32'},
    },
    typography: {
      body: '"Atkinson Hyperlegible", "Segoe UI", system-ui, -apple-system, sans-serif',
      heading: '"IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif',
      mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
      headingWeight: 600,
    },
    shape: {radius: '0.35rem', borderWidth: '1px', navbarShadow: '0 1px 0 rgb(43 36 31 / 10%)'},
    layout: {contentWidth: '52rem'},
  } satisfies SiteTheme,
} as const;
