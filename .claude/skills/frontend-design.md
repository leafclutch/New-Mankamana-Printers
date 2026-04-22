---
name: Frontend design system
description: >
  UI/UX design system for a minimalist, high conversion ecommerce platform with
  a client facing portal and an admin dashboard. Trigger this skill whenever the
  user asks about visual design, layout, components, typography, color, spacing,
  UX patterns, consistency, interaction design, or any screen across either portal.
  Also trigger when the user says "how should this look", "design a screen",
  "make this consistent", "improve the UX", "Improve Frontend", or "what component should I use".
  This is the single source of design truth — always consult before designing
  or building any UI.
---

# PrintStore Design System
## Minimalist, Conversion Focused UI/UX

---

## Absolute Rules (No Exceptions)

These rules apply to every single page across both the client portal and the admin
dashboard, without exception.

**No emojis. Ever.** Emojis are not permitted anywhere in the UI — not in empty states,
not in success messages, not in navigation, not in onboarding, not in tooltips, not
in any text content anywhere. Use icons from the chosen icon library instead, or plain
text. This rule is permanent and unconditional.

**One token set. Two portals.** Every color, every font, every spacing value, every
border radius, every shadow, every animation duration — all defined once and shared
across both portals. No page in either portal invents its own values. Consistency is
not a goal; it is the baseline.

**Same visual language on every page.** A user switching between any two pages — whether
within one portal or across both — must feel that they are in the same product.
If a component, color, or typographic treatment appears on one page, it must appear
the same way on every page where it is used.

---

## Philosophy

Minimalism is not emptiness. Every element must earn its place by doing one of three
things: communicate information, guide the user toward an action, or confirm the system
is working. If it does none of these, remove it.

Aesthetics serve usability — never the reverse. When forced to choose, clarity wins.
A less beautiful component that works beats a beautiful one that confuses.

The client portal and admin dashboard share all design tokens. They differ only in
layout density, because their users have different goals. Both must feel like one product.

---

## Design Principles

**1. Hierarchy before decoration.**
Establish what the user reads first, second, third — through size, weight, and
spacing. Never through color or decoration alone. If you convert a screen to greyscale
and the hierarchy collapses, the design has failed.

**2. One primary action per screen.**
Every screen has exactly one dominant action. It is visually unmissable and spatially
positioned where the eye lands after reading. Secondary actions are present but quiet.
Destructive actions are never prominent.

**3. Consistency over creativity.**
Use the system. Invent a new pattern only when no existing one solves the problem.
Users who understand one screen should already understand the next.

**4. Progressive disclosure.**
Show only what the user needs for the current step. Reveal complexity as they move
forward. Never front load all options at once.

**5. System status is always visible.**
The user always knows what the system is doing: loading, saving, succeeded, failed.
No ambiguous states. No silent failures.

**6. Errors are instructions, not apologies.**
Every error message names what went wrong in plain language and tells the user what
to do next. Errors appear immediately, inline, next to the cause. Generic errors
are not acceptable.

**7. Empty states are designed.**
Every list, table, and feed has a designed empty state with a headline and a next
step. A blank screen is an unfinished screen.

**8. Density is intentional.**
The client portal is airy. The admin is denser. Both use the same tokens — the
difference is in application, not in system. Neither is wrong; they serve different users.

**9. Mobile is not a downgrade.**
The client portal is fully usable on mobile — not just functional. Every tap target
is at least 44 × 44px. Every critical flow is tested on a small screen first.

**10. Motion has a purpose.**
Every animation communicates a state change or provides spatial context. Animations
are fast (150 to 300ms), subtle, and triggered by user action or system event.
Nothing animates for decoration.

---

## Color

Use a minimal palette: one brand color, one accent, one neutral scale, four semantic
colors. This is enough. More colors create noise, not richness.

**Brand color:** Near black or deep neutral. Used for headings, primary buttons,
and the logo. Conveys confidence and restraint.

**Accent color:** One warm or cool color — pick it and commit. Used for primary CTAs,
active states, focus rings, and links. Appears on one element per screen.
Used on more than one element, it loses meaning.

**Neutral scale:** 9 to 10 steps from near white to near black. All backgrounds, borders,
secondary text, and disabled states come from here. Never invent an off system grey.

**Semantic colors:**
- Success: green — confirmed, completed, saved states
- Error: red — validation failures, destructive warnings
- Warning: amber — pending, at risk, approaching limits
- Info: blue — informational callouts, help text

**Rules:**
- Never use red for anything other than errors or destructive actions.
- The accent appears once per screen. Twice means neither instance is the priority.
- All text and background pairs pass WCAG AA (4.5:1 body, 3:1 large text).
- Disabled states use reduced opacity (40 to 50%), never a custom color.

---

## Typography

Two typefaces only. One for display, one for UI. More is noise.

**Display font:** Personality forward, used for large headings on the client portal
only. Choose something with a strong point of view — not Inter, not Roboto,
not system ui. The display font sells the brand.

**UI font:** Highly legible neutral sans serif. Used for all body copy, form labels,
table data, and the entire admin dashboard. The UI font disappears and lets
content speak.

**Scale:**

| Role         | Size     | Weight | Usage                                 |
|--------------|----------|--------|---------------------------------------|
| Display      | 48 64px  | 700    | Client portal hero only               |
| H1           | 36px     | 700    | Page titles                           |
| H2           | 28px     | 600    | Section headings                      |
| H3           | 22px     | 600    | Card titles, subsection headings      |
| H4           | 18px     | 600    | Form sections, modal titles           |
| Body Large   | 16px     | 400    | Primary body copy                     |
| Body Default | 14px     | 400    | All UI text, labels, table content    |
| Body Small   | 13px     | 400    | Metadata, timestamps, helper text     |
| Caption      | 12px     | 400    | Badges, column headers, tooltips      |

**Rules:**
- Never go below 12px.
- Use weight to create hierarchy before increasing size.
- Cap line width at 65 to 75 characters. Never let body text span the full viewport.
- Admin headings use the UI font, not the display font. Clarity over personality.

---

## Spacing

Every value is a multiple of 4px. No exceptions. Consistent spacing is what separates
a crafted interface from an assembled one.

| Value | Token | Usage                                           |
|-------|-------|-------------------------------------------------|
| 4px   | xs    | Icon padding, tight inline gaps                 |
| 8px   | sm    | Between label and input, icon and text          |
| 16px  | md    | Standard component padding, form row gaps       |
| 24px  | lg    | Card padding, section dividers                  |
| 32px  | xl    | Between sections within a content area          |
| 48px  | 2xl   | Major section breaks                            |
| 64px  | 3xl   | Large section breaks, client portal sections    |
| 96px  | 4xl   | Hero vertical padding                           |

**Layout rules:**
- Client portal: max content width 1280px, centered, 24px mobile padding.
- Admin: full width, fixed left sidebar (240px), collapsible to 64px icon only.
- Card padding: 24px client, 20px admin. Same token, adjusted for density.

---

## Components

### Buttons

**Variants:** Primary (filled accent), Secondary (outlined), Ghost (no border),
Danger (filled error color — only after confirmation), Icon only.

**Sizes:** Large 48px (client CTAs), Default 40px (standard), Small 32px (table actions).

**States — every button must have all of these:**
- Hover: slightly darker, cursor pointer
- Focus: 2px accent ring, offset 2px — always visible, never hidden
- Active: visibly pressed, darker than hover
- Loading: spinner replaces label, same size, interaction disabled
- Disabled: 50% opacity, cursor not allowed

**Rules:**
- One primary button per screen.
- Labels are always verbs: "Save", "Delete", "Export". Never "OK" or "Submit".
- Loading state prevents double submission.
- Minimum touch target: 44 × 44px.

---

### Form Inputs

**Anatomy:** Label above (never only a placeholder), input, helper or error text below.

**States:** Default, Focus (accent border and shadow), Filled, Error (red border and message
below), Disabled (muted background, not allowed cursor), Read only.

**Rules:**
- Placeholder text shows format examples, not the label repeated.
- Validate on blur, not on keystroke. Exception: real time strength indicators.
- Error messages are specific. Not "Invalid." Instead: exactly what is wrong and how to fix it.
- Required fields: asterisk (*) next to label. Optional fields: "(optional)" label.
- Group related fields visually. Never mix unrelated fields in the same row.

---

### Cards

**States:** Default, Hover (elevation shadow and 2 to 4px upward translate — only if clickable).

**Rules:**
- Border radius: 8px everywhere, always.
- Border OR shadow, never both.
- Internal padding: 24px client, 20px admin.
- Clearly distinguish clickable from static cards. Static cards have no hover state.

---

### Tables (Admin Critical)

**Anatomy:** Sticky column headers (Caption, uppercase, secondary color), rows (Body Default,
48px height), status badges, row hover reveal for actions.

**Rules:**
- Numeric columns are right aligned. All others left aligned.
- Sorting: click column header, show directional arrow.
- Filters: above the table, not inline with headers. Show active filter count as a badge.
- Bulk actions: appear above the table when rows are checked.
- Pagination always shows total count: "Showing 1 to 25 of 143."
- No infinite scroll in admin tables — users need positional awareness.
- Status badges use semantic color pairs (background and text), never text only.

---

### Modals

**Sizes:** Small 400px (confirmations), Medium 560px (short forms), Large 720px (detail views),
Full drawer (complex edits — slides from right).

**Rules:**
- Footer: primary action right, cancel left.
- Backdrop click closes — unless the user has unsaved input (show discard confirmation).
- Escape key always closes.
- No stacked modals.
- Destructive confirmations name what will be destroyed, not just "Are you sure?"

---

### Navigation

**Client portal (top navbar):**
- Logo left, primary nav center (max 5 items), utilities right (search, cart, account).
- Sticky on scroll — gains subtle shadow.
- Active item: accent underline.
- Mobile: full screen overlay with large tap targets.

**Admin (left sidebar):**
- Fixed, 240px. Collapsible to 64px icon only.
- Nav items grouped with section labels.
- Active item: 10% accent background, accent text, left accent border.
- User account and logout pinned to the bottom.

---

## Interaction and Micro UX

**Loading:**
- Skeleton screens for any content that takes over 300ms. Never a blank area.
- Spinners only inside buttons or for brief inline actions.
- Progress bars only for measurable processes.

**Empty states:**
Always include: a relevant icon, a plain language headline, and one call to action
when applicable. Never a blank screen.

**Success feedback:**
- Toast notification (top right, 4 second auto dismiss) for action confirmations.
- Inline button checkmark (500ms) for save actions.
- Dedicated confirmation screen only for the highest stakes moments.

**Animations:**

| Interaction        | Type                      | Duration |
|--------------------|---------------------------|----------|
| Button hover       | Color shift               | 150ms    |
| Modal open         | Fade and scale 95 to 100% | 200ms    |
| Modal close        | Fade out                  | 150ms    |
| Drawer open        | Slide from right          | 250ms    |
| Toast appear       | Slide from top right      | 200ms    |
| Skeleton to content| Fade in                   | 200ms    |
| Accordion expand   | Height transition         | 200ms    |
| Table row hover    | Background color shift    | 100ms    |

All use ease out for entrances and ease in for exits. No bounce, no spring.

---

## Dos and Don'ts

**Minimalism:**
- NO: Removing labels in the name of clean design. Placeholders disappear.
- NO: Icon only navigation. Icons are not universal.
- NO: Skipping empty and loading states. Minimalism is not an excuse.
- NO: Low contrast text in the name of subtlety.
- YES: Whitespace directs attention — use it actively, not as a filler.

**Admin dashboards:**
- NO: Making it pretty at the cost of data density. Admins want speed.
- NO: Hiding the most common action behind multiple clicks.
- NO: Tables without sortable columns or meaningful filtering.
- NO: Status labels without visual differentiation (color, icon).
- YES: Optimise for the action done 50 times a day, not 5 times a month.

**Conversion (client portal):**
- NO: Hiding pricing until late in the flow.
- NO: Ambiguous CTAs — "Submit", "Proceed", "Next" instead of action specific labels.
- NO: Errors that only appear after full form submission.
- NO: No visual feedback after a user action.
- YES: The next step must be obvious without instruction.
- YES: Every error is inline, specific, and recoverable.

**Emojis and decoration:**
- NO: Emojis anywhere — not in messages, not in empty states, not in navigation, nowhere.
- NO: Decorative illustrations that do not communicate anything.
- NO: Gradient backgrounds, drop shadows on text, or any visual treatment not in the token set.
- YES: Use the designated icon library for all visual indicators.
- YES: Plain, direct language for all system messages.

---

## Pre Ship Checklist

**Hierarchy**
- [ ] Can you identify the primary element on this screen within 3 seconds?
- [ ] Does hierarchy survive greyscale conversion?
- [ ] Is there exactly one primary action?

**Consistency**
- [ ] All colors from tokens, no hard coded values?
- [ ] All spacing on the 4px grid?
- [ ] All font sizes from the type scale?
- [ ] Interactive elements consistent with every other screen?
- [ ] Same font family used as every other page in this portal?
- [ ] Same border radius, shadow, and color values as every other page?

**No Emojis**
- [ ] Zero emojis present anywhere on this screen?
- [ ] Empty states use an icon from the icon library, not an emoji?
- [ ] Success and error messages use plain text or icons, not emojis?
- [ ] Navigation items contain no emojis?

**Usability**
- [ ] Is the next step obvious without any instruction?
- [ ] Are all fields labeled above (not only as placeholders)?
- [ ] Are all errors inline, specific, and paired with a recovery action?
- [ ] Are all icons labeled (visible or accessible)?
- [ ] Are all tap targets at least 44 × 44px?

**States**
- [ ] Every interactive component has hover, focus, active, disabled, and loading states?
- [ ] Every list and table has a designed empty state?
- [ ] Every data fetched section has a loading state?

**Accessibility**
- [ ] All text passes WCAG AA contrast?
- [ ] Focus ring is visible and consistent?
- [ ] Primary flow is completable by keyboard alone?

**Cross System**
- [ ] Shared token set used across both portals?
- [ ] New components added to the shared library?
- [ ] This screen feels like the same product as every other screen?