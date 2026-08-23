/* @ds-bundle: {"format":4,"namespace":"ActiveKitDesignSystem_5626a0","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"AppSidebar","sourcePath":"components/app-shell/AppSidebar.jsx"},{"name":"AppTopBar","sourcePath":"components/app-shell/AppTopBar.jsx"},{"name":"GradientWash","sourcePath":"components/brand/GradientWash.jsx"},{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"EmptyState","sourcePath":"components/empty/EmptyState.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"Footer","sourcePath":"components/navigation/Footer.jsx"},{"name":"Link","sourcePath":"components/navigation/Link.jsx"},{"name":"NavBar","sourcePath":"components/navigation/NavBar.jsx"},{"name":"Modal","sourcePath":"components/overlays/Modal.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"PricingCard","sourcePath":"components/surfaces/PricingCard.jsx"},{"name":"Pill","sourcePath":"components/tags/Pill.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"e9cc36007ea3","components/app-shell/AppSidebar.jsx":"b25c0c1806c8","components/app-shell/AppTopBar.jsx":"3c7a726847a4","components/brand/GradientWash.jsx":"44a123288420","components/brand/Logo.jsx":"e3aedf06a791","components/empty/EmptyState.jsx":"0e47a66fec71","components/feedback/ProgressBar.jsx":"e50fcdbc874f","components/feedback/Skeleton.jsx":"219a41e2d300","components/feedback/Spinner.jsx":"cac7a2f7df97","components/forms/Input.jsx":"dcafed46303c","components/icons/Icon.jsx":"14cf09d6c509","components/navigation/Footer.jsx":"981b07155cd1","components/navigation/Link.jsx":"f967ad8d8e2e","components/navigation/NavBar.jsx":"5f6c5b379cc3","components/overlays/Modal.jsx":"92970320a4df","components/surfaces/Card.jsx":"0283511ca37d","components/surfaces/PricingCard.jsx":"20adb6be7874","components/tags/Pill.jsx":"f11f73ee94b1"},"inlinedExternals":[],"unexposedExports":[{"name":"iconNames","sourcePath":"components/icons/Icon.jsx"}]} */

(() => {

const __ds_ns = (window.ActiveKitDesignSystem_5626a0 = window.ActiveKitDesignSystem_5626a0 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Pill buttons per DESIGN.md > Components > Buttons.
   Geometry is identical across variants: radius-pill + 8px 16px padding (md) / 8px 12px (sm).
   Fills carry the brand gradient: `primary` runs a teal-only ramp (soft → deep) so it reads as
   one colour with depth, `brand` runs the full teal → blue → purple ramp and is capped at one
   per view. Press flattens to a solid, because a pressed control should look pressed, not lit. */

const SIZES = {
  md: {
    fontSize: 'var(--button-md-size)',
    lineHeight: 'var(--button-md-lh)',
    letterSpacing: 'var(--button-md-ls)',
    padding: 'var(--pad-button)',
    gap: 'var(--space-sm)',
    spinner: 15
  },
  sm: {
    fontSize: 'var(--button-sm-size)',
    lineHeight: 'var(--button-sm-lh)',
    letterSpacing: 'var(--button-sm-ls)',
    padding: 'var(--space-sm) var(--space-md)',
    gap: 'var(--space-xs)',
    spinner: 13
  }
};
const VARIANTS = {
  primary: {
    rest: {
      background: 'var(--cta-gradient)',
      color: 'var(--cta-on-fill)',
      borderColor: 'transparent',
      shadow: 'var(--elevation-cta)'
    },
    hover: {
      background: 'var(--cta-gradient-hover)',
      color: 'var(--cta-on-fill)',
      borderColor: 'transparent',
      shadow: 'var(--elevation-cta-hover)'
    },
    press: {
      background: 'var(--cta-fill-press)',
      color: 'var(--cta-on-fill)',
      borderColor: 'transparent',
      shadow: 'var(--elevation-0)'
    },
    track: 'rgba(255,255,255,0.34)'
  },
  brand: {
    rest: {
      background: 'var(--cta-gradient-bold)',
      color: 'var(--cta-on-fill)',
      borderColor: 'transparent',
      shadow: 'var(--elevation-cta)'
    },
    hover: {
      background: 'var(--cta-gradient-bold-hover)',
      color: 'var(--cta-on-fill)',
      borderColor: 'transparent',
      shadow: 'var(--elevation-cta-hover)'
    },
    press: {
      background: 'var(--cta-gradient-bold-press)',
      color: 'var(--cta-on-fill)',
      borderColor: 'transparent',
      shadow: 'var(--elevation-0)'
    },
    track: 'rgba(255,255,255,0.34)'
  },
  secondary: {
    rest: {
      background: 'var(--cta-gradient-quiet)',
      color: 'var(--cta-on-subdued)',
      borderColor: 'var(--primary)',
      shadow: 'var(--elevation-0)'
    },
    hover: {
      background: 'var(--cta-fill-subdued)',
      color: 'var(--cta-on-subdued)',
      borderColor: 'var(--primary-deeper)',
      shadow: 'var(--elevation-1)'
    },
    press: {
      background: 'var(--cta-fill-subdued)',
      color: 'var(--primary-deepest)',
      borderColor: 'var(--primary-deepest)',
      shadow: 'var(--elevation-0)'
    },
    track: 'rgba(0,167,160,0.26)'
  },
  onDark: {
    rest: {
      background: 'var(--surface-dark-gradient)',
      color: 'var(--on-primary)',
      borderColor: 'rgba(255,255,255,0.16)',
      shadow: 'var(--elevation-0)'
    },
    hover: {
      background: 'linear-gradient(135deg, #1e3050 0%, var(--brand-dark-700) 100%)',
      color: 'var(--on-primary)',
      borderColor: 'rgba(255,255,255,0.28)',
      shadow: 'var(--elevation-1)'
    },
    press: {
      background: 'var(--brand-dark-950)',
      color: 'var(--on-primary)',
      borderColor: 'rgba(255,255,255,0.16)',
      shadow: 'var(--elevation-0)'
    },
    track: 'rgba(255,255,255,0.28)'
  },
  ghost: {
    rest: {
      background: 'transparent',
      color: 'var(--ink-secondary)',
      borderColor: 'transparent',
      shadow: 'var(--elevation-0)'
    },
    hover: {
      background: 'var(--cta-fill-subdued)',
      color: 'var(--cta-on-subdued)',
      borderColor: 'transparent',
      shadow: 'var(--elevation-0)'
    },
    press: {
      background: 'var(--cta-fill-subdued)',
      color: 'var(--primary-deepest)',
      borderColor: 'transparent',
      shadow: 'var(--elevation-0)'
    },
    track: 'rgba(0,167,160,0.26)'
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  disabled = false,
  pressed = false,
  loading = false,
  loadingLabel,
  fullWidth = false,
  href,
  onClick,
  type = 'button',
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const inert = disabled || loading;
  const phase = inert ? 'rest' : pressed || down ? 'press' : hover ? 'hover' : 'rest';
  const skin = v[phase];
  const buttonStyles = {
    position: 'relative',
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : undefined,
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--button-md-weight)',
    fontSize: s.fontSize,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    padding: s.padding,
    minHeight: '40px',
    borderRadius: 'var(--radius-button)',
    border: `var(--border-width-hairline) solid ${skin.borderColor}`,
    background: skin.background,
    boxShadow: skin.shadow,
    color: skin.color,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    cursor: disabled ? 'not-allowed' : loading ? 'progress' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'var(--transition-interactive)',
    ...style
  };
  const spinner = /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: s.spinner,
      height: s.spinner,
      flex: '0 0 auto',
      borderRadius: 'var(--radius-pill)',
      border: '2px solid ' + v.track,
      borderTopColor: 'currentColor',
      animation: 'ak-spin var(--dur-spin) linear infinite'
    }
  });
  const content = loading ? /*#__PURE__*/React.createElement(React.Fragment, null, spinner, loadingLabel || children) : /*#__PURE__*/React.createElement(React.Fragment, null, iconLeft, children, iconRight);
  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setDown(false);
    },
    onMouseDown: () => setDown(true),
    onMouseUp: () => setDown(false),
    onBlur: () => setDown(false)
  };
  if (href && !inert) {
    return /*#__PURE__*/React.createElement("a", _extends({
      href: href,
      style: buttonStyles,
      onClick: onClick
    }, handlers, rest), content);
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    style: buttonStyles,
    disabled: inert,
    "aria-busy": loading || undefined,
    onClick: onClick
  }, handlers, rest), content);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/app-shell/AppTopBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* White page header for the product shell: eyebrow, title, right-hand actions, optional tab row.
   An intentional addition, like AppSidebar. */

function AppTopBar({
  eyebrow,
  title,
  children,
  below,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      background: 'var(--canvas)',
      borderBottom: 'var(--border-width-hairline) solid var(--border-hairline)',
      padding: below ? 'var(--space-lg) var(--space-xl) 0' : 'var(--pad-nav)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-lg)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, eyebrow ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--micro-cap-size)',
      lineHeight: 'var(--micro-cap-lh)',
      letterSpacing: 'var(--micro-cap-ls)',
      textTransform: 'uppercase',
      color: 'var(--text-mute)'
    }
  }, eyebrow) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--display-md-size)',
      fontWeight: 'var(--display-md-weight)',
      lineHeight: 'var(--display-md-lh)',
      letterSpacing: 'var(--display-md-ls)',
      color: 'var(--text-body)'
    }
  }, title)), children ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      flexWrap: 'wrap'
    }
  }, children) : null), below ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-xl)',
      marginTop: 'var(--space-lg)'
    }
  }, below) : null);
}
Object.assign(__ds_scope, { AppTopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/app-shell/AppTopBar.jsx", error: String((e && e.message) || e) }); }

// components/brand/GradientWash.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The signature backdrop: large blurred orbs across the upper third of the page.
   A wash, not a mesh. Keep opacity low and blur wide, or the stops read as bands. */

const ORBS = [{
  w: 46,
  h: 62,
  x: -12,
  y: -30,
  c: 'var(--wash-orb-aqua)'
}, {
  w: 30,
  h: 46,
  x: 10,
  y: -18,
  c: 'var(--wash-orb-teal)'
}, {
  w: 42,
  h: 64,
  x: 34,
  y: -36,
  c: 'var(--wash-orb-blue)'
}, {
  w: 26,
  h: 40,
  x: 57,
  y: -14,
  c: 'var(--wash-orb-purple)'
}, {
  w: 44,
  h: 66,
  x: 72,
  y: -32,
  c: 'var(--wash-orb-lavender)'
}, {
  w: 24,
  h: 36,
  x: 85,
  y: -10,
  c: 'var(--wash-orb-purple)'
}];
function GradientWash({
  children,
  height = 'var(--wash-height)',
  opacity = 0.34,
  blur = 'var(--wash-blur)',
  background = 'var(--canvas)',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      background,
      overflow: 'hidden',
      isolation: 'isolate',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height,
      pointerEvents: 'none'
    }
  }, ORBS.map((o, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      position: 'absolute',
      left: o.x + '%',
      top: o.y + '%',
      width: o.w + '%',
      height: o.h + '%',
      borderRadius: '50%',
      background: o.c,
      filter: 'blur(' + blur + ')',
      opacity
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, children));
}
Object.assign(__ds_scope, { GradientWash });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/GradientWash.jsx", error: String((e && e.message) || e) }); }

// components/brand/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The ActiveKit lockup: gradient tile carrying the four-point mark, plus the two-tone wordmark.
   This is the single source for the logo. The mark is the same star path as Icon's `campaigns`
   glyph, filled rather than stroked, so the brand and the product icon set stay one drawing.
   assets/logo.svg is the standalone export of the tile for favicons and external use. */

const MARK = 'M12 3.2l2.1 5.6 5.7 2.1-5.7 2.1-2.1 5.6-2.1-5.6-5.7-2.1 5.7-2.1z';
const SIZES = {
  sm: {
    tile: 24,
    radius: 'var(--radius-sm)',
    font: 'var(--heading-sm-size)',
    gap: 'var(--space-sm)'
  },
  md: {
    tile: 30,
    radius: 'var(--radius-md)',
    font: 'var(--heading-lg-size)',
    gap: 'var(--space-md)'
  },
  lg: {
    tile: 40,
    radius: 'var(--radius-lg)',
    font: 'var(--display-md-size)',
    gap: 'var(--space-md)'
  }
};
function Logo({
  tone = 'onLight',
  size = 'md',
  markOnly = false,
  lead = 'Active',
  tail = 'Kit',
  href,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const onDark = tone === 'onDark';
  const tile = /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      flex: '0 0 auto',
      width: s.tile,
      height: s.tile,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: s.radius,
      background: 'var(--brand-gradient-button)',
      boxShadow: 'var(--elevation-cta)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: s.tile * 0.66,
    height: s.tile * 0.66,
    viewBox: "0 0 24 24",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: MARK,
    fill: "var(--on-primary)"
  })));
  const Tag = href ? 'a' : 'span';
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    "aria-label": markOnly ? lead + tail : undefined,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: s.gap,
      textDecoration: 'none',
      ...style
    }
  }, rest), tile, markOnly ? null : /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: s.font,
      fontWeight: 700,
      letterSpacing: 'var(--display-md-ls)',
      lineHeight: 1,
      color: onDark ? 'var(--on-primary)' : 'var(--ink)',
      whiteSpace: 'nowrap'
    }
  }, lead, /*#__PURE__*/React.createElement("span", {
    style: {
      color: onDark ? 'var(--primary-soft)' : 'var(--purple)'
    }
  }, tail)));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Progress. Determinate when you know the count (uploads, imports, credit caps), indeterminate
   when you do not (an API call in flight). The fill carries the teal → blue ramp, so progress is
   the one place a gradient moves. */

const HEIGHTS = {
  sm: '4px',
  md: '6px',
  lg: '10px'
};
function ProgressBar({
  value,
  label,
  hint,
  showValue = false,
  size = 'md',
  tone = 'light',
  style,
  ...rest
}) {
  const dark = tone === 'dark';
  const indeterminate = value === null || value === undefined;
  const pct = indeterminate ? 0 : Math.max(0, Math.min(100, value));
  const height = HEIGHTS[size] || HEIGHTS.md;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), label || showValue ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body-tabular-size)',
      lineHeight: 'var(--body-tabular-lh)',
      color: dark ? 'rgba(255,255,255,0.80)' : 'var(--ink-secondary)'
    }
  }, label), showValue && !indeterminate ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--caption-size)',
      letterSpacing: 'var(--caption-ls)',
      fontFeatureSettings: 'var(--font-feature-numeric)',
      color: dark ? 'rgba(255,255,255,0.64)' : 'var(--ink-mute)'
    }
  }, pct, "%") : null) : null, /*#__PURE__*/React.createElement("div", {
    role: "progressbar",
    "aria-valuenow": indeterminate ? undefined : pct,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    style: {
      height,
      borderRadius: 'var(--radius-pill)',
      background: dark ? 'rgba(255,255,255,0.14)' : 'rgba(31,63,94,0.10)',
      overflow: 'hidden',
      position: 'relative'
    }
  }, indeterminate ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--progress-gradient)',
      transformOrigin: 'left center',
      animation: 'ak-indeterminate var(--dur-progress) var(--ease-standard) infinite'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + '%',
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--progress-gradient)',
      transition: 'width var(--dur-slow) var(--ease-out)'
    }
  })), hint ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--micro-size)',
      lineHeight: 'var(--micro-lh)',
      fontFeatureSettings: 'var(--font-feature-numeric)',
      color: dark ? 'rgba(255,255,255,0.60)' : 'var(--ink-mute-2)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Skeletons hold the shape of content that is arriving. Shimmer runs left to right at 1500ms
   on a hairline-coloured base, so a loading page keeps the same rhythm as the loaded one. */

const VARIANTS = {
  text: {
    height: '12px',
    radius: 'var(--radius-xs)',
    width: '100%'
  },
  title: {
    height: '22px',
    radius: 'var(--radius-sm)',
    width: '42%'
  },
  metric: {
    height: '34px',
    radius: 'var(--radius-sm)',
    width: '58%'
  },
  pill: {
    height: '28px',
    radius: 'var(--radius-pill)',
    width: '96px'
  },
  avatar: {
    height: '32px',
    radius: 'var(--radius-pill)',
    width: '32px'
  },
  block: {
    height: '96px',
    radius: 'var(--radius-card)',
    width: '100%'
  },
  chart: {
    height: '148px',
    radius: 'var(--radius-card)',
    width: '100%'
  }
};
function Bar({
  variant,
  width,
  height,
  radius,
  tone,
  animated,
  style
}) {
  const v = VARIANTS[variant] || VARIANTS.text;
  const dark = tone === 'dark';
  return /*#__PURE__*/React.createElement("span", {
    "data-ak-decorative-motion": "true",
    style: {
      display: 'block',
      width: width || v.width,
      height: height || v.height,
      borderRadius: radius || v.radius,
      backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(31,63,94,0.09)',
      backgroundImage: animated ? dark ? 'var(--shimmer-gradient-dark)' : 'var(--shimmer-gradient)' : 'none',
      backgroundSize: '220% 100%',
      backgroundRepeat: 'no-repeat',
      animation: animated ? 'ak-shimmer var(--dur-shimmer) var(--ease-standard) infinite' : 'none',
      ...style
    }
  });
}
function Skeleton({
  variant = 'text',
  lines = 1,
  width,
  height,
  radius,
  gap = 'var(--space-sm)',
  tone = 'light',
  animated = true,
  style,
  ...rest
}) {
  if (lines > 1) {
    return /*#__PURE__*/React.createElement("span", _extends({
      "aria-hidden": "true",
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap,
        width: width || '100%',
        ...style
      }
    }, rest), Array.from({
      length: lines
    }).map((_, i) => /*#__PURE__*/React.createElement(Bar, {
      key: i,
      variant: variant,
      width: i === lines - 1 ? '64%' : '100%',
      height: height,
      radius: radius,
      tone: tone,
      animated: animated
    })));
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    "aria-hidden": "true",
    style: {
      display: 'block',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(Bar, {
    variant: variant,
    width: width,
    height: height,
    radius: radius,
    tone: tone,
    animated: animated
  }));
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The one indeterminate loader. A teal ring with a lit head, 720ms linear.
   Keeps spinning under prefers-reduced-motion, because a frozen spinner reads as a hung app. */

const SIZES = {
  sm: 16,
  md: 20,
  lg: 28,
  xl: 40
};
const WEIGHTS = {
  sm: 2,
  md: 2,
  lg: 2.5,
  xl: 3
};
const TONES = {
  primary: {
    track: 'rgba(0,167,160,0.20)',
    head: 'var(--primary)'
  },
  brand: {
    track: 'rgba(107,76,246,0.18)',
    head: 'var(--purple)'
  },
  onDark: {
    track: 'rgba(255,255,255,0.18)',
    head: 'var(--primary-soft)'
  },
  neutral: {
    track: 'rgba(31,63,94,0.14)',
    head: 'var(--ink-mute)'
  }
};
function Spinner({
  size = 'md',
  tone = 'primary',
  label,
  style,
  ...rest
}) {
  const px = typeof size === 'number' ? size : SIZES[size] || SIZES.md;
  const weight = typeof size === 'number' ? Math.max(2, Math.round(px / 9)) : WEIGHTS[size] || 2;
  const t = TONES[tone] || TONES.primary;
  const ring = /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: px,
      height: px,
      flex: '0 0 auto',
      borderRadius: 'var(--radius-pill)',
      border: weight + 'px solid ' + t.track,
      borderTopColor: t.head,
      animation: 'ak-spin var(--dur-spin) linear infinite'
    }
  });
  if (!label) {
    return /*#__PURE__*/React.createElement("span", _extends({
      role: "status",
      "aria-label": "Loading",
      style: {
        display: 'inline-flex',
        ...style
      }
    }, rest), ring);
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "status",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--body-tabular-size)',
      lineHeight: 'var(--body-tabular-lh)',
      color: tone === 'onDark' ? 'rgba(255,255,255,0.72)' : 'var(--ink-mute)',
      ...style
    }
  }, rest), ring, label);
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* text-input / text-input-focused per DESIGN.md > Inputs & Forms.
   6px radius, 8px 12px padding, hairline-input border, teal border on focus. */

function Input({
  label,
  hint,
  error,
  id,
  type = 'text',
  value,
  defaultValue,
  placeholder,
  disabled = false,
  focused = false,
  numeric = false,
  prefix,
  suffix,
  fullWidth = true,
  onChange,
  style,
  ...rest
}) {
  const [isFocus, setFocus] = React.useState(false);
  const active = focused || isFocus;
  const inputId = id || React.useId();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)',
      width: fullWidth ? '100%' : undefined,
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--caption-size)',
      lineHeight: 'var(--caption-lh)',
      letterSpacing: 'var(--caption-ls)',
      fontWeight: 500,
      color: 'var(--ink-secondary)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      background: 'var(--canvas)',
      color: 'var(--ink)',
      padding: 'var(--pad-input)',
      minHeight: '40px',
      borderRadius: 'var(--radius-input)',
      border: 'var(--border-width-hairline) solid ' + (error ? 'var(--ruby)' : active ? 'var(--border-focus)' : 'var(--border-input)'),
      opacity: disabled ? 0.4 : 1,
      transition: 'border-color 120ms ease'
    }
  }, prefix ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-mute)',
      fontSize: 'var(--body-md-size)'
    }
  }, prefix) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: 'var(--ink)',
      fontFamily: 'var(--font-sans)',
      fontSize: numeric ? 'var(--body-tabular-size)' : 'var(--body-md-size)',
      fontWeight: 'var(--body-md-weight)',
      lineHeight: 'var(--body-md-lh)',
      letterSpacing: numeric ? 'var(--body-tabular-ls)' : 'var(--body-md-ls)',
      fontFeatureSettings: numeric ? 'var(--font-feature-numeric)' : undefined
    }
  }, rest)), suffix ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-mute)',
      fontSize: 'var(--caption-size)'
    }
  }, suffix) : null), error || hint ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--caption-size)',
      lineHeight: 'var(--caption-lh)',
      letterSpacing: 'var(--caption-ls)',
      color: error ? 'var(--text-body)' : 'var(--ink-mute)'
    }
  }, error || hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
  arrowRight: ['M4.8 12h14', 'M13 6.2l5.8 5.8-5.8 5.8']
};
const iconNames = Object.keys(GLYPHS);
const SIZES = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28
};
function Icon({
  name,
  size = 'md',
  strokeWidth = 1.75,
  color,
  title,
  style,
  ...rest
}) {
  const paths = GLYPHS[name];
  const px = typeof size === 'number' ? size : SIZES[size] || SIZES.md;
  if (!paths) return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: 'inline-block',
      width: px,
      height: px,
      ...style
    }
  });
  return /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: px,
    height: px,
    role: title ? 'img' : 'presentation',
    "aria-hidden": title ? undefined : 'true',
    "aria-label": title,
    style: {
      display: 'block',
      flex: '0 0 auto',
      color,
      ...style
    }
  }, rest), title ? /*#__PURE__*/React.createElement("title", null, title) : null, paths.map((d, i) => /*#__PURE__*/React.createElement("path", {
    key: i,
    d: d,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })));
}
Object.assign(__ds_scope, { iconNames, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/app-shell/AppSidebar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Slate app-shell sidebar. Not in DESIGN.md's component list — an intentional addition so the
   six product templates share one sidebar instead of six copies. See readme "Intentional additions".

   The column carries the brand: a gradient logo tile, a vertical slate ramp, one teal-to-purple
   glow bleeding out of the top-left corner, and a gradient bar on the active item. Icons are
   inferred from the label, so existing templates gain them without changing their props. */

const ICON_BY_LABEL = {
  overview: 'overview',
  dashboard: 'overview',
  home: 'overview',
  campaigns: 'campaigns',
  campaign: 'campaigns',
  ledger: 'ledger',
  payouts: 'ledger',
  activity: 'ledger',
  credits: 'credits',
  billing: 'credits',
  'credits and billing': 'credits',
  developers: 'developers',
  api: 'developers',
  webhooks: 'developers',
  settings: 'settings',
  workspace: 'settings',
  team: 'team',
  members: 'team',
  audience: 'team',
  reports: 'chart',
  analytics: 'chart',
  insights: 'chart',
  docs: 'doc',
  templates: 'folder',
  history: 'clock'
};
function iconFor(item, label) {
  if (item && typeof item === 'object' && item.icon) return item.icon;
  return ICON_BY_LABEL[String(label || '').toLowerCase()] || 'chevronRight';
}
function NavItem({
  label,
  href,
  active,
  icon,
  badge
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: href || '#',
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      padding: 'var(--space-sm) var(--space-md)',
      borderRadius: 'var(--radius-md)',
      background: active ? 'var(--nav-active-gradient)' : hover ? 'var(--nav-hover-gradient)' : 'transparent',
      color: active ? 'var(--on-primary)' : hover ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.70)',
      fontSize: 'var(--body-md-size)',
      lineHeight: 'var(--body-md-lh)',
      textDecoration: 'none',
      transition: 'var(--transition-interactive)'
    }
  }, active ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      left: 0,
      top: '20%',
      bottom: '20%',
      width: '2px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--nav-active-bar)'
    }
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: active ? 'var(--primary-soft)' : 'currentColor',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: "md"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, label), badge ? /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '0 0 auto',
      padding: '1px var(--space-sm)',
      borderRadius: 'var(--radius-pill)',
      background: active ? 'var(--primary-soft)' : 'rgba(255,255,255,0.12)',
      color: active ? 'var(--brand-dark-900)' : 'rgba(255,255,255,0.80)',
      fontSize: 'var(--micro-size)',
      lineHeight: '18px',
      fontFeatureSettings: 'var(--font-feature-numeric)'
    }
  }, badge) : null);
}
function AppSidebar({
  brand = 'ActiveKit',
  workspace,
  items = [],
  meter,
  user,
  footerAction,
  width = '248px',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("aside", _extends({
    style: {
      position: 'relative',
      width,
      flex: '0 0 auto',
      background: 'var(--sidebar-gradient)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      padding: 'var(--space-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      fontFamily: 'var(--font-sans)',
      boxSizing: 'border-box',
      overflow: 'hidden',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--sidebar-glow)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 auto',
      padding: 'var(--space-xs) var(--space-sm)'
    }
  }, brand === 'ActiveKit' ? /*#__PURE__*/React.createElement(__ds_scope.Logo, {
    tone: "onDark"
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Logo, {
    tone: "onDark",
    markOnly: true
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--heading-lg-size)',
      fontWeight: 700,
      letterSpacing: 'var(--display-md-ls)',
      lineHeight: 1,
      color: 'var(--on-primary)'
    }
  }, brand))), workspace ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      flex: '0 0 auto',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      width: '100%',
      padding: 'var(--space-sm) var(--space-md)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid rgba(255,255,255,0.10)',
      background: 'rgba(255,255,255,0.05)',
      color: 'var(--on-primary)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--caption-size)',
      letterSpacing: 'var(--caption-ls)',
      textAlign: 'left',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      flex: '0 0 auto',
      width: '22px',
      height: '22px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-xs)',
      background: 'var(--cta-gradient)',
      fontSize: 'var(--micro-size)',
      color: 'var(--on-primary)'
    }
  }, workspace.initials), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, workspace.name), workspace.plan ? /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '0 0 auto',
      padding: '0 var(--space-sm)',
      borderRadius: 'var(--radius-pill)',
      background: 'rgba(21,198,188,0.16)',
      color: 'var(--primary-soft)',
      fontSize: 'var(--micro-size)',
      lineHeight: '18px'
    }
  }, workspace.plan) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'rgba(255,255,255,0.50)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevronUpDown",
    size: "sm"
  }))) : null, /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: '1 1 auto',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xxs)',
      overflowY: 'auto',
      scrollbarWidth: 'none'
    }
  }, items.map((it, i) => {
    if (it && typeof it === 'object' && it.section) {
      return /*#__PURE__*/React.createElement("div", {
        key: 's' + i,
        style: {
          padding: 'var(--space-md) var(--space-md) var(--space-xs)',
          fontSize: 'var(--micro-cap-size)',
          lineHeight: 'var(--micro-cap-lh)',
          letterSpacing: 'var(--micro-cap-ls)',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.42)'
        }
      }, it.section);
    }
    const label = typeof it === 'string' ? it : it.label;
    return /*#__PURE__*/React.createElement(NavItem, {
      key: label + i,
      label: label,
      href: typeof it === 'object' ? it.href : undefined,
      active: typeof it === 'object' && it.active,
      badge: typeof it === 'object' ? it.badge : undefined,
      icon: iconFor(it, label)
    });
  })), meter ? /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 auto',
      marginTop: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)',
      padding: 'var(--space-md)',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--primary-soft)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "credits",
    size: "sm"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--micro-cap-size)',
      lineHeight: 'var(--micro-cap-lh)',
      letterSpacing: 'var(--micro-cap-ls)',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.60)'
    }
  }, meter.label)), meter.value ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--display-md-size)',
      fontWeight: 700,
      letterSpacing: 'var(--display-md-ls)',
      color: 'var(--on-primary)',
      fontFeatureSettings: 'var(--font-feature-numeric)'
    }
  }, meter.value) : null, typeof meter.pct === 'number' ? /*#__PURE__*/React.createElement("div", {
    style: {
      height: '5px',
      borderRadius: 'var(--radius-pill)',
      background: 'rgba(255,255,255,0.14)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: Math.max(0, Math.min(100, meter.pct)) + '%',
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--progress-gradient)',
      transition: 'width var(--dur-slow) var(--ease-out)'
    }
  })) : null, meter.note ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--micro-size)',
      lineHeight: 'var(--micro-lh)',
      color: 'rgba(255,255,255,0.60)',
      fontFeatureSettings: 'var(--font-feature-numeric)'
    }
  }, meter.note) : null) : null, user ? /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 auto',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      padding: 'var(--space-sm)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      marginTop: meter ? undefined : 'auto'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '0 0 auto',
      width: '30px',
      height: '30px',
      borderRadius: 'var(--radius-pill)',
      background: 'linear-gradient(135deg, var(--purple) 0%, var(--gradient-blue) 100%)',
      color: 'var(--on-primary)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'var(--caption-size)',
      letterSpacing: 'var(--caption-ls)'
    }
  }, user.initials), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--caption-size)',
      letterSpacing: 'var(--caption-ls)',
      color: 'var(--on-primary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, user.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--micro-size)',
      color: 'rgba(255,255,255,0.60)'
    }
  }, user.role)), footerAction === null ? null : /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'rgba(255,255,255,0.50)',
      display: 'flex'
    }
  }, footerAction || /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "settings",
    size: "sm"
  }))) : null));
}
Object.assign(__ds_scope, { AppSidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/app-shell/AppSidebar.jsx", error: String((e && e.message) || e) }); }

// components/empty/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Empty states. A branded medallion, a sentence that says what is missing, a sentence that says
   what to do, and the action that does it. The medallion is where the gradient wash appears at
   component scale, which is what keeps an empty page on-brand instead of merely blank.

   tone="danger" is the fourth kind this component's prompt file already names, the region that is
   empty because a request failed. It swaps the medallion for the ruby one Modal's danger tone
   already draws and drops the glow, because the glow is the brand wash and a failure is not
   carrying brand. Nothing else moves: the frame, the type and the text colors stay, so a failed
   list still reads as the same component rather than as an alarm. */

const SIZES = {
  sm: {
    pad: 'var(--space-xl)',
    medallion: 44,
    icon: 20,
    title: 'var(--heading-sm-size)',
    gap: 'var(--space-sm)'
  },
  md: {
    pad: 'var(--space-xxl)',
    medallion: 56,
    icon: 24,
    title: 'var(--heading-md-size)',
    gap: 'var(--space-md)'
  },
  lg: {
    pad: 'var(--space-huge) var(--space-xxl)',
    medallion: 72,
    icon: 28,
    title: 'var(--heading-lg-size)',
    gap: 'var(--space-md)'
  }
};
const FRAMES = {
  none: {},
  dashed: {
    border: '1px dashed var(--border-hairline)',
    borderRadius: 'var(--radius-card)',
    background: 'var(--surface-page)'
  },
  card: {
    border: 'var(--border-width-hairline) solid var(--border-hairline)',
    borderRadius: 'var(--radius-card)',
    background: 'var(--surface-card)',
    boxShadow: 'var(--elevation-1)'
  }
};
const DARK_FRAMES = {
  none: {},
  dashed: {
    border: '1px dashed rgba(255,255,255,0.16)',
    borderRadius: 'var(--radius-card)',
    background: 'rgba(255,255,255,0.03)'
  },
  card: {
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 'var(--radius-card)',
    background: 'rgba(255,255,255,0.05)'
  }
};
function EmptyState({
  icon = 'inbox',
  title,
  description,
  actions,
  hint,
  size = 'md',
  tone = 'light',
  frame = 'none',
  align = 'center',
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const dark = tone === 'dark';
  const danger = tone === 'danger';
  const frameStyle = (dark ? DARK_FRAMES : FRAMES)[frame] || {};
  const centered = align === 'center';
  const glyph = typeof icon === 'string' ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }) : icon;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: centered ? 'center' : 'flex-start',
      textAlign: centered ? 'center' : 'left',
      gap: s.gap,
      padding: s.pad,
      fontFamily: 'var(--font-sans)',
      ...frameStyle,
      ...style
    }
  }, rest), icon !== null ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      marginBottom: 'var(--space-xs)'
    }
  }, danger ? null : /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%,-50%)',
      width: s.medallion * 2,
      height: s.medallion * 2,
      background: 'var(--medallion-glow)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: s.medallion,
      height: s.medallion,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-mockup)',
      background: dark ? 'rgba(255,255,255,0.07)' : danger ? 'var(--surface-danger)' : 'var(--medallion-gradient)',
      border: dark ? '1px solid rgba(255,255,255,0.12)' : danger ? 'var(--border-width-hairline) solid var(--border-danger)' : 'var(--border-width-hairline) solid var(--border-hairline)',
      color: dark ? 'var(--primary-soft)' : danger ? 'var(--text-danger)' : 'var(--primary-deep)'
    }
  }, glyph)) : null, title ? /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: s.title,
      fontWeight: 'var(--heading-md-weight)',
      lineHeight: 'var(--heading-md-lh)',
      letterSpacing: 'var(--heading-md-ls)',
      color: dark ? 'var(--on-primary)' : 'var(--text-body)'
    }
  }, title) : null, description ? /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: '46ch',
      fontSize: 'var(--body-md-size)',
      lineHeight: 'var(--body-md-lh)',
      color: dark ? 'rgba(255,255,255,0.68)' : 'var(--text-mute)',
      textWrap: 'pretty'
    }
  }, description) : null, actions ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: centered ? 'center' : 'flex-start',
      gap: 'var(--space-md)',
      paddingTop: 'var(--space-sm)'
    }
  }, actions) : null, hint ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--micro-size)',
      lineHeight: 'var(--micro-lh)',
      color: dark ? 'rgba(255,255,255,0.52)' : 'var(--text-mute-2)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/empty/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Link.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* link-on-light per DESIGN.md. Teal, body-md, no underline by default. */

function Link({
  children,
  href = '#',
  tone = 'primary',
  underline = 'hover',
  size = 'md',
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const colors = {
    primary: {
      rest: 'var(--text-link)',
      hover: 'var(--primary-deeper)'
    },
    muted: {
      rest: 'var(--ink-mute)',
      hover: 'var(--ink)'
    },
    onDark: {
      rest: 'rgba(255,255,255,0.72)',
      hover: 'var(--on-primary)'
    }
  }[tone] || {
    rest: 'var(--text-link)',
    hover: 'var(--primary-deeper)'
  };
  return /*#__PURE__*/React.createElement("a", _extends({
    href: href,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: size === 'sm' ? 'var(--caption-size)' : 'var(--body-md-size)',
      fontWeight: 'var(--body-md-weight)',
      lineHeight: 'var(--body-md-lh)',
      letterSpacing: size === 'sm' ? 'var(--caption-ls)' : 'var(--body-md-ls)',
      color: hover ? colors.hover : colors.rest,
      textDecoration: underline === 'always' || underline === 'hover' && hover ? 'underline' : 'none',
      textUnderlineOffset: '2px',
      transition: 'color 120ms ease',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Link });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Link.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Footer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* footer-light per DESIGN.md. Canvas background, ink-mute caption type, 64px 24px padding. */

function Footer({
  brand = 'ActiveKit',
  tagline,
  columns = [],
  legal = '\u00A9 2026 ActiveKit, Inc.',
  legalLinks = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("footer", _extends({
    style: {
      background: 'var(--canvas)',
      color: 'var(--ink-mute)',
      padding: 'var(--pad-footer)',
      borderTop: 'var(--border-width-hairline) solid var(--hairline)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--caption-size)',
      lineHeight: 'var(--caption-lh)',
      letterSpacing: 'var(--caption-ls)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-huge)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 220px',
      minWidth: '180px',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)'
    }
  }, brand === 'ActiveKit' ? /*#__PURE__*/React.createElement(__ds_scope.Logo, {
    size: "lg",
    href: "#"
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--display-md-size)',
      fontWeight: 700,
      letterSpacing: 'var(--display-md-ls)',
      color: 'var(--ink)'
    }
  }, brand), tagline ? /*#__PURE__*/React.createElement("span", {
    style: {
      maxWidth: '30ch'
    }
  }, tagline) : null), columns.map(col => /*#__PURE__*/React.createElement("div", {
    key: col.title,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      minWidth: '128px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--micro-cap-size)',
      lineHeight: 'var(--micro-cap-lh)',
      letterSpacing: 'var(--micro-cap-ls)',
      textTransform: 'uppercase',
      color: 'var(--ink-secondary)',
      fontWeight: 500
    }
  }, col.title), col.links.map(l => /*#__PURE__*/React.createElement(__ds_scope.Link, {
    key: typeof l === 'string' ? l : l.label,
    tone: "muted",
    size: "sm",
    href: typeof l === 'string' ? '#' : l.href || '#'
  }, typeof l === 'string' ? l : l.label))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-lg)',
      flexWrap: 'wrap',
      marginTop: 'var(--space-huge)',
      paddingTop: 'var(--space-xl)',
      borderTop: 'var(--border-width-hairline) solid var(--hairline)',
      fontSize: 'var(--micro-size)',
      letterSpacing: 'var(--micro-ls)'
    }
  }, /*#__PURE__*/React.createElement("span", null, legal), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-lg)'
    }
  }, legalLinks.map(l => /*#__PURE__*/React.createElement(__ds_scope.Link, {
    key: typeof l === 'string' ? l : l.label,
    tone: "muted",
    size: "sm",
    href: typeof l === 'string' ? '#' : l.href || '#'
  }, typeof l === 'string' ? l : l.label))))));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* nav-bar-on-mesh per DESIGN.md. Wordmark left, nav centre, sign-in plus one filled pill right.
   Sits over the gradient wash, so the default background is transparent. */

function NavBar({
  brand = 'ActiveKit',
  items = [],
  activeItem,
  signInLabel = 'Sign in',
  ctaLabel = 'Start free',
  onSignIn,
  onCta,
  onDark = false,
  transparent = true,
  style,
  ...rest
}) {
  const ink = onDark ? 'var(--on-primary)' : 'var(--ink)';
  const muted = onDark ? 'rgba(255,255,255,0.72)' : 'var(--ink-mute-2)';
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xl)',
      padding: 'var(--pad-nav)',
      background: transparent ? 'transparent' : onDark ? 'var(--surface-dark)' : 'var(--canvas)',
      borderBottom: transparent ? 'none' : 'var(--border-width-hairline) solid ' + (onDark ? 'rgba(255,255,255,0.10)' : 'var(--hairline)'),
      borderRadius: transparent ? 'var(--radius-xs)' : 0,
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), brand === 'ActiveKit' ? /*#__PURE__*/React.createElement(__ds_scope.Logo, {
    tone: onDark ? 'onDark' : 'onLight',
    href: "#"
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--heading-lg-size)',
      fontWeight: 700,
      letterSpacing: 'var(--display-md-ls)',
      color: ink,
      whiteSpace: 'nowrap'
    }
  }, brand), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xl)',
      flex: 1,
      justifyContent: 'center'
    }
  }, items.map(it => {
    const label = typeof it === 'string' ? it : it.label;
    const href = typeof it === 'string' ? '#' : it.href || '#';
    const isActive = activeItem === label;
    return /*#__PURE__*/React.createElement("a", {
      key: label,
      href: href,
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--body-md-size)',
        lineHeight: 'var(--body-md-lh)',
        letterSpacing: 'var(--body-md-ls)',
        color: isActive ? ink : muted,
        textDecoration: 'none',
        whiteSpace: 'nowrap'
      }
    }, label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-lg)'
    }
  }, signInLabel ? /*#__PURE__*/React.createElement(__ds_scope.Link, {
    tone: onDark ? 'onDark' : 'muted',
    underline: "hover",
    onClick: onSignIn,
    href: "#"
  }, signInLabel) : null, ctaLabel ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: onDark ? 'primary' : 'primary',
    size: "sm",
    onClick: onCta
  }, ctaLabel) : null));
}
Object.assign(__ds_scope, { NavBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavBar.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Modal.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Modals, confirms, and prompts. One shell, four tones. The gradient rule across the top is the
   only brand colour on the panel, which is what lets a destructive dialog stay ruby without the
   surrounding chrome arguing with it. */

const SIZES = {
  sm: '400px',
  md: '520px',
  lg: '680px'
};
const TONES = {
  brand: {
    rule: 'var(--cta-gradient-bold)',
    medallion: 'var(--medallion-gradient)',
    icon: 'var(--primary-deep)',
    border: 'var(--border-hairline)'
  },
  neutral: {
    rule: 'linear-gradient(90deg, var(--hairline) 0%, var(--hairline) 100%)',
    medallion: 'var(--surface-page)',
    icon: 'var(--ink-secondary)',
    border: 'var(--border-hairline)'
  },
  danger: {
    rule: 'linear-gradient(135deg, var(--ruby) 0%, var(--purple) 100%)',
    medallion: 'var(--surface-danger)',
    icon: 'var(--ruby)',
    border: 'var(--border-danger)'
  },
  success: {
    rule: 'linear-gradient(135deg, var(--primary-soft) 0%, var(--primary) 100%)',
    medallion: 'var(--cta-fill-subdued)',
    icon: 'var(--primary-deep)',
    border: 'var(--border-hairline)'
  }
};
function Modal({
  open = true,
  title,
  description,
  children,
  icon,
  tone = 'brand',
  size = 'md',
  actions,
  footnote,
  onClose,
  dismissible = true,
  inline = false,
  style,
  ...rest
}) {
  if (!open) return null;
  const t = TONES[tone] || TONES.brand;
  const glyph = typeof icon === 'string' ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: "lg"
  }) : icon;
  const panel = /*#__PURE__*/React.createElement("div", _extends({
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === 'string' ? title : undefined,
    style: {
      position: 'relative',
      width: '100%',
      maxWidth: SIZES[size] || SIZES.md,
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--elevation-modal)',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
      animation: 'ak-modal-in var(--dur-slow) var(--ease-out)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      height: '3px',
      background: t.rule
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-lg)',
      padding: 'var(--space-xl) var(--space-xl) 0'
    }
  }, icon ? /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 auto',
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-md)',
      background: t.medallion,
      border: 'var(--border-width-hairline) solid ' + t.border,
      color: t.icon
    }
  }, glyph) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)',
      paddingRight: dismissible ? 'var(--space-xl)' : 0
    }
  }, title ? /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--heading-md-size)',
      fontWeight: 'var(--heading-md-weight)',
      lineHeight: 'var(--heading-md-lh)',
      letterSpacing: 'var(--heading-md-ls)',
      color: 'var(--text-body)'
    }
  }, title) : null, description ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--body-md-size)',
      lineHeight: 'var(--body-md-lh)',
      color: 'var(--text-mute)',
      textWrap: 'pretty'
    }
  }, description) : null), dismissible ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    "aria-label": "Close",
    style: {
      position: 'absolute',
      top: 'var(--space-lg)',
      right: 'var(--space-lg)',
      width: '28px',
      height: '28px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      borderRadius: 'var(--radius-pill)',
      background: 'transparent',
      color: 'var(--ink-mute)',
      cursor: 'pointer',
      transition: 'var(--transition-interactive)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: "sm"
  })) : null), children ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-lg) var(--space-xl) 0',
      color: 'var(--text-secondary)'
    }
  }, children) : null, actions || footnote ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: footnote ? 'space-between' : 'flex-end',
      gap: 'var(--space-lg)',
      marginTop: 'var(--space-xl)',
      padding: 'var(--space-lg) var(--space-xl)',
      borderTop: 'var(--border-width-hairline) solid var(--border-hairline)',
      background: 'var(--surface-page)'
    }
  }, footnote ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--micro-size)',
      lineHeight: 'var(--micro-lh)',
      color: 'var(--text-mute-2)'
    }
  }, footnote) : null, actions ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    }
  }, actions) : null) : /*#__PURE__*/React.createElement("div", {
    style: {
      height: 'var(--space-xl)'
    }
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: inline ? 'relative' : 'fixed',
      inset: 0,
      zIndex: inline ? undefined : 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-xl)',
      background: 'var(--scrim-modal)',
      animation: 'ak-scrim-in var(--dur-base) ease'
    },
    onClick: dismissible && onClose ? e => {
      if (e.target === e.currentTarget) onClose();
    } : undefined
  }, panel);
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Modal.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Surface container per DESIGN.md > Components > Cards & Containers.
   feature = card-feature-light · violet = card-cream-band · mockup = card-dashboard-mockup */

const VARIANTS = {
  feature: {
    background: 'var(--surface-card)',
    color: 'var(--text-body)',
    padding: 'var(--pad-card)',
    borderRadius: 'var(--radius-card)',
    fontSize: 'var(--body-md-size)',
    letterSpacing: 'var(--body-md-ls)',
    defaultElevation: '1',
    defaultBorder: true
  },
  violet: {
    background: 'var(--surface-band-violet)',
    color: 'var(--text-body)',
    padding: 'var(--pad-card)',
    borderRadius: 'var(--radius-card)',
    fontSize: 'var(--body-md-size)',
    letterSpacing: 'var(--body-md-ls)',
    defaultElevation: '0',
    defaultBorder: false
  },
  mockup: {
    background: 'var(--surface-card)',
    color: 'var(--text-body)',
    padding: 'var(--pad-card-mockup)',
    borderRadius: 'var(--radius-card)',
    fontSize: 'var(--body-tabular-size)',
    letterSpacing: 'var(--body-tabular-ls)',
    fontFeatureSettings: 'var(--font-feature-numeric)',
    defaultElevation: '2',
    defaultBorder: true
  }
};
function Card({
  children,
  variant = 'feature',
  elevation,
  bordered,
  eyebrow,
  title,
  as: Tag = 'div',
  style,
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.feature;
  const level = elevation === undefined ? v.defaultElevation : String(elevation);
  const hasBorder = bordered === undefined ? v.defaultBorder : bordered;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      background: v.background,
      color: v.color,
      padding: v.padding,
      borderRadius: v.borderRadius,
      border: hasBorder ? 'var(--border-width-hairline) solid var(--border-hairline)' : 'var(--border-width-hairline) solid transparent',
      boxShadow: `var(--elevation-${level})`,
      fontFamily: 'var(--font-sans)',
      fontSize: v.fontSize,
      fontWeight: 'var(--body-md-weight)',
      lineHeight: 'var(--body-md-lh)',
      letterSpacing: v.letterSpacing,
      fontFeatureSettings: v.fontFeatureSettings,
      ...style
    }
  }, rest), eyebrow ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--micro-cap-size)',
      fontWeight: 'var(--micro-cap-weight)',
      lineHeight: 'var(--micro-cap-lh)',
      letterSpacing: 'var(--micro-cap-ls)',
      textTransform: 'uppercase',
      color: 'var(--text-mute)',
      marginBottom: 'var(--space-md)'
    }
  }, eyebrow) : null, title ? /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--display-md-size)',
      fontWeight: 'var(--display-md-weight)',
      lineHeight: 'var(--display-md-lh)',
      letterSpacing: 'var(--display-md-ls)',
      color: 'var(--text-body)',
      margin: `0 0 var(--space-md)`
    }
  }, title) : null, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/PricingCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* card-pricing / card-pricing-featured per DESIGN.md.
   Identical structure; `featured` inverts the surface to brand-dark-900. */

function PricingCard({
  tierName,
  price,
  priceSuffix,
  description,
  features = [],
  ctaLabel = 'Get started',
  ctaHref,
  ctaVariant,
  onCtaClick,
  featured = false,
  footnote,
  style,
  ...rest
}) {
  const fg = featured ? 'var(--text-on-dark)' : 'var(--text-body)';
  const muted = featured ? 'rgba(255,255,255,0.72)' : 'var(--text-mute)';
  const rule = featured ? 'rgba(255,255,255,0.14)' : 'var(--border-hairline)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      background: featured ? 'var(--surface-dark)' : 'var(--surface-card)',
      color: fg,
      padding: 'var(--pad-card)',
      borderRadius: 'var(--radius-card)',
      border: `var(--border-width-hairline) solid ${featured ? 'transparent' : 'var(--border-hairline)'}`,
      boxShadow: featured ? 'var(--elevation-2)' : 'var(--elevation-1)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--heading-lg-size)',
      fontWeight: 'var(--heading-lg-weight)',
      lineHeight: 'var(--heading-lg-lh)',
      letterSpacing: 'var(--heading-lg-ls)'
    }
  }, tierName), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--space-xs)',
      marginTop: 'var(--space-lg)',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--display-md-size)',
      fontWeight: 'var(--display-md-weight)',
      lineHeight: 'var(--display-md-lh)',
      letterSpacing: 'var(--display-md-ls)',
      fontFeatureSettings: 'var(--font-feature-numeric)'
    }
  }, /*#__PURE__*/React.createElement("span", null, price), priceSuffix ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--caption-size)',
      fontWeight: 'var(--caption-weight)',
      lineHeight: 'var(--caption-lh)',
      letterSpacing: 'var(--caption-ls)',
      color: muted
    }
  }, priceSuffix) : null), description ? /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-md)',
      fontSize: 'var(--body-md-size)',
      fontWeight: 'var(--body-md-weight)',
      lineHeight: 'var(--body-md-lh)',
      letterSpacing: 'var(--body-md-ls)',
      color: muted
    }
  }, description) : null, features.length ? /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      margin: `var(--space-xl) 0 0`,
      padding: `var(--space-xl) 0 0`,
      borderTop: `var(--border-width-hairline) solid ${rule}`,
      fontSize: 'var(--body-md-size)',
      lineHeight: 'var(--body-md-lh)',
      letterSpacing: 'var(--body-md-ls)'
    }
  }, features.map(f => /*#__PURE__*/React.createElement("li", {
    key: typeof f === 'string' ? f : undefined,
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      flex: '0 0 auto',
      width: 'var(--space-xs)',
      height: 'var(--space-xs)',
      borderRadius: 'var(--radius-pill)',
      background: featured ? 'var(--primary-soft)' : 'var(--primary)',
      transform: 'translateY(-2px)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "ak-tnum"
  }, f)))) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 'var(--space-xl)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: ctaVariant || (featured ? 'primary' : 'secondary'),
    href: ctaHref,
    onClick: onCtaClick,
    fullWidth: true
  }, ctaLabel), footnote ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-md)',
      fontSize: 'var(--micro-size)',
      lineHeight: 'var(--micro-lh)',
      letterSpacing: 'var(--micro-ls)',
      color: muted,
      textAlign: 'center'
    }
  }, footnote) : null));
}
Object.assign(__ds_scope, { PricingCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/PricingCard.jsx", error: String((e && e.message) || e) }); }

// components/tags/Pill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* pill-tag-soft per DESIGN.md > Pills, Tags, and Chips.
   micro-cap type, 4px 8px padding, pill radius, pale teal fill. */

const TONES = {
  soft: {
    background: 'var(--surface-tag)',
    color: 'var(--text-tag)',
    borderColor: 'transparent'
  },
  outline: {
    background: 'var(--canvas)',
    color: 'var(--primary-deep)',
    borderColor: 'var(--hairline)'
  },
  onDark: {
    background: 'rgba(255,255,255,0.10)',
    color: 'var(--primary-soft)',
    borderColor: 'transparent'
  }
};
function Pill({
  children,
  tone = 'soft',
  dot = false,
  style,
  ...rest
}) {
  const skin = TONES[tone] || TONES.soft;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      background: skin.background,
      color: skin.color,
      border: 'var(--border-width-hairline) solid ' + skin.borderColor,
      borderRadius: 'var(--radius-tag)',
      padding: 'var(--pad-tag)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--micro-cap-size)',
      fontWeight: 'var(--micro-cap-weight)',
      lineHeight: 'var(--micro-cap-lh)',
      letterSpacing: 'var(--micro-cap-ls)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 'var(--space-xs)',
      height: 'var(--space-xs)',
      borderRadius: 'var(--radius-pill)',
      background: tone === 'onDark' ? 'var(--primary-soft)' : 'var(--primary)'
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/tags/Pill.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.AppSidebar = __ds_scope.AppSidebar;

__ds_ns.AppTopBar = __ds_scope.AppTopBar;

__ds_ns.GradientWash = __ds_scope.GradientWash;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.Link = __ds_scope.Link;

__ds_ns.NavBar = __ds_scope.NavBar;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.PricingCard = __ds_scope.PricingCard;

__ds_ns.Pill = __ds_scope.Pill;

})();
