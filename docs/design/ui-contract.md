# LureLog interface contract

Uses the repository skill in `.agents/skills/frontend-ui-engineering/SKILL.md` (supplied by the project owner).

## Reference observations

Studied the AllTrails home, activity, and profile screens in the [Banani reference catalogue](https://www.banani.co/references/apps/alltrails):

- [Home](https://www.banani.co/references/screens/alltrails-home): search and filters precede content; clear metadata accompanies images. Use the scanning hierarchy for lure discovery, without copying its layout or branding.
- [Activity](https://www.banani.co/references/screens/alltrails-activity): one dominant subject, secondary detail grouped beneath it. Apply this to catch/lure detail pages, without adding unsupported maps or tracking.
- [Profile](https://www.banani.co/references/screens/alltrails-profile): identity and a small number of meaningful totals are easy to find. Apply identity-first navigation and concise summaries using real user data.

No reference images, branded copy, proprietary assets, or exact layouts are included in the product. Other reference pages were inaccessible; implementation decisions use these three screens and LureLog's existing workflows. The supplied skill's relative accessibility-checklist file was not supplied; its embedded checklist and automated accessibility checks are used instead.

## Visual language

A practical fishing field journal: forest ink, warm paper, restrained teal, readable sans-serif typography, technical mono captions, strong editorial headings. Flat surfaces and fine borders establish grouping; avoid decorative banners, multiple gradients, tiny captions, excessive shadows, and interchangeable marketing cards. Four-pixel spacing scale; 6/8/12px corner hierarchy; controls at least 44px tall. Keep light and dark modes legible with semantic tokens.

## Screen jobs and actions

| Screen     | Job                                               | Primary action                  | Structure                                                              |
| ---------- | ------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| Landing    | Explain the connection between tackle and catches | Create account / open workspace | Editorial intro, honest product illustration, three workflow sections  |
| Dashboard  | Understand fishing activity                       | Log catch                       | Real totals, activity chart, recent journal, ranked lures              |
| Collection | Find the right lure quickly                       | Add lure                        | Search/filter toolbar, image-led inventory, catch count and log action |
| Journal    | Find a fishing memory                             | Log catch                       | Date/species/lure controls, gallery/list, visible lure links           |
| Detail     | Review one lure or catch                          | Log catch / edit                | Dominant image, specification list, notes and related history          |
| Forms      | Save an accurate record                           | Save record                     | Numbered sections, persistent field labels, separate photo area        |
| Profile    | Manage identity and security                      | Save profile                    | Identity header, avatar, profile and password sections                 |

## Session-aware navigation

While loading a session, reserve navigation space without showing sign-in/register links. Signed-out visitors see sign in and registration. Signed-in visitors see their real name/avatar linked to `/profile` and a workspace link. All landing-page CTAs also use the session state. Session errors provide retry rather than implying the visitor is signed out.

## Responsive rules

Verify 320, 768, 1024, and 1440px. Small screens use a keyboard-accessible modal navigation drawer and bottom navigation; filters wrap; cards and forms become one column; headings and action rows wrap without overflow. Desktop uses a stable sidebar and compact utility header. No essential metadata is hover-only.

## States and finish gate

Preserve real API persistence and ownership enforcement. Keep loading skeletons, empty/search-empty, recoverable errors, validation, success toasts, deletion confirmation, and permission errors. Verify session navigation for guest/loading/error/user; keyboard operation of menus, forms, and lure picker; reduced motion; heading order; contrast; axe structural checks; existing regression tests; lint, typecheck, and production build. No synthetic statistics or nonfunctional buttons.

## Daily catch activity

Keep the existing overview chart and semantic theme tokens. The primary action is Explore month: choose any month, view daily counts with zero days included, and navigate to adjacent months or back to the monthly overview. Offer the same drill-down through month names in the monthly data table. Keep UTC date boundaries consistent between monthly and daily statistics. Exact counts must be accessible in a labeled table, with explicit loading, retry, and empty-month states. Month navigation must fit mobile widths without horizontal scrolling. Fetch one user-owned month at a time and invalidate with the dashboard stats cache after catch mutations.
