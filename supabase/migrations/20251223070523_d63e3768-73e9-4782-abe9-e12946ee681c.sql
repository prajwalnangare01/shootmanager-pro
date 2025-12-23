-- Add payout column to shoots table
ALTER TABLE public.shoots ADD COLUMN payout numeric DEFAULT NULL;