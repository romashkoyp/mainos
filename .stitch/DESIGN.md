---
name: Mainos
colors:
  surface: '#ffffff'
  surface-dim: '#f8f9fa'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f9fa'
  surface-container: '#f8f9fa'
  surface-container-high: '#e9ecef'
  surface-container-highest: '#dee2e6'
  on-surface: '#333333'
  on-surface-variant: '#495057'
  outline: '#ccc'
  outline-variant: '#dee2e6'
  primary: '#007bff'
  on-primary: '#ffffff'
  secondary: '#6c757d'
  on-secondary: '#ffffff'
  success: '#28a745'
  on-success: '#ffffff'
  warning: '#ffc107'
  on-warning: '#212529'
  info: '#17a2b8'
  on-info: '#ffffff'
  error: '#dc3545'
  on-error: '#ffffff'
  background: '#ffffff'
  on-background: '#212529'
typography:
  headline-md:
    fontFamily: Arial, sans-serif
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  body-base:
    fontFamily: Arial, sans-serif
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  body-bold:
    fontFamily: Arial, sans-serif
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 18px
  label-caps:
    fontFamily: Arial, sans-serif
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 3px
  DEFAULT: 4px
  md: 8px
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 15px
  xl: 16px
  gutter: 8px
---

## Brand & Style

The brand personality of **Mainos** is utility-driven, practical, and highly functional. Designed as a geographic information system (GIS) for managing and reporting physical advertisement installations (billboards and posters), the interface prioritizes immediate operational status, high visual contrast, and high density. 

The visual layout centers around a fullscreen interactive map (Leaflet) upon which compact controls and statistics float. The styling does not use complex decorative patterns, gradients, or glassmorphism. Instead, it relies on a clean, solid card structure with subtle outlines and default colors, evoking a reliable dispatch console or diagnostics tool. 

## Colors

The interface uses a simple white background (`#ffffff`) for control panels and modals, paired with light gray surfaces (`#f8f9fa`) for grouped settings, ensuring high readability under direct outdoor sunlight where field workers operate.

Standard colors from general-purpose UI patterns define status and roles:
- **Primary / Actions**: `#007bff` (Standard Blue) triggers primary behaviors like data export.
- **Success / Visited**: `#28a745` (Standard Green) indicates completed installations and progress tracking.
- **Warning / Load**: `#ffc107` with dark text `#212529` (Standard Yellow) guides users to load campaign coordinates and open report wizards.
- **Info**: `#17a2b8` (Teal) triggers geographic lookup functions.
- **Secondary / Muted**: `#6c757d` (Neutral Gray) is utilized for secondary settings, panel collapse elements, and subtext labels.

### Map Markers & Icons
Map markers use a custom SVG teardrop pin with black strokes, embedding white geometric symbol cutouts to convey billboard type:
- **Base / Unvisited Locations**: `#7B7B7B` (Slate Grey)
- **Visited / Completed Locations**: `#2AAD27` (Bright Green)
- **Active Campaign Locations**: Selected from a 20-color rotation palette (e.g. `#CB2B3E` Red, `#2A81CB` Blue, `#CB8427` Orange) to distinguish multiple overlapping campaigns on the same map.

## Typography

The typography system relies on **Arial** or standard system sans-serif fonts to ensure speed, accessibility, and uniform rendering across different devices without requiring external web font downloads.

Text sizes are kept small (`10px` to `14px`) to preserve precious map real estate and fit long billboard names inside panels. Headlines are bolded for quick visual scanning, while utility labels and campaign IDs are set in muted, smaller text.

## Layout & Spacing

A compact, absolute positioning layout maximizes the visible map canvas. Spacing values are tightly controlled, relying on minor increments (`4px` for tight elements, `8px` for inputs/grouping, and `15px` for outer container pads).

Buttons are aligned in a 4-column grid inside the floating overlay, while form fields and statistics utilize flex rows and grids that wrap automatically. Touch targets are scaled slightly larger on mobile viewports to prevent misclicks in the field.

## Elevation & Depth

Visual hierarchy is simple, flat, and flat-shaded:
1. **Base Layer**: The Leaflet interactive map (highest depth).
2. **Overlay Layer**: The floating control panel container using a subtle shadow (`0 2px 10px rgba(0, 0, 0, 0.1)`) and solid white background to float cleanly above the map tiles.
3. **Modal Layer**: The full-screen report wizard uses a dark translucent overlay (`rgba(0, 0, 0, 0.6)`) with a light backdrop blur filter (`2px`) to draw direct focus, displaying a card with a shadow (`0 4px 20px rgba(0, 0, 0, 0.3)`).

## Shapes

Shapes follow standard, modern web conventions:
- Normal buttons, list items, and form inputs utilize `rounded-sm` (`4px`) or `3px` corners.
- Major outer wrappers like the control panel container and modal popups employ `rounded-md` (`8px`) corners to soften the high-density layout.

## Components

### Floating Control Panel
An absolute-positioned card overlay (`bottom: 10px; left: 10px` on desktop) that includes a collapsible header, a horizontal progress bar, compact stat readouts, a dropdown filter, a list of active campaigns, map toggles, and utility buttons.

### Buttons
Medium-height, colored buttons containing FontAwesome icon symbols alongside small labels. They align in a compact grid structure and feature slight opacity adjustments (`opacity: 0.9` or darker backgrounds) on hover.

### Form Inputs & Textareas
Form fields utilize a standard thin border (`1px solid #ced4da`) and white backgrounds. Upon selection, they transition to highlight active focus with a blue outline and a transparent glow (`box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1)`).

### Map Marker Icons
Dynamic SVGs wrapped in a Leaflet `divIcon`. Inside a standard pin outline, they host white icon markers:
- **Maxi**: A large white circle.
- **Classic Keski**: A vertical white rectangle.
- **Classic Single**: A small white circle.
- **Classic Tupla**: A double white circle side-by-side.
