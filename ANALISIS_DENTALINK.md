# Análisis Nümia Dental vs Dentalink
> Generado: 2026-03-10 | Stack: React 19 + TypeScript + Supabase

## Stack del Proyecto
- **DB:** Supabase (PostgreSQL)
- **ORM/Client:** Supabase JS SDK
- **Roles:** admin, doctor, assistant, isMasterAdmin
- **Multi-clínica:** Single-tenant (`CLINIC_ID = 'numia-main'`)
- **UI:** Tailwind CSS v3 (dark cobalt theme)
- **Notificaciones:** Ninguna integrada (Google Calendar parcial)

---

## Tabla de Funcionalidades

| # | Funcionalidad Dentalink | Estado | Notas |
|---|------------------------|--------|-------|
| **AGENDA Y CITAS** | | | |
| 1 | Autoagendamiento online por paciente | ⚠️ Parcial | Portal pre-registro existe (`/registro`), sin booking de cita directa |
| 2 | Notificación inmediata al dentista | ❌ Faltante | Sin sistema de notificaciones push/email |
| 3 | Confirmación cita por WhatsApp/Email | ⚠️ Parcial | Link wa.me generado en Agenda (sin API real) |
| 4 | Notificaciones automáticas 24h antes | ❌ Faltante | Requiere scheduler/Edge Function |
| 5 | Vista agenda diaria por doctor | ✅ Completo | `Agenda.tsx` con Google Calendar sync |
| 6 | Indicador financiero desde agenda | ✅ Completo | Badge saldo/adeudo en tarjetas de cita |
| 7 | Vista agenda semanal por profesional | ⚠️ Parcial | Vista diaria completa, semanal no dedicada |
| **HISTORIA CLÍNICA** | | | |
| 8 | Odontograma interactivo | ✅ Completo | `HybridChart.tsx` + `ToothSVG.tsx` |
| 9 | Catálogo diagnósticos tratado/pendiente | ✅ Completo | TreatmentPipeline con status kanban |
| 10 | Comentarios clínicos por diente | ⚠️ Parcial | Notas por visita, no por diente específico |
| 11 | Historial clínico cronológico | ✅ Completo | Tab historial en `PatientProfile.tsx` |
| 12 | Periodontograma con sondeos | ✅ Completo | `PeriodoGrid.tsx` completo |
| 13 | Indicadores visuales perio (furcas, sangrado) | ✅ Completo | Furcación 0-3, movilidad, sangrado bucolingual |
| 14 | Gráfica del periodontograma | ✅ Completo | `HybridChart.tsx` con SVG chart |
| 15 | Módulo radiografías y documentos | ✅ Completo | Upload por visita a Supabase Storage |
| **ORTODONCIA** | | | |
| 16 | Módulo ortodoncia independiente | ❌ Faltante | Sin módulo |
| 17 | Gráfica progreso calendarizado vs real | ❌ Faltante | |
| 18 | Resumen aparatología del paciente | ❌ Faltante | |
| 19 | Curva de higiene | ❌ Faltante | |
| 20 | Resumen sesión anterior (arco, calibre) | ❌ Faltante | |
| 21 | Plantilla fotográfica de progreso | ❌ Faltante | |
| **RECETAS** | | | |
| 22 | Módulo prescripción de medicamentos | ✅ Completo | `VisitRecord.tsx` tab Receta |
| 23 | Historial recetas del paciente | ✅ Completo | Accesible por visita en historial |
| 24 | Plantillas recetas predefinidas | ✅ Completo | Quick-select de medicamentos frecuentes |
| 25 | Exportación receta PDF con logo | ✅ Completo | `printPrescription()` en patientPrint.ts |
| **PLANES DE TRATAMIENTO Y PAGOS** | | | |
| 26 | Planes de tratamiento con precios | ✅ Completo | `TreatmentPipeline.tsx` kanban |
| 27 | Selección múltiple dientes compartida | ⚠️ Parcial | Asignación individual por ítem |
| 28 | Cálculo automático honorarios | ✅ Completo | Totales con descuento en tiempo real |
| 29 | Exportación plan tratamiento PDF | ✅ Completo | `printTreatmentPlan()` con vigencia 15 días |
| 30 | Estado de cuenta por paciente | ✅ Completo | `PatientFinanzas.tsx` tab Caja |
| 31 | Registro pagos por cita/prestación | ✅ Completo | Cobros ligados a TreatmentPlanItems |
| 32 | Bonos y descuentos libres | ✅ Completo | Descuento % por ítem del plan |
| 33 | Selección método de pago | ✅ Completo | Efectivo, tarjeta, transferencia, cripto |
| 34 | Comprobante de pago (impresión) | ✅ Completo | `printPaymentReceipt()` en patientPrint.ts |
| 35 | Historial pagos con desglose | ✅ Completo | `PatientFinanzas.tsx` lista de cobros |
| **CAJA Y LIQUIDACIONES** | | | |
| 36 | Módulo de caja | ✅ Completo | `Caja.tsx` con corte diario |
| 37 | Resumen caja: métodos de pago, gastos | ✅ Completo | Desglose por método en tiempo real |
| 38 | Desglose pacientes y pagos por caja | ⚠️ Parcial | Movimientos listados, sin reporte paciente-a-paciente |
| 39 | Liquidaciones doctores (automático) | ✅ Completo | `comisionesEngine.ts` |
| 40 | Reporte liquidación por rango fechas | ✅ Completo | `Reports.tsx` tab Médicos |
| **GASTOS Y FINANZAS** | | | |
| 41 | Registro gastos fijos y variables | ✅ Completo | Egresos en Caja + Finanzas |
| 42 | Categorización de gastos | ✅ Completo | Categorías predefinidas en Caja |
| 43 | Asociación gasto a caja | ✅ Completo | Egreso ligado al corte del día |
| 44 | Fecha factura vs fecha pago | ❌ Faltante | Campo único de fecha |
| **MARKETING Y COMUNICACIÓN** | | | |
| 45 | Email marketing | ⚠️ Parcial | `Campaigns.tsx` genera scripts, sin envío real |
| 46 | Reporte pacientes sin cita 6 meses | ✅ Completo | `Reports.tsx` tab Pacientes — sección inactivos |
| 47 | Campaña masiva por email | ❌ Faltante | Sin integración SMTP/SendGrid |
| 48 | Felicitación automática cumpleaños | ❌ Faltante | Sin scheduler |
| 49 | Plantillas email personalizadas | ⚠️ Parcial | Templates en Campaigns, sin persistencia |
| 50 | Métricas apertura correos | ❌ Faltante | Sin tracking de email |
| **REPORTES** | | | |
| 51 | Exportables Excel (.xlsx) | ✅ Completo | Export CSV/Excel desde Reports y Finanzas |
| 52 | Reportes gráficos (dashboards) | ✅ Completo | Dashboard + Reports con Recharts |
| 53 | Sistema de créditos pacientes | ⚠️ Parcial | Campo `saldo` existe, sin interfaz dedicada |
