/* ActiveKit tokens mapped to Clerk's appearance prop.
   Pass this to <ClerkProvider appearance={activekitClerkAppearance}> and every Clerk surface
   inherits the system: teal primary, ink text, hairline borders, pill buttons, Inter.

   Clerk's `variables` are resolved at theme-build time and it generates shades from them with
   color-mix(), so they take LITERAL colour values, not `var(--primary)`. The hex values below are
   the same ones in tokens/colors.css. If a token changes there, change it here too; there is no
   way to hand Clerk the custom property and keep broad browser support.

   `elements` is where the pill shape lives, because Clerk's borderRadius variable rounds
   everything uniformly and ActiveKit buttons are pills while inputs and cards are not. */

export const activekitClerkAppearance = {
  variables: {
    colorPrimary: '#00a7a0',
    colorForeground: '#102033',
    colorSecondaryForeground: '#294056',
    colorMuted: '#607087',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputForeground: '#102033',
    colorDanger: '#ef4da8',
    colorSuccess: '#00a7a0',
    colorWarning: '#f59e0b',
    colorNeutral: '#102033',
    colorRing: '#00a7a0',
    colorShadow: '#1f3f5e',
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    fontFamilyButtons: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    borderRadius: '6px',
  },
  elements: {
    /* The card is drawn by the template, so Clerk's own shell steps out of the way. */
    rootBox: { width: '100%' },
    cardBox: { boxShadow: 'none', border: 'none', width: '100%' },
    card: { boxShadow: 'none', border: 'none', padding: '0', background: 'transparent' },
    header: { display: 'none' },

    formButtonPrimary: {
      borderRadius: '9999px',
      minHeight: '40px',
      background: 'linear-gradient(135deg, #15c6bc 0%, #00a7a0 55%, #087f7a 100%)',
      boxShadow: '0 6px 16px rgba(0,167,160,0.28)',
      fontSize: '16px',
      fontWeight: 400,
      letterSpacing: '0',
      textTransform: 'none',
      transition: 'background 120ms ease, box-shadow 120ms ease',
      '&:hover': { background: 'linear-gradient(135deg, #00a7a0 0%, #087f7a 55%, #087a76 100%)' },
      '&:active': { background: '#087a76' },
    },
    socialButtonsBlockButton: {
      borderRadius: '9999px',
      minHeight: '40px',
      border: '1px solid #00a7a0',
      color: '#087f7a',
      background: '#ffffff',
      '&:hover': { background: '#e4f8f6' },
    },
    formFieldInput: {
      borderRadius: '6px',
      border: '1px solid #d1dee9',
      minHeight: '40px',
      fontSize: '16px',
      '&:focus': { borderColor: '#00a7a0', boxShadow: '0 0 0 3px rgba(0,167,160,0.16)' },
    },
    formFieldLabel: { fontSize: '14px', fontWeight: 500, color: '#294056' },
    otpCodeFieldInput: {
      borderRadius: '6px',
      border: '1px solid #d1dee9',
      fontFeatureSettings: '"tnum","zero"',
    },
    dividerLine: { background: '#dbe6ef' },
    dividerText: { fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#607087' },
    footerActionLink: { color: '#00a7a0', fontWeight: 400, '&:hover': { color: '#087f7a' } },
    formFieldSuccessText: { color: '#087f7a' },
    formFieldErrorText: { color: '#ef4da8' },
    identityPreviewEditButton: { color: '#00a7a0' },
    footer: { background: 'transparent' },
  },
  layout: {
    socialButtonsPlacement: 'bottom',
    socialButtonsVariant: 'blockButton',
    showOptionalFields: true,
  },
};

export default activekitClerkAppearance;
