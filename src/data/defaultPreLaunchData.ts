import { PreLaunchSettings, PreLaunchDemoProperty } from "@/types/preLaunch";
import kurdish1 from "@/assets/property-kurdish-1.jpg";
import kurdish2 from "@/assets/property-kurdish-2.jpg";
import kurdish3 from "@/assets/property-kurdish-3.jpg";
import kurdish4 from "@/assets/property-kurdish-4.jpg";
import kurdish5 from "@/assets/property-kurdish-5.jpg";
import kurdish6 from "@/assets/property-kurdish-6.jpg";
import kurdish7 from "@/assets/property-kurdish-7.jpg";
import kurdish8 from "@/assets/property-kurdish-8.jpg";

export const DEFAULT_PRE_LAUNCH_SETTINGS: PreLaunchSettings = {
  hero_title: "Empowering Kurdistan's Hosts to Welcome the World",
  hero_subtitle:
    "Meewano (میوانۆ) is Kurdistan's premier vacation rental and boutique stay platform. We connect local homeowners across Erbil, Sulaymaniyah, Duhok, Rawanduz, and beyond with travelers seeking authentic hospitality.",
  badge_text: "Exclusive Pre-Launch • Become a Pioneer Founding Host",
  target_launch_date: "2026-10-15T00:00:00.000Z",
  target_hosts_count: 100,
  registered_hosts_count: 0,
  cities_count: 16,
  early_fee_pct: 0,
  about_title: "What is Meewano? (میوانۆ)",
  about_tagline: "An Easier Way to Explore Kurdistan",
  about_paragraphs: [
    "Meewano is a digital accommodation marketplace connecting guests with hotels, holiday homes, apartments, villas and other short-stay properties across Kurdistan. We make it easier for guests to discover and book accommodation, while giving local hosts a simple way to showcase and manage their properties.",
    "Meewano was created from a simple observation: exploring Kurdistan should be easier, and finding a place to stay should not be a source of uncertainty or frustration.",
    "The idea was inspired by the experience of travellers struggling to find reliable holiday accommodation through personal recommendations, social media and informal networks. Prices often required lengthy negotiation, availability was unpredictable, and it was difficult to know whether a property would truly match its description.",
    "There was also a lack of clear information for guests — from property instructions and local guidance to what they could expect on arrival — while hosts could be hesitant to accept guests due to a lack of trust and reliable information.",
    "Meewano brings hosts and guests together through a dedicated accommodation marketplace, Meewano is creating a simpler, clearer and more trusted way to stay in Kurdistan.",
    "Our vision is simple: make hosting easier, and help people explore Kurdistan with confidence"
  ],
  perks: [
    {
      id: "perk-1",
      title: "Register",
      description: "Create an account and register your property through easy step by step process.",
      icon: "Calendar",
    },
    {
      id: "perk-2",
      title: "Publish",
      description: "Add your property details, upload photos, add pricing and publish your property.",
      icon: "Camera",
    },
    {
      id: "perk-3",
      title: "Bookings",
      description: "Guests discover and book your property on Meewano.",
      icon: "Award",
    },
    {
      id: "perk-4",
      title: "Host",
      description: "Welcome Your Guest and receive your booking income.",
      icon: "Banknote",
    },
  ],
  faqs: [
    {
      id: "faq-1",
      question: "How does the Pre-Launch phase work?",
      answer: "During this pre-launch phase, homeowners pre-register their property details. Our local onboarding team contacts you to verify your listing and configure your calendar before public bookings open.",
    },
    {
      id: "faq-2",
      question: "Is there any cost to register as a host?",
      answer: "Pre-registering and creating your property listing on Meewano is completely free with no upfront fees.",
    },
    {
      id: "faq-3",
      question: "How do I manage my listing?",
      answer: "You have full control over your photos, descriptions, minimum stay lengths, and house rules directly from your host dashboard.",
    },
    {
      id: "faq-4",
      question: "What types of properties can I list?",
      answer: "Everything from mountain chalets and lakefront villas to modern city apartments, suburban homes, heritage guesthouses, and farm resorts across the Kurdistan Region.",
    },
    {
      id: "faq-5",
      question: "How are guests verified?",
      answer: "All guests on Meewano must provide verified phone numbers and identity checks before booking, giving hosts total peace of mind.",
    },
  ],
};

export const DEFAULT_DEMO_PROPERTIES: PreLaunchDemoProperty[] = [
  {
    id: "demo-1",
    title: "Gali Ali Bag Alpine Valley Chalet",
    location: "Rawanduz Canyon Overlook, Erbil Governorate",
    city: "Rawanduz",
    price_per_night: 180000,
    bedrooms: 3,
    bathrooms: 2,
    max_guests: 8,
    rating: 4.98,
    reviews_count: 42,
    badges: ["Mountain Panorama", "Stone Fireplace", "Private Garden"],
    description: "Perched high on the dramatic cliffs of Rawanduz canyon, this stone-and-timber chalet offers floor-to-ceiling mountain vistas, outdoor barbecue terrace, and tranquil alpine breezes.",
    image: kurdish1,
    host_name: "Kak Shwan H.",
    is_active: true,
    order: 1,
  },
  {
    id: "demo-2",
    title: "Dream City Citadel View Luxury Penthouse",
    location: "Gulan District, Dream City, Erbil",
    city: "Erbil",
    price_per_night: 230000,
    bedrooms: 2,
    bathrooms: 2,
    max_guests: 4,
    rating: 4.97,
    reviews_count: 65,
    badges: ["Citadel View", "24/7 Power", "High-Speed Fiber"],
    description: "A state-of-the-art luxury residence featuring designer furnishings, smart-home automation, rooftop sky deck, and immediate access to top restaurants and business hubs.",
    image: kurdish4,
    host_name: "Lana M. Barzani",
    is_active: true,
    order: 2,
  },
  {
    id: "demo-3",
    title: "Dukan Lakefront Sunset Villa & Pergola",
    location: "Lake Dukan Resort Area, Sulaymaniyah",
    city: "Sulaymaniyah",
    price_per_night: 260000,
    bedrooms: 4,
    bathrooms: 3,
    max_guests: 10,
    rating: 4.96,
    reviews_count: 38,
    badges: ["Direct Lake Access", "Private Pool", "BBQ Patio"],
    description: "Expansive private waterfront estate with swimming pool, fruit orchard, outdoor tea pergola, and breathtaking sunset reflections across Lake Dukan.",
    image: kurdish3,
    host_name: "Dana & Tanya R.",
    is_active: true,
    order: 3,
  },
  {
    id: "demo-4",
    title: "Amedi Ancient Cliffside Stone Haven",
    location: "Old Citadel Rim, Amedi, Duhok",
    city: "Duhok",
    price_per_night: 160000,
    bedrooms: 2,
    bathrooms: 1,
    max_guests: 5,
    rating: 4.94,
    reviews_count: 29,
    badges: ["Historic Fortress", "Valley View", "Authentic Stone"],
    description: "Carefully restored traditional Kurdish stone home sitting on the edge of the historic tabletop fortress of Amedi with uninterrupted vistas of the Sapna valley.",
    image: kurdish8,
    host_name: "Hogr Amedi",
    is_active: true,
    order: 4,
  }
];
