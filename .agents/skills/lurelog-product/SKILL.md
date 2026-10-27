---
name: lurelog-product
description: Apply LureLog's product vision and engineering constraints when working on this fishing collection and catch journal repository.
---

# LureLog product context

LureLog is a personal fishing inventory and catch journal: users organize lures, connect catches to their own lures, and learn from real records. Build functional, maintainable features rather than static mockups or fabricated data. Inspect the existing implementation before making changes and keep work scoped to the user's request.

Use the project’s existing MERN/TypeScript architecture and visual language. Provide responsive, accessible interfaces, useful loading and error states, and real persistence. Preserve the current palette unless the user requests otherwise. Follow the frontend UI engineering skill for interface work.

Protect user-owned data throughout API queries, uploads, and deletion; never trust a client-supplied owner. Preserve secure authentication, validation, and the local development storage option. Test behavior relevant to the change and report any unverified integrations or limitations.

The full product requirements, proposed stack, workflows, and acceptance criteria are in `docs/product/lurelog-brief.md` at the repository root. Consult the relevant sections when working on a feature. Treat it as product context, not proof of current implementation or authorization to undertake unrelated work; newer user decisions take precedence.

Commit each requested change separately so it can be reverted independently.
