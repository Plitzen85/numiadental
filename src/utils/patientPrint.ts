import { Patient } from '../context/MarketContext';
import { PatientMedicalHistory } from '../lib/supabase';

export function printPatientRecord(
    patient: Patient,
    clinicName = 'Nümia Dental',
    medicalHistory?: PatientMedicalHistory,
    clinicalFormState?: Record<string, string>
) {
    const alertMed = patient.alertaMedica && patient.alertaMedica !== 'Sin alerta' && patient.alertaMedica !== ''
        ? `<div class="alert alert-med">⚠ Alerta Médica: ${patient.alertaMedica}</div>` : '';
    const alertAdm = patient.alertaAdministrativa && patient.alertaAdministrativa !== 'Sin alerta' && patient.alertaAdministrativa !== ''
        ? `<div class="alert alert-adm">⚠ Alerta Administrativa: ${patient.alertaAdministrativa}</div>` : '';

    const field = (label: string, value: string) =>
        `<div class="field"><label>${label}</label><span>${value || '—'}</span></div>`;

    // Build full clinical questionnaire section (from PatientProfileForm formState)
    const clinicalHtml = clinicalFormState ? (() => {
        const fs = clinicalFormState;
        const yn = (key: string) => fs[key] === 'si' ? '<span class="yes">✓ SÍ</span>' : '<span class="no">✗ NO</span>';
        const tf = (label: string, key: string) => fs[key]?.trim()
            ? `<div class="field"><label>${label}</label><span>${fs[key]}</span></div>` : '';
        const boolRow = (label: string, key: string) =>
            `<div class="bool-row"><span class="bool-label">${label}</span>${yn(key)}</div>`;
        const activeEnf = [
            ['bool_diabetes','Diabetes'],['bool_hipertension','Hipertensión arterial'],
            ['bool_hipotension','Hipotensión arterial'],['bool_cardio','Enfermedades cardiovasculares'],
            ['bool_asma','Asma'],['bool_tuberculosis','Tuberculosis'],['bool_hepatitis','Hepatitis'],
            ['bool_renal','Enfermedades renales'],['bool_gastritis','Gastritis'],
            ['bool_ulcera','Úlcera gástrica'],['bool_piel','Piel hipersensible'],
            ['bool_coagulacion','Defectos de coagulación'],['bool_anemia','Anemia'],
            ['bool_artritis','Artritis reumatoide'],['bool_epilepsia','Epilepsia'],
            ['bool_transfusion','Transfusiones sanguíneas'],['bool_radiacion','Terapias de radiación'],
        ].filter(([k]) => fs[k] === 'si').map(([,l]) => l);
        const activeAlerg = [
            ['bool_anestesia','Anestésicos locales'],['bool_penicilina','Penicilina'],
            ['bool_sulfas','Sulfas'],['bool_barbitur','Barbitúricos/sedantes'],
            ['bool_aspirina','Aspirina'],['bool_peroxido','Agua oxigenada'],
            ['bool_hipoclorito','Hipoclorito de sodio'],['bool_polvo','Polvo'],
            ['bool_latex','Hule o látex'],
        ].filter(([k]) => fs[k] === 'si').map(([,l]) => l);

        return `
  <div class="section">
    <div class="section-title">Antecedentes Generales</div>
    <div class="grid">
      ${tf('Medio por el cual nos conoce', 'radio_source')}
      ${tf('Familiar atendido en la clínica', 'text_15')}
    </div>
  </div>
  <div class="section">
    <div class="section-title">Historial Clínico Médico</div>
    ${boolRow('¿Considera bueno su estado de salud?', 'bool_salud')}
    ${boolRow('¿Ha observado cambios en su salud en el último año?', 'bool_cambios')}
    ${boolRow('¿Se encuentra bajo tratamiento médico?', 'bool_tratamiento')}
    ${tf('Tratamiento médico — especifique', 'text_16')}
    ${boolRow('¿Ha tenido cirugía o enfermedad grave (últimos 5 años)?', 'bool_cirugia')}
    ${tf('Cirugía — especifique', 'text_17')}
    <div class="grid" style="margin-top:8px">
      ${tf('Nombre de su médico', 'text_18')}
      ${tf('Teléfono del médico', 'text_19')}
      ${tf('Fuma (frecuencia)', 'text_20')}
      ${tf('Alcohol (frecuencia)', 'text_21')}
      ${tf('Drogas (especifique)', 'text_22')}
    </div>
    ${boolRow('¿Embarazo o lactancia?', 'bool_embarazo')}
  </div>
  ${activeEnf.length ? `
  <div class="section">
    <div class="section-title">Enfermedades Reportadas</div>
    <div class="tags">${activeEnf.map(l => `<span class="tag">${l}</span>`).join('')}</div>
    ${tf('Sífilis / Gonorrea / Sida / Otros', 'text_23')}
    ${tf('Alergias (alimentos, pólen, etc.)', 'text_24')}
    ${tf('Otra enfermedad', 'text_25')}
  </div>` : ''}
  ${activeAlerg.length ? `
  <div class="section">
    <div class="section-title">Alergias a Fármacos / Materiales</div>
    <div class="tags">${activeAlerg.map(l => `<span class="tag">${l}</span>`).join('')}</div>
  </div>` : ''}
  <div class="section">
    <div class="section-title">Historial Clínico Dental</div>
    <div class="grid">
      ${tf('Última visita al dentista', 'text_26')}
      ${tf('Tratamiento realizado', 'text_27')}
      ${tf('Experiencia previa', 'text_28')}
      ${tf('Temor dental', 'text_29')}
      ${tf('Frecuencia de cepillado', 'text_30')}
      ${tf('¿Le gustan sus dientes?', 'text_31')}
      ${tf('¿Se siente cómodo con sus dientes?', 'text_32')}
      ${tf('Calificación funcional al masticar', 'select_4')}
      ${tf('Calificación de sonrisa', 'select_5')}
      ${tf('Motivo / expectativas de consulta', 'text_33')}
    </div>
  </div>`;
    })() : '';

    // Build antecedentes checkboxes section
    const antecedentesHtml = medicalHistory ? (() => {
        const items: { label: string; active: boolean }[] = [
            { label: 'Alergias a Medicamentos', active: !!medicalHistory.alergias },
            { label: 'Diabetes',                active: !!medicalHistory.diabetes },
            { label: 'Hipertensión',            active: !!medicalHistory.hipertension },
            { label: 'Cardiopatía',             active: !!medicalHistory.cardiopatia },
            { label: 'Embarazo',                active: !!medicalHistory.embarazo },
        ];
        const boxes = items.map(it =>
            `<div class="antecedente ${it.active ? 'active' : ''}">
                <span class="check">${it.active ? '✓' : '○'}</span> ${it.label}
            </div>`
        ).join('');

        const medicamentos = medicalHistory.medicamentos?.trim();
        const notas = (medicalHistory.notas ?? medicalHistory.notes ?? '').trim();

        return `
  <div class="section">
    <div class="section-title">Antecedentes Médicos</div>
    <div class="antecedentes-grid">${boxes}</div>
    ${medicamentos ? `
    <div class="text-field">
      <label>Medicamentos Actuales</label>
      <p>${medicamentos}</p>
    </div>` : ''}
    ${notas ? `
    <div class="text-field">
      <label>Notas Adicionales</label>
      <p>${notas}</p>
    </div>` : ''}
  </div>`;
    })() : '';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Expediente — ${patient.nombres} ${patient.apellidos}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#1a1a2e;line-height:1.6;background:#fff}
    .page{max-width:820px;margin:0 auto;padding:40px 36px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #00d4ff;padding-bottom:20px;margin-bottom:28px}
    .logo{font-size:26px;font-weight:900;letter-spacing:3px;color:#00d4ff}
    .logo-sub{font-size:10px;color:#888;letter-spacing:1px;text-transform:uppercase;margin-top:2px}
    .meta{text-align:right;font-size:11px;color:#666;line-height:1.8}
    .meta strong{color:#1a1a2e;font-size:13px}
    .alert{border-radius:6px;padding:8px 14px;margin-bottom:8px;font-size:11px;font-weight:700;border:1.5px solid}
    .alert-med{border-color:#ef4444;background:#fef2f2;color:#dc2626}
    .alert-adm{border-color:#f59e0b;background:#fffbeb;color:#d97706}
    .section{margin-bottom:28px}
    .section-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#00d4ff;padding-bottom:6px;border-bottom:1px solid #e5e7eb;margin-bottom:14px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
    .field label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;display:block;margin-bottom:3px}
    .field span{font-size:12px;color:#111827;font-weight:500;display:block;border-bottom:1px solid #f3f4f6;padding-bottom:3px}
    .bool-row{display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f3f4f6;font-size:12px;color:#374151;font-weight:500}
    .bool-label{flex:1}
    .yes{color:#16a34a;font-weight:800;font-size:11px}
    .no{color:#9ca3af;font-weight:700;font-size:11px}
    .tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
    .tag{background:#fef2f2;border:1px solid #fca5a5;color:#dc2626;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px}
    .antecedentes-grid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
    .antecedente{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;padding:5px 12px;border-radius:6px;border:1.5px solid #e5e7eb;color:#6b7280;background:#f9fafb}
    .antecedente.active{border-color:#ef4444;background:#fef2f2;color:#dc2626}
    .antecedente .check{font-weight:900;font-size:13px}
    .text-field{margin-top:10px}
    .text-field label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;display:block;margin-bottom:4px}
    .text-field p{font-size:12px;color:#111827;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;background:#f9fafb;white-space:pre-wrap}
    .signatures{display:flex;justify-content:space-between;margin-top:60px;padding-top:0}
    .sig{width:220px;text-align:center}
    .sig-line{border-top:1px solid #374151;padding-top:8px;font-size:10px;color:#6b7280;font-weight:600}
    .footer{margin-top:36px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:9px;color:#9ca3af}
    @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}@page{margin:20mm}}
  </style>
</head>
<body><div class="page">
  <div class="header">
    <div>
      <div class="logo">${clinicName.toUpperCase()}</div>
      <div class="logo-sub">Expediente Clínico del Paciente</div>
    </div>
    <div class="meta">
      <strong>Núm. Paciente #${patient.numeroPaciente}</strong><br>
      Folio: ${patient.folio}<br>
      Tipo: ${patient.tipoPaciente}<br>
      Generado: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
    </div>
  </div>

  ${alertMed}${alertAdm}

  <div class="section">
    <div class="section-title">Datos de Identificación</div>
    <div class="grid">
      ${field('Nombre completo', `${patient.nombres} ${patient.apellidos}`)}
      ${field('Fecha de nacimiento', patient.fechaNacimiento)}
      ${field('Género', patient.genero)}
      ${field('Estado civil', patient.estadoCivil)}
      ${field('Ciudad / Lugar de origen', patient.ciudad)}
      ${field('País', patient.pais || 'México')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Datos de Contacto</div>
    <div class="grid">
      ${field('Teléfono', patient.telefono)}
      ${field('Correo electrónico', patient.email)}
      ${field('Domicilio', patient.domicilio)}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Resumen Clínico</div>
    <div class="grid">
      ${field('Alerta médica', patient.alertaMedica && patient.alertaMedica !== 'Sin alerta' ? patient.alertaMedica : 'Sin alerta registrada')}
      ${field('Alerta administrativa', patient.alertaAdministrativa && patient.alertaAdministrativa !== 'Sin alerta' ? patient.alertaAdministrativa : 'Sin alerta')}
      ${field('Última visita', patient.ultimaVisita)}
      ${field('Saldo', patient.saldo === 0 ? 'Al corriente' : `$${Math.abs(patient.saldo).toLocaleString('es-MX')} ${patient.saldo < 0 ? 'pendiente' : 'a favor'}`)}
    </div>
  </div>

  ${clinicalHtml}

  ${antecedentesHtml}

  <div class="signatures">
    <div class="sig"><div class="sig-line">Firma Física Paciente o Tutor</div></div>
    <div class="sig"><div class="sig-line">Firma Digital Paciente o Tutor</div></div>
  </div>

  <div class="footer">
    <span>${clinicName} — Documento generado digitalmente con fines de registro clínico</span>
    <span>Información confidencial — Uso interno y del paciente · COFEPRIS</span>
  </div>
</div></body></html>`;

    const win = window.open('', '_blank', 'width=920,height=750');
    if (!win) { alert('Permite ventanas emergentes para imprimir.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 600);
}

export function getOrCreateToken(): string {
    return crypto.randomUUID();
}
