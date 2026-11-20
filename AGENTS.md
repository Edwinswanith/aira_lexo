# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Locked Aira direction

- The selected visual direction is Warm Instrument.
- The source of truth is `design/reference/warm-instrument.png`.
- Use Aira as the public brand and Aira Lexo Solutions Private Limited as the legal entity.
- Keep the Founders page focused on people, responsibilities, biographies, and third-party profile verification. Do not show a public-brand, legal-entity, or role-review-date facts strip on that page.
- Use warm porcelain, dark editorial typography, restrained violet, mint, and coral accents.
- Product imagery uses the real retouched product photos in `public/images/product/`, labelled "Real product photo. Background edited." (plain backdrop) or "Real product photo. Background added." / "Scene added." (real product placed into a generated scene, never redrawn). Any AI-generated image must be checked against the real product. The owner decided (2026-11-20) not to show the "AI-generated image" badge on the homepage images; keep other labels unless told otherwise. Do not reintroduce the old concept renders.
- Public content must not contain an em dash character.
- Claims must preserve doctor control and must not imply autonomous diagnosis or prescribing.
- The public Aira logo mark is `public/images/aira-logo-mark.png`. Use the 256 px version in compact interface placements.
- The real product is a flat, pill-shaped, matte black 3D-printed recorder with a textured top, one central button that glows amber when ready, one USB-C port on a long side, a charging-indicator pinhole on the top, and a badge-holder slot on one end. It has no screen. The old Neura prototype photos were removed.
- Approved natural AI desk photos (round 5, A and B) are used on the homepage: B (extended to portrait, original device pixels kept) in the hero, A in "The ready light". The AI pocket shots (C and D) were rejected. AI generators consistently exaggerate the USB-C recess and add extra holes, so AI scenes must keep the USB-C side out of view and be zoom-checked for exactly one pinhole.
- The Buy page shows an interactive 3D model of the recorder (`src/components/product-3d.tsx`, three.js), built to the real device's proportions: cursor or finger movement turns it freely in every direction (front, back, underside, ends, corners), hovering the centre button holds the view and shows a pulse, clicking toggles the amber LED. It is labelled "3D model of the real recorder. Not a photo." Keep its geometry in step with the real device (USB-C off-centre on one long side in a shallow recess, pinhole near the far corner on the port end, badge slot on the other end).
- The /product page uses the owner's three real studio photos (top, USB-C side, underside), captioned "Real product photos. Studio backdrop extended to fit." The owner chose to keep the existing homepage hero.
