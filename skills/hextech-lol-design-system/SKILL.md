---
name: hextech-lol-design-system
description: Hextech League of Legends Design System guide covering colors, typography, bevels, polygon clip-paths, buttons, inputs, and team styling.
---

# Hextech League of Legends Design System

This design system defines the visual identity, typography, color palette, and component patterns inspired by League of Legends (LoL) Hextech architecture across Version 1 and Version 2 of the application.

---

## 1. Core Color Palette

### Base & Backgrounds

- **Dark Void Canvas**: `#010b11` / `#030f16`
- **Card Container**: `#061821` (with high-contrast metallic borders)
- **Input Background**: `rgba(1, 7, 11, 0.8)` (`#01070b`)

### Gold Accent Variables

- **Standard Gold (`--gold`)**: `#e3ad4b`
- **Bright Gold (`--gold-bright`)**: `#ffd060`
- **Deep Gold (`--gold-deep`)**: `#936823`

### Hextech Magic & Neon

- **Hextech Teal (`--hextech`)**: `#00bac5`
- **Hextech Glow (`--hextech-glow`)**: `#00dfe1`

### Team Side Colors (Blue & Red Sides)

- **Blue Team (`--team-alpha` / `Blue team`)**:
  - Border: `#009cec` / `rgba(0, 156, 236, 0.5)`
  - Background: `#001828` / `rgba(0, 28, 40, 0.85)`
  - Text: `#7dd3fc` / `#38bdf8`
- **Red Team (`--team-beta` / `Red team`)**:
  - Border: `#e64343` / `rgba(230, 67, 67, 0.5)`
  - Background: `#28080c` / `rgba(40, 8, 12, 0.85)`
  - Text: `#fca5a5` / `#f87171`

---

## 2. Typography

- **Display Headings**: `"Cinzel", "Marcellus", serif` (`font-display`)
  - Uppercase styling (`uppercase`)
  - Letter spacing (`tracking-wider` or `tracking-[0.15em]`)
- **Body & Text**: `"Spectral", serif` (`font-serif`)
- **Monospace Metrics**: Font-mono for numerical Power scores.

---

## 3. Hex Cut Corners & Bevel Styles (`btn-hex`, `hextech-frame`)

Hextech UI utilizes 45-degree chamfered/cut corners using CSS polygon clip paths:

```css
clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
```

### Frame & Corner Accents (`hextech-frame`)

- Metallic dark gradient background (`linear-gradient(180deg, #061821, #010f18)`)
- Golden corner brackets constructed via `::before` and `::after` pseudo-elements.

---

## 4. Reusable Hex Component Patterns

### Hex Primary Button (`PrimaryButton` / `btn-hex-primary`)

- Metallic gold gradient (`linear-gradient(180deg, #754b00, #442600)`)
- Bright gold border (`#ffd060`)
- Hover glow (`box-shadow: 0 0 28px rgba(242, 167, 0, 0.6)`)

### Hex Input (`input-hex`)

- Dark sunken container (`#01070b`)
- Golden focus border & ring glow.

### Hex Summoner Card Items

- Chamfered clip-path or metallic border frames.
- Strict Blue team vs. Red team color coding without icon bloat.
