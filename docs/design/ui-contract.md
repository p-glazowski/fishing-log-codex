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

Keep the existing overview chart and semantic theme tokens. The primary action is Explore month: open the current month, view daily counts with zero days included, and navigate to adjacent months or back to the monthly overview. Offer the same drill-down through month names in the monthly data table. Keep browser-local date boundaries consistent between monthly and daily statistics; pass the same IANA time zone to both endpoints. Exact counts must be accessible in a labeled table, with explicit loading, retry, and empty-month states. Center the month label between previous/next arrows, with no month picker on either view. Month navigation must fit mobile widths without horizontal scrolling. Fetch one user-owned month at a time and invalidate with the dashboard stats cache after catch mutations.

## English and Polish

Offer a persistent, device-local English/Polish preference in Account settings and on public authentication screens and the landing footer. Switching must update UI text and document language without remounting forms or discarding typed values. Preserve LureLog branding, user-entered names/notes, and stable API enum values. Localize date/number presentation, Polish plural forms, labels, status messages, validation, and destructive-action dialogs. Keep controls accessible with translated names and ensure longer Polish copy fits at 320, 768, 1024, and 1440px.

## Journal lure filter

Keep individual-lure filtering with All lures as the default. Use a searchable combobox with case-insensitive brand grouping; each option exposes model, length in mm, and optional color, while keeping the lure ID as the filter value. Fetch search results from the API in pages rather than limiting the collection to 100 records. Resolve URL-preselected lures independently of result pages. Preserve accessible keyboard selection, Escape/blur dismissal, retry/empty/loading states, and English/Polish labels. Changing or clearing the lure resets catch pagination.

## Catch photo positioning

Retain edge-to-edge cover previews. Offer an optional inline crop-position editor for catch photos, with pointer dragging, accessible horizontal/vertical range inputs, a center reset, and wide/narrow previews. Use matching 3:2 editor/journal frames; Recent catches retains its narrow thumbnail. Save percentage positions with the catch through ownership-checked APIs. Center legacy/replacement photos by default, restore the original position if a pending replacement is removed, and preserve the full uncropped photo in catch details. Translate controls into English and Polish.

## Pre-launch flows

Empty accounts show lure-first onboarding, and the landing preview renders the same translated component. Profile actions live in the avatar menu. Journal filter state is preserved in the URL and detail/edit return links; browser Back restores the list position. Protect unsaved record/profile changes, stage saved-photo removal until Save with Undo, and keep optional record fields collapsed until needed. Authentication uses plain validation, focus on the first invalid field, and return to the requested protected destination. Password recovery gives a non-enumerating confirmation, accepts a single-use reset link and returns to sign-in after reset.
