import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing env vars. Cloud persistence disabled.');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

// ─── Clinic profile helpers ───────────────────────────────────────────────────

export const CLINIC_ID = 'numia-main';

/** Load the clinic profile JSON from Supabase */
export async function loadClinicProfile<T>(): Promise<T | null> {
    try {
        const { data, error } = await supabase
            .from('clinic_profiles')
            .select('profile_json')
            .eq('id', CLINIC_ID)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') { // PGRST116 = row not found
                console.error('[Supabase] Load error:', error.message);
            }
            return null;
        }
        return data?.profile_json as T ?? null;
    } catch (e) {
        console.error('[Supabase] Network error:', e);
        return null;
    }
}

/** Save the clinic profile JSON to Supabase */
export async function saveClinicProfile<T>(profile: T): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('clinic_profiles')
            .upsert({
                id: CLINIC_ID,
                profile_json: profile,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (error) {
            console.error('[Supabase] Save error:', error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (e: any) {
        console.error('[Supabase] Network error saving:', e);
        return { success: false, error: e.message || 'Error de red' };
    }
}

// ─── Patient record types ─────────────────────────────────────────────────────

export interface PatientNote {
    id: string;
    doctorName: string;
    doctorId: string;
    text: string;
    createdAt: string;
}

export interface PatientMedicalHistory {
    alergias: boolean;
    diabetes: boolean;
    hipertension: boolean;
    cardiopatia: boolean;
    embarazo: boolean;
    medicamentos: string;
    notas: string;
    // legacy field kept for backward compat
    notes?: string;
}

export interface PatientFile {
    id: string;
    name: string;
    storagePath: string;
    url: string;
    createdAt: string;
    comment?: string;
    type?: 'radiografia' | 'imagen' | 'documento' | 'otro';
}

// ─── Visit / Consultation types ───────────────────────────────────────────────

export interface PrescriptionMedication {
    name: string;
    dose: string;
    frequency: string;
    duration: string;
}

export interface PatientPrescription {
    id: string;
    medications: PrescriptionMedication[];
    freeText: string;
}

export type VisitStatus = 'attended' | 'cancelled_patient' | 'cancelled_clinic' | 'no_show';

export interface PatientVisit {
    id: string;
    date: string;
    doctorId: string;
    doctorName: string;
    chiefComplaint: string;
    diagnosis: string;
    procedures: string;
    evolutionNote: string;
    nextAppointment?: string;
    status: VisitStatus;
    duration?: number;
    prescription?: PatientPrescription;
    files: PatientFile[];
    vitals?: {
        bloodPressure?: string;
        pulse?: string;
        weight?: string;
        temperature?: string;
    };
}

// ─── Treatment Plan types ─────────────────────────────────────────────────────

export type TreatmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface TreatmentPlanItem {
    id: string;
    name: string;
    code?: string;
    toothNumber?: number;
    surface?: string;
    phase: number;
    status: TreatmentStatus;
    price: number;
    discount: number;
    estimatedDate?: string;
    completedDate?: string;
    completedInVisitId?: string;
    doctorId?: string;
    doctorName?: string;
    notes?: string;
}

export interface TreatmentPlan {
    items: TreatmentPlanItem[];
    notes: string;
    updatedAt: string;
}

export interface PatientRecordData {
    notes: PatientNote[];
    chartData?: {
        surfaces: Record<number, unknown>;
        treatments: Array<{ id: string; toothNumber: number; surface: string; condition: string; price: number; name: string }>;
        periodoData: Record<number, unknown>;
    };
    medicalHistory: PatientMedicalHistory;
    files: PatientFile[];
    visits: PatientVisit[];
    treatmentPlan: TreatmentPlan;
}

const DEFAULT_PATIENT_RECORD: PatientRecordData = {
    notes: [],
    medicalHistory: {
        alergias: false, diabetes: false, hipertension: false,
        cardiopatia: false, embarazo: false, medicamentos: '', notas: '',
    },
    files: [],
    visits: [],
    treatmentPlan: { items: [], notes: '', updatedAt: '' },
};

// ─── Patient record helpers ───────────────────────────────────────────────────

/** Load a patient's full clinical record from Supabase */
export async function loadPatientRecord(patientId: string): Promise<PatientRecordData> {
    try {
        const { data, error } = await supabase
            .from('patient_records')
            .select('data_json')
            .eq('patient_id', patientId)
            .eq('clinic_id', CLINIC_ID)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('[Supabase] Patient record load error:', error.message);
            }
            return { ...DEFAULT_PATIENT_RECORD };
        }
        return { ...DEFAULT_PATIENT_RECORD, ...(data?.data_json as PatientRecordData) };
    } catch (e) {
        console.error('[Supabase] Patient record network error:', e);
        return { ...DEFAULT_PATIENT_RECORD };
    }
}

/** Save a patient's full clinical record to Supabase */
export async function savePatientRecord(
    patientId: string,
    data: Partial<PatientRecordData>
): Promise<{ success: boolean; error?: string }> {
    try {
        // Fetch current record first to merge (avoid overwriting other fields)
        const current = await loadPatientRecord(patientId);
        const merged = { ...current, ...data };

        const { error } = await supabase
            .from('patient_records')
            .upsert({
                patient_id: patientId,
                clinic_id: CLINIC_ID,
                data_json: merged,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'patient_id,clinic_id' });

        if (error) {
            console.error('[Supabase] Patient record save error:', error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (e: any) {
        console.error('[Supabase] Patient record network error saving:', e);
        return { success: false, error: e.message || 'Error de red' };
    }
}

/** Upload a file to Supabase Storage and return its public URL */
export async function uploadPatientFile(
    patientId: string,
    file: File,
    subfolder?: string
): Promise<{ url: string; storagePath: string } | null> {
    const ext = file.name.split('.').pop();
    const basePath = subfolder ? `${CLINIC_ID}/${patientId}/${subfolder}` : `${CLINIC_ID}/${patientId}`;
    const storagePath = `${basePath}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
        .from('patient-files')
        .upload(storagePath, file, { upsert: false });

    if (error) {
        console.error('[Supabase] File upload error:', error.message);
        return null;
    }

    const { data: urlData } = supabase.storage
        .from('patient-files')
        .getPublicUrl(storagePath);

    return { url: urlData.publicUrl, storagePath };
}

/** Delete a file from Supabase Storage */
export async function deletePatientFile(storagePath: string): Promise<boolean> {
    const { error } = await supabase.storage
        .from('patient-files')
        .remove([storagePath]);
    if (error) {
        console.error('[Supabase] File delete error:', error.message);
        return false;
    }
    return true;
}
