# Starter values

A sensible starting set for an app that has no design values yet. Adjust them to the app, then keep to them. When the app already uses values, start from the ones it uses most instead (see `measure.py`), so the result still looks like that app.

## Text

| Name | Size | Use |
|---|---|---|
| caption | 11 | hints, counts, shortcut labels, section labels |
| body | 13 | labels, fields, menus, list rows |
| title | 15 | panel and dialog titles |
| display | 20+ | rare: empty states, the app name |

Weights: regular and semibold. Bundle the font. A neutral sans such as Inter, which is open licensed, works for most apps.

## Spacing

Use multiples of 4: 4, 8, 12, 16, 24, 32. Inside a control, use 8 across and 4–6 down. Between controls in a panel, use 8. Between sections, use 16–24.

## Sizes

- Control height: 28–32 (compact desktop), and the same for fields, dropdowns and buttons.
- Icon sizes: 16 in panels and menus, 20 in toolbars.
- Corner roundings: 4 for small controls, 8 for cards, menus and dialogs, and fully round for pills.

## Colours, by role

| Role | Example | Use |
|---|---|---|
| ink | `#1F2430` | main text |
| muted | `#6B7385` | secondary text, captions |
| border | `#D9DCE3` | field and panel edges, dividers |
| surface | `#FFFFFF` | panels, fields |
| canvas | `#F4F5F8` | the backdrop behind panels |
| accent | one brand colour | selection, primary actions, focus |
| accent-soft | the accent at 10–15% | selected rows, hover on accented controls |
| danger | `#C62828` | destructive actions, errors |

Use one accent. Use one danger red. Neutrals come from one family, so their tint (bluish or warm) matches.

## Motion

Choose one: **instant** (no animation), or **short** (one duration of 120 ms for fades). Record which in `docs/DESIGN.md`.
