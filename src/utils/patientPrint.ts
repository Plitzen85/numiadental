import { Patient } from '../context/MarketContext';

export function printPatientRecord(patient: Patient, clinicName = 'Nümia Dental') {
    const alertMed = patient.alertaMedica && patient.alertaMedica !== 'Sin alerta' && patient.alertaMedica !== ''
        ? `<div class="alert alert-med">⚠ Alerta Médica: ${patient.alertaMedica}</div>` : '';
    const alertAdm = patient.alertaAdministrativa && patient.alertaAdministrativa !== 'Sin alerta' && patient.alertaAdministrativa !== ''
        ? `<div class="alert alert-adm">⚠ Alerta Administrativa: ${patient.alertaAdministrativa}</div>` : '';

    const field = (label: string, value: string) =>
        `<div class="field"><label>${label}</label><span>${value || '—'}</span></div>`;

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