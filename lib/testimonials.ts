export type Testimonial = {
  name: string;
  neighborhood: string;
  service: string;
  rating: 5;
  date: string;
  body: string;
};

// NOTE: placeholder reviews. Real reviews will be collected via the site once we launch.
export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Priya S.",
    neighborhood: "Park Slope, Brooklyn",
    service: "TV Mounting",
    rating: 5,
    date: "2026-04-22",
    body: "Manny showed up exactly when he said he would, mounted our 65\" on a brick wall, and even cleaned up the dust. He noticed our outlet was on the wrong side and routed the cables so you can't see anything. Worth every penny.",
  },
  {
    name: "David R.",
    neighborhood: "Long Island City",
    service: "Half-Day Block",
    rating: 5,
    date: "2026-04-18",
    body: "Booked the 4-hour block for our move-in. He built two IKEA dressers, mounted the TV, hung six pieces of art, and fixed a wobbly bathroom door. We were ready for guests by dinner. Booking him again next month.",
  },
  {
    name: "Aisha K.",
    neighborhood: "Astoria, Queens",
    service: "AC Installation",
    rating: 5,
    date: "2026-04-12",
    body: "I'd been dreading installing this thing for three weekends. Manny did it in 40 minutes, sealed everything properly, and explained what he was doing as he went. No more back-and-forth with my landlord about a leak.",
  },
  {
    name: "Tomás M.",
    neighborhood: "East Village, Manhattan",
    service: "IKEA Assembly — Large",
    rating: 5,
    date: "2026-04-05",
    body: "Two PAX wardrobes, anchored to a plaster wall in a prewar building. Anyone who's tried this knows it's a nightmare. Manny had it done in three hours and they're rock solid.",
  },
  {
    name: "Hannah L.",
    neighborhood: "Williamsburg, Brooklyn",
    service: "Wall Repair",
    rating: 5,
    date: "2026-03-28",
    body: "We had four anchor holes from a previous tenant. Came out smooth — our security deposit thanks you, Manny.",
  },
  {
    name: "Marcus W.",
    neighborhood: "Harlem, Manhattan",
    service: "Faucet Installation",
    rating: 5,
    date: "2026-03-21",
    body: "Honest about what he could and couldn't do. Told me upfront the kitchen swap was easy but the bathroom needed a real plumber because the shutoff valve was seized. Saved me a much bigger bill. Will book again.",
  },
];

export const TRUST_STATS = {
  yearsExperience: 10,
  taskRabbitRating: 5,
  jobsCompleted: 2000,
  responseTime: "under 2 hours",
};
