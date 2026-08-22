import React from 'react';

/* ActiveKit icon set. Geometric line glyphs on a 24 grid, 1.75 stroke, round joins, drawn in
   currentColor so an icon inherits whatever text colour it sits in. Deliberately small: only
   the glyphs the product surfaces actually name. */

const GLYPHS = {
  overview: ['M4.5 4.5h5.5v5.5H4.5z', 'M14 4.5h5.5v5.5H14z', 'M4.5 14h5.5v5.5H4.5z', 'M14 14h5.5v5.5H14z'],
  campaigns: ['M12 3.2l2.1 5.6 5.7 2.1-5.7 2.1-2.1 5.6-2.1-5.6-5.7-2.1 5.7-2.1z'],
  ledger: ['M5 4.5h14v15H5z', 'M8.5 9h7', 'M8.5 13h7', 'M8.5 17h4'],
  credits: ['M12 4.2a7.8 7.8 0 1 0 0 15.6 7.8 7.8 0 0 0 0-15.6z', 'M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z'],
  developers: ['M9.2 8.4L5.6 12l3.6 3.6', 'M14.8 8.4L18.4 12l-3.6 3.6'],
  settings: ['M4 8.5h8', 'M16 8.5h4', 'M4 15.5h4', 'M12 15.5h8', 'M14 6.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', 'M8 13.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'],
  team: ['M9.5 5.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M3.6 19.5a5.9 5.9 0 0 1 11.8 0', 'M15.6 6.3a3 3 0 0 1 0 5.4', 'M17 14.6a5.4 5.4 0 0 1 3.4 4.9'],
  chart: ['M4.5 19.5h15', 'M7.5 16.2V10.4', 'M12 16.2V5.6', 'M16.5 16.2v-4.4'],
  search: ['M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z', 'M15.9 15.9l3.8 3.8'],
  filter: ['M4.5 6.5h15', 'M7.5 12h9', 'M10.5 17.5h3'],
  plus: ['M12 5.5v13', 'M5.5 12h13'],
  check: ['M5.6 12.6l4.2 4.2 8.6-9'],
  close: ['M6.4 6.4l11.2 11.2', 'M17.6 6.4L6.4 17.6'],
  alert: ['M12 4.4l8.4 15.2H3.6z', 'M12 9.8v4.2', 'M12 16.7v.4'],
  bell: ['M12 4.2a5 5 0 0 0-5 5v3.6L5.5 16h13L17 12.8V9.2a5 5 0 0 0-5-5z', 'M10.2 18.6a1.9 1.9 0 0 0 3.6 0'],
  inbox: ['M4.5 13.2L7 6h10l2.5 7.2v5.3h-15z', 'M4.5 13.2h4l1.2 2.2h4.6l1.2-2.2h4'],
  user: ['M12 5.2a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z', 'M5.2 19.6a6.8 6.8 0 0 1 13.6 0'],
  doc: ['M6.5 4.5h7l4.5 4.5v10.5h-11.5z', 'M13.5 4.5V9h4.5'],
  folder: ['M4.5 6.8h5.4l1.9 2.2h7.7v10.2h-15z'],
  clock: ['M12 4.4a7.6 7.6 0 1 0 0 15.2 7.6 7.6 0 0 0 0-15.2z', 'M12 8.2V12l2.8 1.7'],
  refresh: ['M19.5 12a7.5 7.5 0 1 1-2.7-5.8', 'M19.8 4.6v4.2h-4.2'],
  download: ['M12 4.6v9.6', 'M8 10.4l4 4 4-4', 'M5 19.2h14'],
  external: ['M13.8 4.8h5.4v5.4', 'M19.2 4.8l-7.5 7.5', 'M17.6 13.8v5.4H5.2V6.8h5.4'],
  trash: ['M5 7.2h14', 'M9.5 7.2V5h5v2.2', 'M7 7.2l1 12.3h8l1-12.3'],
  play: ['M8.5 5.6l10 6.4-10 6.4z'],
  menu: ['M4.5 7h15', 'M4.5 12h15', 'M4.5 17h15'],
  chevronRight: ['M10 6.5l5.5 5.5L10 17.5'],
  chevronDown: ['M6.5 10l5.5 5.5L17.5 10'],
  chevronUpDown: ['M8.5 10L12 6.5l3.5 3.5', 'M8.5 14l3.5 3.5 3.5-3.5'],
  arrowRight: ['M4.8 12h14', 'M13 6.2l5.8 5.8-5.8 5.8'],
};

export const iconNames = Object.keys(GLYPHS);

const SIZES = { sm: 16, md: 20, lg: 24, xl: 28 };

export function Icon({ name, size = 'md', strokeWidth = 1.75, color, title, style, ...rest }) {
  const paths = GLYPHS[name];
  const px = typeof size === 'number' ? size : (SIZES[size] || SIZES.md);
  if (!paths) return <span aria-hidden="true" style={{ display: 'inline-block', width: px, height: px, ...style }} />;
  return (
    <svg
      viewBox="0 0 24 24"
      width={px}
      height={px}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
      style={{ display: 'block', flex: '0 0 auto', color, ...style }}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
