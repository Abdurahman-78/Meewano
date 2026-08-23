export interface PreLaunchSettings {
  hero_title: string;
  hero_subtitle: string;
  badge_text: string;
  target_launch_date: string;
  target_hosts_count: number;
  registered_hosts_count: number;
  cities_count: number;
  early_fee_pct: number;
  about_title: string;
  about_tagline: string;
  about_paragraphs: string[];
  perks: {
    id: string;
    title: string;
    description: string;
    icon: string;
  }[];
  faqs: {
    id: string;
    question: string;
    answer: string;
  }[];
}

export interface PreLaunchDemoProperty {
  id: string;
  title: string;
  location: string;
  city: string;
  price_per_night: number;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  rating: number;
  reviews_count: number;
  badges: string[];
  description: string;
  image: string;
  host_name: string;
  is_active: boolean;
  order?: number;
}

export interface PreLaunchHostSubmission {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  property_type: string;
  bedrooms: number;
  max_guests: number;
  experience: string;
  notes?: string | null;
  status: "pending" | "contacted" | "approved" | "rejected";
  admin_notes?: string | null;
  created_at: string;
}
