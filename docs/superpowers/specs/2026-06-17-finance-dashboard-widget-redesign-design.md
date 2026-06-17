# Finance Dashboard Widget Redesign

Date: 2026-06-17

## Scope

Redesign the widget area of `/finance/dashboard` so it matches the provided executive finance dashboard reference as closely as possible while keeping the existing SFXSAI finance shell intact.

This spec applies only to the finance dashboard widget surface inside the current Angular app. It does not change the finance sidebar, topbar, purple banner, routing, or registrar dashboard widgets.

## Approved Decisions

- The redesign applies only to `/finance/dashboard`.
- The current SFXSAI sidebar, topbar, and purple finance banner remain unchanged.
- The target is an as-close-as-possible match to the supplied reference image in structure, spacing, hierarchy, and visual density.
- The redesign is frontend-only.
- No backend schema or API changes are part of this work.
- No unsupported business logic may be invented to imitate the screenshot.
- Due dates must not be introduced.
- Accounts receivable aging buckets based on due dates or overdue windows must not be shown.

## Target Layout

Replace the current finance widget grid with a two-row dashboard composition that mirrors the reference:

### Row 1

1. `Total Revenue`
2. `Total Assessed`
3. `Accounts Receivable & Collection Status` as one large composite card

### Row 2

1. `Financial Alerts / Reminders`
2. `Trends & Forecasts`
3. `Upcoming Learner Birthdays`

The card widths and heights should visibly match the reference layout rather than the current equal-weight grid.

## Visual Requirements

The redesign should match the reference in:

- card proportions
- white card surfaces
- soft shadows
- subtle gray borders
- compact internal spacing
- dense but readable information layout
- icon tile placement in upper-right card corners
- strong numeric emphasis for primary metrics
- smaller helper copy below primary metrics
- embedded micro-visuals, badges, and CTA rows

The result should read like a polished finance command dashboard rather than generic stat tiles.

## Widget Definitions

### Total Revenue

This card keeps the existing revenue value and academic-year helper text, but the presentation changes to match the reference:

- uppercase card label
- upper-right icon tile
- large peso amount
- small supporting text
- lower visual support area resembling the reference composition

No sample values may be hardcoded.

### Total Assessed

This card keeps the current assessed total and academic-year helper text, and adds a denser supporting detail area:

- uppercase card label
- upper-right icon tile
- large peso amount
- assessment count helper
- supporting description aligned with the reference style

Only current live finance data may be used.

### Accounts Receivable & Collection Status

This becomes the primary composite widget.

It must show:

- `AR` heading
- total accounts receivable amount
- count of learner accounts with open balance
- collection-rate donut
- collected total
- pending total
- total open balance
- learner avatar or initial strip for open-balance learners
- `Review Open Accounts` CTA
- bottom summary row styled like the reference

It must not show:

- due dates
- overdue labels
- aging buckets based on fabricated rules
- unsupported payable or expense data

The card should preserve the visual richness of the reference even though aging bands are intentionally omitted.

### Financial Alerts / Reminders

This widget becomes a stacked action list rather than the current simple alert chips.

Each alert row should support:

- colored surface by tone
- left status icon or badge
- primary action title
- secondary helper text
- learner avatar or initials when relevant
- right-side CTA button

Allowed CTA behaviors:

- `Review Accounts` opens an existing finance review surface
- `View Records` opens an existing finance detail surface

The UI may resemble reminder actions from the reference, but it must not pretend to send messages or reminders if that workflow does not exist yet.

### Trends & Forecasts

This card should visually match the reference-style forecast card:

- uppercase widget title
- primary projected peso amount
- supporting forecast label
- compact comparison badge
- line-chart-like visual based on actual payment history points

The trend chart must use current payment history data from the existing frontend model. Placeholder bars should be removed from this card.

### Upcoming Learner Birthdays

This widget should show a denser list structure similar to the reference:

- circular or pill-style date badge
- learner avatar or initial
- learner name
- grade level
- countdown in days
- right-side CTA button

Because there is no greeting workflow in the current finance portal, the action button should route to an existing learner finance surface instead of faking message delivery.

## Data Mapping Rules

The redesign must stay within the current frontend data model.

Use:

- payments for `Total Revenue`
- assessments for `Total Assessed`
- assessment balances for `Accounts Receivable`
- assessed open-balance learner counts for collection status and AR summaries
- current payment history points for `Trends & Forecasts`
- current learner birthdays for `Upcoming Learner Birthdays`

Do not introduce:

- due-date calculations
- overdue math
- receivable aging windows
- expense summaries
- accounts payable
- budget-vs-actual values

## Code Boundary

Implementation should stay narrowly scoped to the finance dashboard surface.

Primary files:

- `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.html`
- `sms-angular-dashboard-starter/src/app/pages/dashboard/dashboard.component.scss`
- `sms-angular-dashboard-starter/src/app/pages/dashboard/finance-dashboard.util.ts`

Tests should be added or updated only where needed to lock:

- widget labels
- card structure
- absence of due-date/aging text
- presence of birthday and alert surfaces
- finance-only dashboard behavior

No unrelated registrar or teacher UI work is included.

## Error Handling

If finance data is sparse:

- cards must still render with stable layout
- empty states should remain styled, not collapse the card
- missing unsupported values must not display fake figures

If the backend returns no payments or no assessments:

- trend and summary cards should degrade gracefully
- the dashboard must still look complete and intentional

## Testing Strategy

Use test-first updates for utility or template-level behavior that can be locked with focused specs.

Required verification:

- finance dashboard template still excludes previously removed widgets such as expenses, accounts payable, budget-vs-actual, and cash flow
- redesigned widget titles render correctly
- no due-date or overdue aging labels appear
- birthday widget still renders finance learner birthdays
- build passes after the dashboard restructure
- live browser verification confirms `/finance/dashboard` uses the new two-row composition and retains the existing shell

## Implementation Boundary

This redesign intentionally excludes:

- sidebar/topbar/banner redesign
- backend aggregation changes
- new notification workflows
- greeting or reminder sending
- expense/accounting modules
- finance aging logic
- registrar dashboard widget redesign
