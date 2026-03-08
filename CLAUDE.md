# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server (hot reload)
npm run build     # tsc -b && vite build — run before every commit/push
npm run preview   # Preview production build locally
```

There are no tests. Always run `npm run build` to validate TypeScript before pushing — Vercel deploys from `main` automatically and will fail silently on type errors if new files are untracked.

## Architecture

**Stack:** React 19 + TypeScript, Vite, Tailwind CSS v3, React Router v7, Supabase (auth + realtime DB), Framer Motion, Recharts, Lucide React.

### State / Data Flow

All global state lives in `src/context/MarketContext.tsx` (`MarketProvider`). The app entry is `src/main.tsx` → `src/App.tsx` → `MarketProvider` → `AuthProvider` → Router.

**Clinic profile** (staff, settings, patients list) is persisted in a single Supabase row: `clinic_profiles` table, column `profile_json`. Helpers: `loadClinicProfile` / `saveClinicProfile` in `src/lib/supabase.ts`. The `CLINIC_ID` constant (`'numia-main'`) identifies the row.

**Patients** are stored inside `clinicProfile.patients[]` (field added to `ClinicProfile`). On mount, patients are hydrated instantly from `localStorage`, then confirmed/merged from Supabase via `syncFromCloud`. `setPatients` triggers a `useEffect` that saves to both localStorage and Supabase. Critical pattern: `skipPatientsPersist` ref prevents spurious saves during cloud hydration.

**Patient expedientes** (visits, treatment plans, prescriptions) are stored separately in the `patient_records` Supabase table, keyed by `clinic_id` + `patientId`. Helpers: `loadPatientRecord` / `savePatientRecord` / `uploadPatientFile` in `src/lib/supabase.ts`.

### RBAC

Roles: `admin`, `doctor`, `assistant`. Flag `isMasterAdmin` grants total access. `hasPermission(module)` in `MarketContext` checks the current user. `PermissionGuard` wraps protected routes. `isDoctor(s: StaffMember)` returns true for `staffType === 'doctor' | 'external_doctor'`.

### Key Files

| File | Purpose |
|------|---------|
| `src/context/MarketContext.tsx` | All global state, Supabase sync, RBAC, patient persistence |
| `src/context/AuthContext.tsx` | Login/logout, `currentUser` |
| `src/lib/supabase.ts` | Supabase client, all DB helpers, Patient record types |
| `src/components/PatientProfile.tsx` | 5-tab patient view (historial, odontograma, consultas, plan_tratamiento, finanzas) |
| `src/components/PatientProfileForm.tsx` | Create/edit patient modal (full-screen portal) |
| `src/components/PatientDirectory.tsx` | Patient list with grid/list views, inline edit/delete |
| `src/pages/Agenda.tsx` | Calendar + patient directory page, wires PatientProfileForm ↔ PatientDirectory |
| `src/components/patient/TreatmentPipeline.tsx` | Kanban treatment plan with optimistic local state |

### Styling

Dark "cobalt" theme. Key Tailwind utilities: `bg-cobalt`, `text-electric`, `text-clinical`, `font-syne`. Never commit `.env`, `tsconfig.tsbuildinfo`, or `dist/` assets.

### Deployment

Vercel auto-deploys on push to `main`. **Always commit all new `src/` files before pushing** — Vercel fails silently if files are untracked. Login: `admin@numiadental.com` / `12345`.