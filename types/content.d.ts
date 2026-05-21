// Shape declarations for data/content.json. Kept narrow — only the keys we
// actually read are typed. Extend as more sections come online.

export type Cta = { label: string; action: string };

export type ContentJson = {
  event: {
    name: string;
    short_name: string;
    edition: string;
    date_iso: string;
    date_display: string;
    venue: {
      name: string;
      short_name: string;
      address?: string;
      city: string;
      country: string;
      description: string;
      signature_feature?: string;
      photos?: string[];
      link_website: string;
      link_maps: string;
      coordinates?: { lat: number; lng: number };
      phone?: string;
    };
  };
  hero: {
    name_block: string;
    subtitle: string;
    date_line: string;
    location_line_1: string;
    location_line_2: string;
    tagline_primary: string;
    tagline_secondary: string;
    stats_line: string;
    cta_primary: Cta;
    cta_secondary: Cta;
  };
  about: {
    videos: { title: string; youtube: string }[];
    body: string[];
    media_mentions: { name: string; url: string }[];
    gallery: {
      images: string[];
      total_count: number;
    };
  };
  nominations: {
    submission_flow: string;
    note_dynamic: string;
    categories: { slug: string; name: string }[];
  };
  competition_timeline: {
    date_iso: string;
    date_display: string;
    label: string;
  }[];
  speakers: {
    titles_source_note: string;
    jury: Person[];
    speakers: Person[];
    program_status_label: string;
    to_be_speaker_form: {
      cta: string;
      fields: string[];
    };
  };
  schedule: {
    date_display: string;
    time_range: string;
    status_label: string;
    items: { time: string; title: string }[];
  };
  registration: {
    tickets: {
      slug: string;
      name: string;
      price_display: string;
      price_value: number;
      price_currency: string;
      includes: string[];
    }[];
    whitelist_form: {
      cta: string;
      fields: string[];
      delivery?: string;
    };
    payment_note: string;
  };
  partners: {
    directive_note?: string;
    excluded?: string[];
    list: PartnerEntry[];
    logo_download_todo?: string;
    to_be_partner_form?: { cta: string; fields: string[] };
  };
  media_partners: {
    directive_note?: string;
    list: PartnerEntry[];
  };
  contacts: {
    email: string;
    telegram_handle: string;
    socials: {
      linkedin: string;
      instagram: string;
      telegram: string;
      x_twitter: string;
    };
  };
};

export type PartnerEntry = {
  name: string;
  slug: string;
  logo_source?: string;
  logo_local: string;
  url?: string;
  note?: string;
};

export type Person = {
  slug: string;
  name: string;
  photo: string;
  title: string;
};

declare module "@/data/content.json" {
  const value: ContentJson;
  export default value;
}
