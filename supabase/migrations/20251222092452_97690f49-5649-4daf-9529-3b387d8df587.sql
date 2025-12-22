-- Enable realtime for shoots table
ALTER TABLE public.shoots REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shoots;