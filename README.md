# Raise Note

Tell existing clients your new rate without the awkward draft.

A static web tool for independent designers, developers, and consultants raising rates for existing clients. Paste the relationship, current rate, new rate, effective date, and what stays the same. Get a sendable email and a one-page PDF rate update note.

Price: $19 once. The generator is free to try. Licensed PDFs drop the free-version footer line.

This is not a contract rewrite. Not legal advice. Not a negotiation threat.

## How to open locally

No build step. No backend.

```bash
cd projects/005-raise-note
python3 -m http.server 8080
```

Then open http://localhost:8080/

Unlock a watermark-free PDF for testing:

http://localhost:8080/?license=demo

That sets `localStorage.raiseNoteLicense`.

## Checkout

Stripe payment link is not wired yet. That is the payment blocker. Checkout button stays on `#price` until a link exists. `?license=` still unlocks PDFs for testing.

## Where this gets found

SEO pages first. People search "freelance rate increase email" and "how to tell clients you are raising rates" when they stall on the raise draft.

## Privacy

Nothing typed in the form is uploaded. It stays in the browser.

## Live

https://latinsushi.github.io/raise-note/

## Custom domain (later)

Intended: `raise.usefulmill.com`. Do not add a `CNAME` file or set the GitHub Pages custom domain until DNS exists. Live URL for now: https://latinsushi.github.io/raise-note/
