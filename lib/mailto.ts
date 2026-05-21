// Tiny helper for building a properly-encoded mailto: link. Each CTA
// across the page (nominate / speak / ticket / whitelist / partner) calls
// this with a section-specific subject + a draft body the user can edit
// in their mail client before sending.
//
// All copy strings live in mail-templates.ts next door so the wording can
// be tweaked in one place.

export function mailto(
  email: string,
  subject: string,
  body: string
): string {
  return `mailto:${email}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}
