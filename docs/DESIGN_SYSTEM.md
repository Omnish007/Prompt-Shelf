# PromptShelf visual system and performance notes

## Design goals

PromptShelf uses the same semantic component contract in both themes. Components consume role-based tokens such as `background`, `foreground`, `card`, `primary`, `muted`, `border`, `input`, `ring`, `success`, `warning`, and `destructive`; components should not hard-code theme-specific colors. This follows shadcn's semantic token model, where a surface token and its foreground token are chosen as a pair rather than independently: https://ui.shadcn.com/docs/theming.

## Color rationale

- **Brand / primary:** a violet-blue hue (approximately 278°) brings a focused, creative feel appropriate for an AI prompt workspace. The light theme uses a deeper, higher-chroma brand color; the dark theme uses a lighter lavender-violet so the brand remains visible without looking like a glowing neon panel.
- **Surfaces:** cool, low-chroma neutrals around the violet-blue hue keep the interface calm and let content and states carry attention. Light mode is not pure white everywhere: slight separation between canvas, cards, inputs, and borders creates hierarchy without heavy shadows. Dark mode uses multiple elevated neutral levels instead of simply inverting the light palette.
- **State colors:** teal communicates success, amber communicates caution, and red communicates destructive/error states. These meanings remain consistent between modes, but each mode has its own lightness/chroma ramp to protect contrast. Do not communicate status through color alone; pair it with text, iconography, or another cue.
- **Color-space choice:** OKLCH makes lightness and chroma explicit and makes it easier to tune a perceptually similar color for separate light and dark palettes. Hue is a starting point, not an accessibility guarantee; every foreground/background pairing still needs a contrast check.

## Contrast guard rails

The WCAG 2.2 minimum contrast ratio is 4.5:1 for ordinary text and 3:1 for large text; non-text controls and visual indicators have their own 3:1 requirements when needed for identifying them. Reference: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html and https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html.

Run `npm run theme:contrast` to check the palette pairs encoded in `src/styles/tokens.css`. The current script checks representative semantic combinations, including normal text, muted text, text on controls, input boundaries, and focus rings. It does **not** certify every UI state or every combination produced by arbitrary utility classes, opacity modifiers, overlays, or browser rendering. Keep keyboard focus clearly visible and verify the rendered app after changing tokens.

Latest local token check:

| Combination                |   Light |    Dark | Guard rail |
| -------------------------- | ------: | ------: | ---------: |
| Body text / canvas         | 16.60:1 | 16.61:1 |      4.5:1 |
| Muted text / canvas        |  7.78:1 |  7.98:1 |      4.5:1 |
| Primary control text       |  7.12:1 |  7.61:1 |      4.5:1 |
| Success status text        |  8.10:1 |  7.63:1 |      4.5:1 |
| Quality “good” label       |  7.45:1 |  6.91:1 |      4.5:1 |
| Quality “needs work” label |  6.38:1 |  6.75:1 |      4.5:1 |
| Input boundary / canvas    |  3.49:1 |  3.30:1 |        3:1 |
| Focus ring / canvas        |  5.30:1 |  7.76:1 |        3:1 |

These are calculations from the configured OKLCH tokens, not an automated audit of all rendered component states.

## Performance decisions

- Keep React hooks unconditional across loading and loaded states. Early returns belong after all hooks so the first load cannot change hook order.
- Avoid global `transition: all`; animate only interactive controls and only the properties that benefit from motion. Honor `prefers-reduced-motion`.
- Keep the editor draft local while the user types and debounce durable library commits. Explicit save, component cleanup, navigation cleanup, and the desktop close handshake trigger a final commit.
- Reuse the prompt search index while the candidate set stays the same, and apply `content-visibility` to off-screen prompt rows so a long library costs less layout/paint work.
- Measure interaction latency against realistic prompt counts before claiming numeric performance improvements. General guidance: https://web.dev/articles/optimize-inp.

## Component-system usage

The app reuses the installed shadcn primitives where their semantics fit: Dialog for modal focus management, AlertDialog for destructive confirmations, Button for primary actions, Card for prompt rows, Input and Select for filtering and choice controls, ScrollArea for the prompt library, Progress for prompt-quality feedback, Skeleton for the first-load state, Badge for variable metadata, Switch for boolean settings, Tooltip for context, and Sonner for notifications. Components such as OTP input, calendar, carousel, and chart are not forced into the product where there is no matching interaction.

## Modular boundaries

Application-owned feature components, style modules, store helpers, and seed-catalogue chunks are separated by responsibility. Keep these modules near or below 250 lines and under 300 lines wherever practical; the existing shadcn primitive files are upstream component implementations and should be updated through the component generator rather than manually chopped apart.

## Accessibility references and application checks

The implementation uses semantic color roles rather than binding meaning to a particular hue. Independent light and dark values preserve the same roles across themes; container/surface distinctions are deliberately restrained so interactive elements and primary actions remain easy to locate. This is consistent with Material's guidance to use role-based tokens, create separate light/dark schemes, and avoid relying on hue alone: https://developer.android.com/design/ui/mobile/guides/styles/color.

Reference the normative WCAG 2.2 success criteria and their explanatory guidance when changing these tokens:

- Text contrast (SC 1.4.3): https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Non-text contrast for meaningful controls and state indicators (SC 1.4.11): https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast
- Keyboard focus visibility (SC 2.4.7): https://www.w3.org/WAI/WCAG22/Understanding/focus-visible
- Minimum target size (SC 2.5.8): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum

`npm run theme:contrast` validates representative semantic token pairs. It is a useful regression guard, not proof of WCAG conformance: the rendered interface still requires keyboard, zoom/reflow, theme-state, and assistive-technology checks.
