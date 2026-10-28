# Rentala

Rental management for independent landlords and small letting agents in South Africa.
React + TypeScript + Vite + Tailwind + shadcn/ui, with Supabase for auth and data.

## What it does

- **Properties and tenants**: units, live occupancy, leases and rent
- **Invoices**: create, email, text or print with your business details; marking one paid records the payment
- **Arrears**: overdue invoices by tenant with days overdue and one-tap email or SMS reminders
- **Expenses**: vendor list and bills, with what is due and what is cleared
- **Payments, maintenance and reports**: as before, now fed by real data
- **Screening**: applicant log with approve and decline
- **Pricing page**: tiered per-lease pricing with a calculator

## Setup

1. Create a Supabase project and run `supabase/migrations/20261028000000_init.sql` in the SQL editor.
2. Put your project URL and anon key in `src/integrations/supabase/client.ts`.
3. Regenerate types: `npx supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts`
4. `pnpm install` then `pnpm dev`.

Every table has row level security, so each user only sees their own rows.

## Known limits

- Email and SMS open the user's own mail or messaging app. Sending automatically (scheduled reminders, delivery tracking) needs a Supabase Edge Function and a provider such as an SMS gateway.
- Screening is a manual log. A live credit bureau check needs a bureau account and a server-side integration.
- The pricing calculator assumes the per-lease rate of your total tier applies to leases above the free 20.
