import type {ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type {SiteTheme, ThemePalette} from '../../site.config';

function paletteVariables(palette: ThemePalette): string {
  return [
    `--site-primary:${palette.primary}`,
    `--site-background:${palette.background}`,
    `--site-surface:${palette.surface}`,
    `--site-text:${palette.text}`,
    `--site-muted:${palette.muted}`,
    `--site-border:${palette.border}`,
  ].join(';');
}

function themeStyles(theme: SiteTheme | undefined): string {
  if (!theme) return '';
  return `:root{${paletteVariables(theme.colors.light)};--site-font-body:${theme.typography.body};--site-font-heading:${theme.typography.heading};--site-font-mono:${theme.typography.mono};--site-heading-weight:${theme.typography.headingWeight};--site-radius:${theme.shape.radius};--site-border-width:${theme.shape.borderWidth};--site-navbar-shadow:${theme.shape.navbarShadow};--site-content-width:${theme.layout.contentWidth};}[data-theme='dark']{${paletteVariables(theme.colors.dark)};}`;
}

export default function Root({children}: {children: ReactNode}): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const visualTheme = siteConfig.customFields?.visualTheme as SiteTheme | undefined;
  return <><style>{themeStyles(visualTheme)}</style>{children}</>;
}
