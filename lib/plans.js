export const PLANS = Object.freeze([
  {
    id: 'daily',
    name: 'Daily',
    price: 2000,
    days: 1,
    description: 'A focused day of video creation',
  },
  {
    id: 'weekly',
    name: 'Weekly',
    price: 7500,
    days: 7,
    description: 'A full week to create and refine',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 20000,
    days: 30,
    description: 'A month of uninterrupted creation',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 60000,
    days: 365,
    description: 'A full year of creative access',
  },
]);

export function getPlanById(planId) {
  return PLANS.find((plan) => plan.id === planId) ?? null;
}
