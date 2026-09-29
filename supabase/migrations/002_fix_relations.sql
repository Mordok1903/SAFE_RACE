-- Ejecuta este script en el SQL Editor de Supabase

-- Arreglar tabla registrations
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_participant_id_fkey;
ALTER TABLE public.registrations ADD CONSTRAINT registrations_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_approved_by_fkey;
ALTER TABLE public.registrations ADD CONSTRAINT registrations_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_safe_closed_by_fkey;
ALTER TABLE public.registrations ADD CONSTRAINT registrations_safe_closed_by_fkey FOREIGN KEY (safe_closed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Arreglar tabla alerts
ALTER TABLE public.alerts DROP CONSTRAINT IF EXISTS alerts_assigned_to_fkey;
ALTER TABLE public.alerts ADD CONSTRAINT alerts_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Arreglar tabla organizations
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_created_by_fkey;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Arreglar tabla organization_members
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Arreglar tabla events
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
ALTER TABLE public.events ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
