---
name: JobFlow UI
colors:
  surface: '#f7fafc'
  surface-dim: '#d7dadc'
  surface-bright: '#f7fafc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f6'
  surface-container: '#ebeef0'
  surface-container-high: '#e5e9eb'
  surface-container-highest: '#e0e3e5'
  on-surface: '#181c1e'
  on-surface-variant: '#444654'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eef1f3'
  outline: '#747685'
  outline-variant: '#c4c5d6'
  surface-tint: '#3354ca'
  primary: '#3051c8'
  on-primary: '#ffffff'
  primary-container: '#4c6be2'
  on-primary-container: '#fffbff'
  inverse-primary: '#b8c4ff'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#8b4c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#af6100'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001454'
  on-primary-fixed-variant: '#0f39b2'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#ffdcc1'
  tertiary-fixed-dim: '#ffb779'
  on-tertiary-fixed: '#2e1500'
  on-tertiary-fixed-variant: '#6c3a00'
  background: '#f7fafc'
  on-background: '#181c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 20px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style

The design system supports a map-based Location Tracker focused on tracking visited locations and campaign progress on a map. It is designed for users who load campaign data, mark locations as "Visited", and monitor progress across cities. The brand personality is **Professional yet Approachable**, bridging the gap between corporate reliability and startup energy. The visual approach focuses on a **Modern Corporate** aesthetic with high-contrast elements that prioritize legibility and rapid information scanning.

The visual style is characterized by generous whitespace, soft-rounded containers to reduce cognitive stress, and a monochromatic foundation punctuated by a vibrant primary blue. This creates a focused environment that feels both high-end and utilitarian.

## Colors

The palette is anchored by a deep **Carbon Neutral** for primary actions and text, providing a solid, grounded feel. The **Electric Blue** serves as the primary accent, used exclusively for interactive highlights, key brand moments, and progress indicators.

- **Primary:** Electric Blue (#5D7BF3) for CTA accents and active states.
- **Surface:** Carbon (#212121) for primary buttons and high-contrast text.
- **Background:** White (#FFFFFF) for primary canvases with Off-White (#F4F7F9) for secondary background layers and card fills.
- **Semantic:** Clear green for "Applied" or "Hired" states, and soft red for errors or expired listings.

## Typography

This design system uses **Montserrat** across all levels to maintain a cohesive, geometric, and modern feel. 

- **Headlines:** Use Bold (700) or Semi-Bold (600) weights. Display sizes should utilize tighter letter spacing (-0.02em) to maintain visual impact.
- **Body Text:** Use Regular (400) for long-form content like job descriptions. Ensure line heights are generous (1.5 - 1.6) to promote readability.
- **Captions & Labels:** Use Medium (500) or Semi-Bold (600) at smaller scales to ensure the geometric letterforms remain legible on low-resolution screens.

## Layout & Spacing

The layout utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

- **Rhythm:** An 8px linear scale governs all padding and margins.
- **Mobile:** Elements should span the full width of the safe area (20px margins) to maximize touch targets. All screen should be used for content, with a single-column flow for simplicity and ease of navigation.
- **Desktop:** Content is centered with a max-width of 1280px. Sidebars for filters or navigation should occupy 3 columns, with the primary feed taking the remaining 9.
- **Lists & Tables:** Use the `md` (24px) spacing for row heights in data-heavy views to maintain breathing room between entries.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** rather than heavy shadows.

- **Level 0 (Background):** Pure White (#FFFFFF).
- **Level 1 (Cards/Surface):** Off-White (#F4F7F9) or white with a very soft 1px border (#E2E8F0).
- **Interactive Elevation:** High-priority cards use an ambient shadow (0px 4px 20px rgba(0,0,0,0.05)) upon hover to signal interactivity. 
- **Modals/Overlays:** Use a 40% opacity black backdrop blur to keep focus on the action while maintaining context of the background.

## Shapes

The design system adopts a **Rounded** shape language to create a friendly and accessible user experience.

- **Buttons:** Use `rounded-xl` (1.5rem / 24px) to create the signature pill-like look seen in the primary "Start searching" button.
- **Cards:** Use `rounded-lg` (1rem / 16px) for job listings and container modules.
- **Inputs:** Use `rounded-md` (0.5rem / 8px) for form fields to provide a slight visual distinction from primary action buttons.

## Components

### Buttons
- **Primary:** Carbon background (#212121) with White text. Bold weight. Pill-shaped.
- **Secondary:** Transparent background with Carbon border (1.5px) and text.
- **Ghost:** Primary Blue text with no background, used for "See all" or "Cancel" actions.

### Form Inputs
- **Default:** White background, 1px border (#E2E8F0), 8px corner radius.
- **Active/Focus:** 2px border using Primary Blue (#5D7BF3).
- **Error:** 1px border using Red (#EF4444) with small error text below the field in 12px weight.

### Data Tables & Lists
- **Rows:** Minimum height of 64px. Alternating row colors (Zebra striping) is avoided; instead, use 1px bottom borders.
- **Bulleted Lists:** Use Primary Blue for the bullet point itself. 16px indent.
- **Numbered Lists:** Use Bold Carbon text for numbers to emphasize sequence in "How to Apply" sections.

### Chips & Badges
- **Job Tags:** Small (12px), semi-bold text inside a soft gray (#F1F5F9) capsule with 4px horizontal padding.
- **Status Badges:** Subtle tinted backgrounds (e.g., light green for "Active") with high-contrast text of the same hue.

### Cards
- Job cards must include a logo slot (48x48px), a title (Headline-MD), and a metadata row (Label-SM) for location and salary. Entire card area is a hit target.