export interface AppointmentType {
    id: string;
    patientName: string;
    procedure: string;
    doctorId: string;
    startTime: string; // HH:mm format
    durationMinutes: number;
    status: 'scheduled' | 'confirmed' | 'arrived' | 'completed' | 'cancelled';
    paymentStatus?: 'pending' | 'paid';
}

const MAX_CLINIC_UNITS = 3;

/**
 * Parses "HH:mm" into total minutes from start of day for easy comparison.
 */
export const parseTimeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};

export const formatMinutesToTime = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};



/**
 * Scans all appointments to determine if adding a new appointment
 * at the requested time and duration exceeeds the clinic's physical chair capacity.
 */
export const checkUnitAvailability = (
    appointments: AppointmentType[],
    requestedStart: string,
    durationMinutes: number,
    excludeApptId?: string
): boolean => {
    const reqStartMins = parseTimeToMinutes(requestedStart);
    const reqEndMins = reqStartMins + durationMinutes;

    // To be perfectly accurate, we need to check the peak concurrency *within* the requested time window.
    // A simple way is to check the concurrency at every 15-minute interval within the requested block.

    for (let currentMin = reqStartMins; currentMin < reqEndMins; currentMin += 15) {
        let activeUnitsAtThisMinute = 0;

        for (const appt of appointments) {
            if (excludeApptId && appt.id === excludeApptId) continue;
            if (appt.status === 'cancelled') continue;

            const apptStartMins = parseTimeToMinutes(appt.startTime);
            const apptEndMins = apptStartMins + appt.durationMinutes;

            // Does this appointment span across the current minute we are checking?
            if (currentMin >= apptStartMins && currentMin < apptEndMins) {
                activeUnitsAtThisMinute++;
            }
        }

        if (activeUnitsAtThisMinute >= MAX_CLINIC_UNITS) {
            return false; // Capacity reached!
        }
    }

    return true; // Units available
};

/**
 * Calculates how many chairs are occupied at a specific exact time slot (e.g. 10:00).
 * Used for visually disabling rows in the UI grid.
 */
export const getActiveUnitsAtTime = (appointments: AppointmentType[], timeSlot: string): number => {
    const checkMin = parseTimeToMinutes(timeSlot);
    let count = 0;

    for (const appt of appointments) {
        if (appt.status === 'cancelled') continue;
        const start = parseTimeToMinutes(appt.startTime);
        const end = start + appt.durationMinutes;

        // If the appointment is currently active during this exact minute
        if (checkMin >= start && checkMin < end) {
            count++;
        }
    }

    return count;
};

/**
 * Summarizes the appointments for the Dashboard widget.
 */
export const getTodayAppointmentsSummary = (appointments: AppointmentType[]) => {
    let scheduled = 0;
    let confirmed = 0;
    let arrived = 0;
    let completed = 0;

    appointments.forEach(appt => {
        if (appt.status === 'scheduled') scheduled++;
        if (appt.status === 'confirmed') confirmed++;
        if (appt.status === 'arrived') arrived++;
        if (appt.status === 'completed') completed++;
    });

    return {
        total: appointments.length, // Total previstas
        scheduled,
        confirmed,
        arrived,
        completed
    };
};

// Since MarketContext holds StaffMember, let's just make it generic or use a minimal interface locally.
export interface LocalStaffMember {
    nombres: string;
    email: string;
}

/**
 * Simulates fetching OUT OF OFFICE events and Tasks from each Doctor's Google Calendar.
 * Once the Google Calendar API OAuth is connected, this function will use `googleapis` to fetch real data.
 */
export const fetchStaffAbsencesFromCalendar = async (staff: LocalStaffMember[]) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!staff || staff.length === 0) return [];

    // Mock data simulating Google Calendar API response for "Out of office" and "Tasks", linked to specific emails
    const notices: any[] = [];

    // Simulate finding events for the first two doctors (if they exist)
    if (staff[0]) {
        notices.push({
            doctor: staff[0].nombres,
            status: 'Out of Office (Congreso Odontológico)',
            date: new Date().toLocaleDateString(),
            source: `Google Calendar (${staff[0].email})`
        });
    }

    if (staff[1]) {
        notices.push({
            doctor: staff[1].nombres,
            status: 'Task: Revisar inventario de implantes',
            date: new Date().toLocaleDateString(),
            source: `Google Tasks (${staff[1].email})`
        });
    }

    return notices;
};

// Initial Mock Data to bootstrap the Multi-Doctor Agenda
export const generateMockAppointments = (): AppointmentType[] => [
    {
        id: '1', patientName: 'Sofía Castro', procedure: 'Consulta Inicial',
        doctorId: '1', startTime: '09:00', durationMinutes: 60, status: 'confirmed'
    },
    {
        id: '2', patientName: 'Hugo Vázquez', procedure: 'Ajuste Brackets',
        doctorId: '2', startTime: '09:30', durationMinutes: 30, status: 'arrived'
    },
    {
        id: '3', patientName: 'María Pérez', procedure: 'Extracción Molar',
        doctorId: '3', startTime: '10:00', durationMinutes: 90, status: 'scheduled'
    },
    {
        id: '4', patientName: 'Juan López', procedure: 'Limpieza Dental',
        doctorId: '4', startTime: '10:00', durationMinutes: 45, status: 'confirmed'
    },
    {
        id: '5', patientName: 'Ana Ruiz', procedure: 'Blanqueamiento',
        doctorId: '1', startTime: '10:00', durationMinutes: 60, status: 'scheduled'
    }
    // Note: At 10:00 to 10:45, chairs are full (Doctor 3, 4, and 1).
];
