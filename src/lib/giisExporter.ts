import { Patient } from '../context/MarketContext';
import { PatientRecordData, logAuditAction } from './supabase';

/** GIIS Positional Format Exporter (Salud Bucal GIIS-B016-04-08) */
export function exportToGIIS(patient: Patient, record: PatientRecordData): string {
    const rows: string[] = [];

    // Header logic (Simplified spec for B016 positional)
    // Format: CURP(18) | Nombres(40) | Apellido1(40) | Apellido2(40) | Sexo(1) | FechaNac(8:AAAAMMDD) | Entidad(2)
    
    const clean = (s: string, len: number) => (s || '').substring(0, len).padEnd(len, ' ');
    const formatDate = (d: string) => (d || '').replace(/-/g, ''); // YYYYMMDD if stored as YYYY-MM-DD

    // 1. Patient Info Row
    const patientRow = [
        clean(patient.curp, 18),
        clean(patient.nombres, 40),
        clean(patient.primerApellido, 40),
        clean(patient.segundoApellido, 40),
        clean(patient.genero === 'Masculino' ? 'M' : 'F', 1),
        formatDate(patient.fechaNacimiento).padEnd(8, '0'),
        clean(patient.entidadNacimiento, 2) // Assuming 2-char code
    ].join('');
    
    rows.push(patientRow);

    // 2. Visits Data
    record.visits.forEach(v => {
        // Visit Record Spec (Simplified)
        // Date(8) | DiagnosticCode(4) | Procedure(4) | Doctor(30)
        const diagCode = (v.diagnosisCode || v.diagnosis.split(' ')[0]).padEnd(4, ' ');
        const visitRow = [
            formatDate(v.date).padEnd(8, ' '),
            diagCode,
            '0000', // Procedure code placeholder (needs catalog mapping)
            clean(v.doctorName, 30)
        ].join('');
        rows.push(visitRow);
    });

    logAuditAction(patient.id, 'EXPORT', { format: 'GIIS', count: record.visits.length });
    
    return rows.join('\n');
}

/** Triggers a browser download of the GIIS files */
export function downloadGIISFiles(patient: Patient, record: PatientRecordData) {
    const txtContent = exportToGIIS(patient, record);
    
    // .TXT File
    const blobTxt = new Blob([txtContent], { type: 'text/plain' });
    const urlTxt = URL.createObjectURL(blobTxt);
    const linkTxt = document.createElement('a');
    linkTxt.href = urlTxt;
    linkTxt.download = `GIIS_${patient.curp || patient.id}_${Date.now()}.txt`;
    linkTxt.click();

    // .CIF Header/Checksum (Mock generation)
    const cifContent = `CIF;NOM-024;SIRES-NUMIA;${Date.now()};SHA256:${Math.random().toString(36).substring(2)}`;
    const blobCif = new Blob([cifContent], { type: 'text/plain' });
    const urlCif = URL.createObjectURL(blobCif);
    const linkCif = document.createElement('a');
    linkCif.href = urlCif;
    linkCif.download = `GIIS_${patient.curp || patient.id}_${Date.now()}.cif`;
    linkCif.click();
}
