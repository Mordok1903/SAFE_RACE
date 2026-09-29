-- Migración inicial para SAFE RACE con seguridad y constraints mejoradas

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date DATE,
    document_type TEXT,
    document_number TEXT,
    phone TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'ORGANIZER', 'OPERATOR', 'RESPONDER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);
CREATE INDEX idx_org_members_user_id ON public.organization_members(user_id);

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    public_slug TEXT UNIQUE NOT NULL,
    description TEXT,
    starts_at TIMESTAMPTZ,
    location_name TEXT,
    distance_meters INTEGER CHECK (distance_meters >= 0),
    max_participants INTEGER CHECK (max_participants > 0),
    registration_open_at TIMESTAMPTZ,
    registration_close_at TIMESTAMPTZ,
    max_race_time_seconds INTEGER DEFAULT 14400 CHECK (max_race_time_seconds >= 0),
    route_tolerance_meters INTEGER DEFAULT 50 CHECK (route_tolerance_meters >= 0),
    deviation_time_seconds INTEGER DEFAULT 60 CHECK (deviation_time_seconds >= 0),
    stationary_time_seconds INTEGER DEFAULT 120 CHECK (stationary_time_seconds >= 0),
    no_gps_time_seconds INTEGER DEFAULT 300 CHECK (no_gps_time_seconds >= 0),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'READY', 'ACTIVE', 'FINISHED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.event_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_one_active_route ON public.event_routes (event_id) WHERE is_active = true;

CREATE TABLE public.route_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES public.event_routes(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL CHECK (sequence >= 0),
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(route_id, sequence)
);

CREATE TABLE public.registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    registration_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (registration_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    race_status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (race_status IN ('NOT_STARTED', 'REGISTERED', 'STARTED', 'RACING', 'FINISHED', 'WITHDRAWN', 'SAFE')),
    participant_code TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    check_in_at TIMESTAMPTZ,
    start_at TIMESTAMPTZ,
    finish_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    safe_closed_at TIMESTAMPTZ,
    safe_closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    _last_status_source TEXT DEFAULT 'SYSTEM', -- Helper para conservar la fuente
    UNIQUE(event_id, participant_id)
);
CREATE UNIQUE INDEX idx_registrations_code ON public.registrations(event_id, participant_code) WHERE participant_code IS NOT NULL;
CREATE INDEX idx_registrations_event_status ON public.registrations(event_id, registration_status, race_status);

CREATE TABLE public.qr_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    qr_token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);
CREATE UNIQUE INDEX idx_one_active_qr ON public.qr_credentials (registration_id) WHERE is_active = true;

CREATE TABLE public.qr_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    credential_id UUID REFERENCES public.qr_credentials(id) ON DELETE SET NULL,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    scan_type TEXT NOT NULL CHECK (scan_type IN ('CHECK_IN', 'START', 'FINISH')),
    scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    result TEXT NOT NULL CHECK (result IN ('SUCCESS', 'INVALID', 'REVOKED', 'DUPLICATE', 'WRONG_EVENT')),
    notes TEXT
);

CREATE TABLE public.participant_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    source TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

CREATE TABLE public.gps_positions (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    accuracy_meters DOUBLE PRECISION CHECK (accuracy_meters >= 0),
    speed_mps DOUBLE PRECISION CHECK (speed_mps >= 0),
    heading DOUBLE PRECISION,
    device_timestamp TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_gps_positions_reg_time ON public.gps_positions(registration_id, device_timestamp DESC);

CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('SOS', 'DEVIATION', 'STATIONARY', 'NO_GPS')),
    severity TEXT NOT NULL DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED')),
    sos_reason TEXT CHECK (type != 'SOS' OR sos_reason IS NOT NULL),
    title TEXT,
    details TEXT,
    latitude DOUBLE PRECISION CHECK (latitude >= -90 AND latitude <= 90 OR latitude IS NULL),
    longitude DOUBLE PRECISION CHECK (longitude >= -180 AND longitude <= 180 OR longitude IS NULL),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    in_progress_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);
CREATE INDEX idx_alerts_event_status ON public.alerts(event_id, status);
CREATE UNIQUE INDEX idx_no_duplicate_active_alerts ON public.alerts (registration_id, type) WHERE status IN ('CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS');

CREATE TABLE public.alert_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.finish_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT NOT NULL CHECK (source IN ('SIMULATOR', 'HARDWARE', 'MANUAL')),
    status TEXT DEFAULT 'PENDING_VALIDATION',
    validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ,
    metadata JSONB
);

-- 3. FUNCTIONS & TRIGGERS

-- Function to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_event_routes_updated_at BEFORE UPDATE ON public.event_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Automáticamente hacer al creador de una org su OWNER
CREATE OR REPLACE FUNCTION public.add_org_creator_as_owner()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    IF NEW.created_by IS NOT NULL THEN
        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (NEW.id, NEW.created_by, 'OWNER');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_org_created AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.add_org_creator_as_owner();

-- Log de participant_status_history
CREATE OR REPLACE FUNCTION public.log_participant_status_change()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.race_status != 'NOT_STARTED') OR (TG_OP = 'UPDATE' AND OLD.race_status IS DISTINCT FROM NEW.race_status) THEN
        INSERT INTO public.participant_status_history (
            registration_id, previous_status, new_status, source, changed_by, occurred_at
        ) VALUES (
            NEW.id,
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.race_status ELSE NULL END,
            NEW.race_status,
            COALESCE(NEW._last_status_source, 'SYSTEM'),
            auth.uid(),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER track_race_status_changes
    AFTER INSERT OR UPDATE ON public.registrations
    FOR EACH ROW EXECUTE FUNCTION public.log_participant_status_change();


-- Funciones de Seguridad para evitar recursión en RLS
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = org_id AND user_id = auth.uid());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.has_org_role(org_id UUID, req_role TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = org_id AND user_id = auth.uid() AND role = req_role);
END;
$$ LANGUAGE plpgsql;

-- 4. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finish_events ENABLE ROW LEVEL SECURITY;

-- Profiles:
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Organizers can view profiles of their registrants" ON public.profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.registrations r
        JOIN public.events e ON r.event_id = e.id
        WHERE r.participant_id = profiles.id AND public.is_org_member(e.organization_id)
    )
);

-- Organizations:
CREATE POLICY "Members can view their organizations" ON public.organizations FOR SELECT USING (public.is_org_member(id));
CREATE POLICY "Owners can create organizations" ON public.organizations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can update organizations" ON public.organizations FOR UPDATE USING (public.has_org_role(id, 'OWNER'));

-- Organization Members:
CREATE POLICY "Members can view members of their organization" ON public.organization_members FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Owners can manage members" ON public.organization_members FOR ALL USING (public.has_org_role(organization_id, 'OWNER'));

-- Events:
CREATE POLICY "Anyone can view published events" ON public.events FOR SELECT USING (status != 'DRAFT');
CREATE POLICY "Organizers can view all events of their org" ON public.events FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Organizers can insert events" ON public.events FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Organizers can update events" ON public.events FOR UPDATE USING (public.is_org_member(organization_id));

-- Routes & Route Points:
CREATE POLICY "Anyone can view active routes of published events" ON public.event_routes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_routes.event_id AND e.status != 'DRAFT' AND event_routes.is_active = true)
);
CREATE POLICY "Organizers can view and manage routes" ON public.event_routes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_routes.event_id AND public.is_org_member(e.organization_id))
);

CREATE POLICY "Anyone can view points of active routes" ON public.route_points FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.event_routes er JOIN public.events e ON er.event_id = e.id WHERE er.id = route_points.route_id AND e.status != 'DRAFT' AND er.is_active = true)
);
CREATE POLICY "Organizers can manage route points" ON public.route_points FOR ALL USING (
    EXISTS (SELECT 1 FROM public.event_routes er JOIN public.events e ON er.event_id = e.id WHERE er.id = route_points.route_id AND public.is_org_member(e.organization_id))
);

-- Registrations:
CREATE POLICY "Participants can view their own registrations" ON public.registrations FOR SELECT USING (participant_id = auth.uid());
CREATE POLICY "Participants can create their own registration" ON public.registrations FOR INSERT WITH CHECK (
    participant_id = auth.uid() 
    AND registration_status = 'PENDING' 
    AND race_status = 'NOT_STARTED'
);
CREATE POLICY "Participants can update their registration (only withdrawal/status)" ON public.registrations FOR UPDATE USING (participant_id = auth.uid());
CREATE POLICY "Organizers can view and manage registrations" ON public.registrations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = registrations.event_id AND public.is_org_member(e.organization_id))
);

-- QR Credentials:
CREATE POLICY "Participants can view their own QR" ON public.qr_credentials FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = qr_credentials.registration_id AND r.participant_id = auth.uid())
);
CREATE POLICY "Organizers can manage QRs" ON public.qr_credentials FOR ALL USING (
    EXISTS (SELECT 1 FROM public.registrations r JOIN public.events e ON r.event_id = e.id WHERE r.id = qr_credentials.registration_id AND public.is_org_member(e.organization_id))
);

-- QR Scans:
CREATE POLICY "Organizers can insert and view scans" ON public.qr_scans FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = qr_scans.event_id AND public.is_org_member(e.organization_id))
);

-- GPS Positions:
CREATE POLICY "Participants can insert their own GPS positions" ON public.gps_positions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = gps_positions.registration_id AND r.participant_id = auth.uid())
);
CREATE POLICY "Organizers can read GPS positions for their events" ON public.gps_positions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.registrations r JOIN public.events e ON r.event_id = e.id WHERE r.id = gps_positions.registration_id AND public.is_org_member(e.organization_id))
);

-- Alerts:
CREATE POLICY "Participants can insert SOS alerts for themselves" ON public.alerts FOR INSERT WITH CHECK (
    type = 'SOS' 
    AND status = 'CREATED' 
    AND EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = alerts.registration_id AND r.participant_id = auth.uid() AND r.event_id = alerts.event_id)
);
CREATE POLICY "Participants can view their own alerts" ON public.alerts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = alerts.registration_id AND r.participant_id = auth.uid())
);
CREATE POLICY "Organizers can manage alerts for their events" ON public.alerts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = alerts.event_id AND public.is_org_member(e.organization_id))
);

-- Alert Actions:
CREATE POLICY "Organizers can manage alert actions" ON public.alert_actions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.alerts a JOIN public.events e ON a.event_id = e.id WHERE a.id = alert_actions.alert_id AND public.is_org_member(e.organization_id))
);

-- Finish Events:
CREATE POLICY "Organizers can manage finish events" ON public.finish_events FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = finish_events.event_id AND public.is_org_member(e.organization_id))
);

-- History:
CREATE POLICY "Organizers can view status history" ON public.participant_status_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.registrations r JOIN public.events e ON r.event_id = e.id WHERE r.id = participant_status_history.registration_id AND public.is_org_member(e.organization_id))
);
CREATE POLICY "Participants can view their own status history" ON public.participant_status_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = participant_status_history.registration_id AND r.participant_id = auth.uid())
);

-- HABILITACIÓN DE REALTIME PARA SUPABASE
-- Si esta migración se corre en un Supabase, habilitará realtime en estas tablas.
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

