export interface PricingTier {
  name: string;
  min: number;
  max: number | null;
  rate: number; // rand per active lease per month, ex VAT
}

// Mirrors the per-lease tiers published for RentBook. The first 20 leases are free.
export const FREE_LEASES = 20;

export const PRICING_TIERS: PricingTier[] = [
  { name: 'Basic', min: 1, max: 20, rate: 0 },
  { name: 'Small', min: 21, max: 50, rate: 7.5 },
  { name: 'Medium', min: 51, max: 100, rate: 6 },
  { name: 'Large', min: 101, max: 250, rate: 5.5 },
  { name: 'X-Large', min: 251, max: 300, rate: 4.5 },
  { name: 'Unlimited', min: 301, max: null, rate: 4 },
];

export function tierFor(leases: number): PricingTier {
  return PRICING_TIERS.find(t => leases >= t.min && (t.max === null || leases <= t.max)) ?? PRICING_TIERS[0];
}

// Assumption: billing applies only to leases above the free 20, at the rate of the
// tier your total lease count falls in. Check against the supplier's terms if this matters.
export function monthlyFee(leases: number): number {
  if (leases <= FREE_LEASES) return 0;
  return (leases - FREE_LEASES) * tierFor(leases).rate;
}
