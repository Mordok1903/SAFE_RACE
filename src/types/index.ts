export type RaceStatus = 'NOT_STARTED' | 'REGISTERED' | 'STARTED' | 'RACING' | 'FINISHED' | 'WITHDRAWN' | 'SAFE';
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'READY' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
export type AlertType = 'SOS' | 'DEVIATION' | 'STATIONARY' | 'NO_GPS';
export type AlertStatus = 'CREATED' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
export type OrgRole = 'OWNER' | 'ORGANIZER' | 'OPERATOR' | 'RESPONDER';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
  document_type?: string;
  document_number?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_by: string;
}

export interface Event {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  public_slug: string;
  description?: string;
  starts_at?: string;
  location_name?: string;
  distance_meters?: number;
  max_participants?: number;
  registration_open_at?: string;
  registration_close_at?: string;
  max_race_time_seconds: number;
  route_tolerance_meters: number;
  deviation_time_seconds: number;
  stationary_time_seconds: number;
  no_gps_time_seconds: number;
  status: EventStatus;
}

export interface Registration {
  id: string;
  event_id: string;
  participant_id: string;
  registration_status: RegistrationStatus;
  race_status: RaceStatus;
  participant_code?: string;
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  check_in_at?: string;
  start_at?: string;
  finish_at?: string;
  withdrawn_at?: string;
  safe_closed_at?: string;
  safe_closed_by?: string;
  
  // Joins
  profile?: Profile;
  event?: Event;
}

export interface RoutePoint {
  id: string;
  route_id: string;
  sequence: number;
  latitude: number;
  longitude: number;
}

export interface GPSPosition {
  id: number;
  registration_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  speed_mps?: number;
  heading?: number;
  device_timestamp: string;
  received_at: string;
}

export interface Alert {
  id: string;
  event_id: string;
  registration_id: string;
  type: AlertType;
  severity: string;
  status: AlertStatus;
  sos_reason?: string;
  title?: string;
  details?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  
  // Joins
  registration?: Registration;
}
