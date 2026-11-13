# Starter values

This is a reasonable starting set for an app that has no design values yet. Adjust them to the app, then keep to them. When the app already uses values, start instead from the ones it uses most, which `measure.py` finds, so the result still looks like that app.

## Text

| Name | Size | Use |
|---|---|---|
| caption | 11 | hints, counts, shortcut labels, section labels |
| body | 13 | labels, fields, menus, list rows |
| title | 15 | panel and dialog titles |
| display | 20+ | rarely, for empty states and the app name |

Use two weights, regular and semibold. Bundle the font. A neutral sans with an open licence, such as Inter, works for most apps.

## Spacing

Use multiples of 4: 4, 8, 12, 16, 24, 32. Inside a control, use 8 across and 4 to 6 down. Between controls in a panel, use 8. Between sections, use 16 to 24.

## Sizes

- Make controls 28 to 32 high for a compact desktop app, and give fields, dropdowns and buttons the same height.
- Use icons of 16 in panels and menus, and 20 in toolbars.
- Round corners by 4 on small controls and by 8 on cards, menus and dialogs, and make pills fully round.

## Colours, by role

| Role | Example | Use |
|---|---|---|
| ink | `#1F2430` | main text |
| muted | `#6B7385` | secondary text, captions |
| border | `#D9DCE3` | field and panel edges, dividers |
| surface | `#FFFFFF` | panels, fields |
| canvas | `#F4F5F8` | the backdrop behind panels |
| accent | one brand colour | selection, primary actions, focus |
| accent-soft | the accent at 10 to 15% | selected rows, hover on accented controls |
| danger | `#C62828` | destructive actions, errors |

Use one accent. Use one danger red. Take the neutrals from one family, so they share one tint, either bluish or warm.

## Motion

Choose one. **Instant** means no animation. **Short** means fades with one duration of 120 ms. Record the choice in `docs/DESIGN.md`.
