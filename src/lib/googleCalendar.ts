/**
 * Google Calendar integration service for Nümia Dental
 *
 * Behavior:
 *  - On page load, silently attempts to reconnect already-authorized accounts (no popup)
 *  - Each doctor authorizes once via OAuth popup (stored in sessionStorage)
 *  - Agenda auto-polls calendar events every 30 s for real-time sync
 *  - "Sincronizar" button forces an immediate refresh
 *  - Creating a new appointment also pushes an event to the doctor's Google Calendar
 *
 * Setup needed (one-time, by developer):
 *  1. Google Cloud Console → Enable Google Calendar API
 *  2. OAuth 2.0 Web client → set Authorized JS origins for localhost + Vercel URL
 *  3. Add VITE_GOOGLE_CLIENT_ID=<your-client-id> to .env
 *  4. index.html already loads GIS: <script src="https://accounts.google.com/gsi/client" async />
 */

import type { AppointmentType } from './agendaLogic';

const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar';

export interface GCalToken {
    access_token: string;
    email: string;
    expiry: number; // ms timestamp
}

export interface GCalEvent {
    id: string;
    summary?: string;
    description?: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
    status?: string;
    htmlLink?: string;
    attendees?: { email: string; displayName?: string }[];
}

// ---------------------------------------------------------------------------
// Token store — localStorage persists across sessions (survives page reload
// and browser restarts). Tokens expire after ~1 hour but are renewed silently.
// A separate "authorized" list remembers which doctors have ever consented,
// so silent reconnect is attempted automatically on every page load.
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'numia_gcal_tokens';
const AUTH_KEY  = 'numia_gcal_authorized'; // doctors who have given consent at least once

function loadTokens(): Record<string, GCalToken> {
    try {
        const raw = localStorage.getItem(TOKEN_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function persistTokens(tokens: Record<string, GCalToken>) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

/** Returns doctor IDs that have previously authorized (even if token is now expired). */
export function getAuthorizedDoctorIds(): string[] {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function addToAuthorized(doctorId: string) {
    const list = getAuthorizedDoctorIds();
    if (!list.includes(doctorId)) {
        localStorage.setItem(AUTH_KEY, JSON.stringify([...list, doctorId]));
    }
}

function removeFromAuthorized(doctorId: string) {
    const list = getAuthorizedDoctorIds().filter(id => id !== doctorId);
    localStorage.setItem(AUTH_KEY, JSON.stringify(list));
}

let _tokens: Record<string, GCalToken> = loadTokens();

export function getStoredToken(doctorId: string): GCalToken | null {
    const t = _tokens[doctorId];
    if (!t) return null;
    if (Date.now() > t.expiry) {
        delete _tokens[doctorId];
        persistTokens(_tokens);
        return null;
    }
    return t;
}

export function getConnectedDoctorIds(): string[] {
    return Object.keys(_tokens).filter(id => {
        const t = _tokens[id];
        return t && Date.now() < t.expiry;
    });
}

export function isConnected(doctorId: string): boolean {
    return getStoredToken(doctorId) !== null;
}

export function disconnectDoctor(doctorId: string) {
    delete _tokens[doctorId];
    persistTokens(_tokens);
    removeFromAuthorized(doctorId);
}

export function getClientId(): string {
    return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

// ---------------------------------------------------------------------------
// OAuth — Google Identity Services
// ---------------------------------------------------------------------------

async function storeToken(doctorId: string, accessToken: string, expiresIn: number): Promise<GCalToken> {
    // Mark this doctor as having authorized at least once (persists forever in localStorage)
    addToAuthorized(doctorId);
    try {
        const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
        const info: { email?: string } = await r.json();
        const token: GCalToken = {
            access_token: accessToken,
            email: info.email ?? '',
            expiry: Date.now() + expiresIn * 1000,
        };
        _tokens[doctorId] = token;
        persistTokens(_tokens);
        return token;
    } catch {
        const token: GCalToken = {
            access_token: accessToken,
            email: '',
            expiry: Date.now() + expiresIn * 1000,
        };
        _tokens[doctorId] = token;
        persistTokens(_tokens);
        return token;
    }
}

/**
 * First-time connection: shows Google account picker popup.
 * Call this only when no token exists for the doctor.
 */
export function connectDoctor(
    doctorId: string,
    onSuccess: (token: GCalToken) => void,
    onError: (msg: string) => void
) {
    const clientId = getClientId();
    if (!clientId) {
        onError('VITE_GOOGLE_CLIENT_ID no está configurado en .env');
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
        onError('Google Identity Services no disponible. Recarga la página.');
        return;
    }

    const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GCAL_SCOPE,
        callback: (resp: { access_token?: string; error?: string; expires_in?: number }) => {
            if (resp.error || !resp.access_token) {
                onError(resp.error ?? 'Error al autenticar con Google');
                return;
            }
            storeToken(doctorId, resp.access_token, resp.expires_in ?? 3600)
                .then(onSuccess);
        },
    });

    client.requestAccessToken({ prompt: 'select_account' });
}

/**
 * Silent re-connection — no popup.
 * GIS will reuse the existing Google session if the user previously consented.
 * Resolves with the new token or null if silent auth is not possible.
 */
export function silentReconnect(doctorId: string): Promise<GCalToken | null> {
    const clientId = getClientId();
    if (!clientId) return Promise.resolve(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) return Promise.resolve(null);

    return new Promise(resolve => {
        const client = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: GCAL_SCOPE,
            callback: (resp: { access_token?: string; error?: string; expires_in?: number }) => {
                if (resp.error || !resp.access_token) {
                    resolve(null);
                    return;
                }
                storeToken(doctorId, resp.access_token, resp.expires_in ?? 3600)
                    .then(token => resolve(token));
            },
            error_callback: () => resolve(null),
        });
        // Empty prompt = silent, no popup; fails gracefully if not possible
        client.requestAccessToken({ prompt: '' });
    });
}

// ---------------------------------------------------------------------------
// Google Calendar REST helpers
// ---------------------------------------------------------------------------

async function gcalFetch(
    path: string,
    accessToken: string,
    options: RequestInit = {}
): Promise<unknown | null> {
    try {
        const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        if (!res.ok) return null;
        if (res.status === 204) return true; // DELETE success
        return res.json();
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all events on a doctor's primary Google Calendar for the given date.
 */
export async function fetchCalendarEvents(doctorId: string, date: Date): Promise<GCalEvent[]> {
    const token = getStoredToken(doctorId);
    if (!token) return [];

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const params = new URLSearchParams({
        timeMin: dayStart.toISOString(),
        timeMax: dayEnd.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '100',
    });

    const data = await gcalFetch(
        `/calendars/primary/events?${params}`,
        token.access_token
    ) as { items?: GCalEvent[] } | null;

    return data?.items ?? [];
}

/**
 * Creates an event on the doctor's primary Google Calendar.
 * Returns the new Google Calendar event ID, or null on failure.
 */
export async function createCalendarEvent(options: {
    doctorId: string;
    title: string;
    startTime: string;       // "HH:mm"
    durationMinutes: number;
    date: Date;
    description?: string;
    patientEmail?: string;   // invite patient as attendee
}): Promise<string | null> {
    const token = getStoredToken(options.doctorId);
    if (!token) return null;

    const [h, m] = options.startTime.split(':').map(Number);
    const start = new Date(options.date);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + options.durationMinutes * 60_000);

    const body: Record<string, unknown> = {
        summary: options.title,
        description: options.description ?? 'Cita agendada en Nümia Dental',
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 60 },
                { method: 'popup', minutes: 15 },
            ],
        },
    };

    if (options.patientEmail) {
        body.attendees = [{ email: options.patientEmail }];
    }

    const data = await gcalFetch('/calendars/primary/events', token.access_token, {
        method: 'POST',
        body: JSON.stringify(body),
    }) as { id?: string } | null;

    return data?.id ?? null;
}

/**
 * Deletes an event from a doctor's Google Calendar.
 */
export async function deleteCalendarEvent(doctorId: string, eventId: string): Promise<boolean> {
    const token = getStoredToken(doctorId);
    if (!token) return false;
    const result = await gcalFetch(
        `/calendars/primary/events/${eventId}`,
        token.access_token,
        { method: 'DELETE' }
    );
    return result !== null;
}

/**
 * Converts a GCalEvent to the app's AppointmentType.
 * Returns null for all-day events (no dateTime field).
 */
export function gcalEventToAppointment(event: GCalEvent, doctorId: string): AppointmentType | null {
    if (!event.start?.dateTime) return null;

    const start = new Date(event.start.dateTime);
    const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;
    const durationMinutes = end
        ? Math.round((end.getTime() - start.getTime()) / 60_000)
        : 30;

    const timeStr =
        `${start.getHours().toString().padStart(2, '0')}:` +
        `${start.getMinutes().toString().padStart(2, '0')}`;

    const attendeeEmail = event.attendees?.[0]?.email;

    return {
        id: `gcal-${event.id}`,
        patientName: event.summary ?? 'Evento de Google Calendar',
        procedure: 'Google Calendar',
        doctorId,
        startTime: timeStr,
        durationMinutes: Math.max(15, durationMinutes),
        status: 'confirmed',
        googleCalendarEventId: event.id,
        isGoogleCalendarEvent: true,
        attendeeEmail,
    };
}