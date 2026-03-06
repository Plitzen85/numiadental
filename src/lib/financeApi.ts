const STORAGE_KEY = 'map_pro_finance_data';

const initialData = {
    ingresosAdicionales: 1250000,
    egresosOperativos: 480000,
    balanceNeto: 770000,
    saldos: {
        revolut: 450000,
        bbva: 400000,
        banorte: 300000,
        cripto: 0,
        efectivo: 45000,
    },
    ingresosRecientes: [
        { id: 'TX-101', concepto: 'Implantes All-on-4 (Paciente Internacional)', monto: 228000, fecha: '2026-03-01', estatus: 'Completado' },
        { id: 'TX-102', concepto: 'Diseño de Sonrisa (Carillas VIP)', monto: 185000, fecha: '2026-03-02', estatus: 'Completado' },
        { id: 'TX-103', concepto: 'Ortodoncia Invisible', monto: 45000, fecha: '2026-03-03', estatus: 'Pendiente' },
    ],
    comisionesDoctor: [
        { doctor: 'Dr. Alejandro Rivas', especialidad: 'Implantología', montoGenerado: 145000, porcentaje: 30, aPagar: 43500 },
        { doctor: 'Dra. Sofía Mendoza', especialidad: 'Rehabilitación', montoGenerado: 85000, porcentaje: 35, aPagar: 29750 },
    ],
    comisionesTurismo: [
        { intermediario: 'Medical Travelers USA', operaciones: 3, montoTotalPacientes: 450000, aPagar: 45000, estatus: 'Pendiente' },
        { intermediario: 'Direct Booking VIP', operaciones: 1, montoTotalPacientes: 125000, aPagar: 6250, estatus: 'Pagado' },
    ]
};

// Initialize or get data
const getStoredData = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.saldos && parsed.saldos.bancos !== undefined) {
            parsed.saldos.revolut = Math.floor(parsed.saldos.bancos * 0.4);
            parsed.saldos.bbva = Math.floor(parsed.saldos.bancos * 0.4);
            parsed.saldos.banorte = parsed.saldos.bancos - parsed.saldos.revolut - parsed.saldos.bbva;
            parsed.saldos.cripto = 0;
            delete parsed.saldos.bancos;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
};

export const getFinancialSummary = async () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(getStoredData());
        }, 400); // reduced timeout for better UX
    });
};

export type AccountType = 'revolut' | 'bbva' | 'banorte' | 'cripto' | 'efectivo';

export const addTransaction = async (tipo: 'ingreso' | 'egreso' | 'comision_intermediario', cuenta: AccountType, concepto: string, montoBruto: number, cryptoType?: string) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const data = getStoredData();

            const isCrypto = cuenta === 'cripto';
            const feeRate = (isCrypto && cryptoType !== 'MXN') ? 0.015 : 0;
            const montoNeto = (isCrypto && tipo === 'ingreso') ? montoBruto * (1 - feeRate) : montoBruto;
            const finalConcepto = isCrypto ? `${concepto} (Pagado en ${cryptoType || 'Cripto'})` : concepto;

            if (tipo === 'ingreso') {
                data.ingresosAdicionales += montoNeto;
                data.saldos[cuenta] += montoNeto;

                // Add to recent incomes
                const newTx = {
                    id: `TX-${Math.floor(Math.random() * 1000) + 200}`,
                    concepto: finalConcepto,
                    monto: montoNeto,
                    fecha: new Date().toISOString().split('T')[0],
                    estatus: 'Completado'
                };
                data.ingresosRecientes.unshift(newTx);
                if (data.ingresosRecientes.length > 5) {
                    data.ingresosRecientes.pop();
                }
            } else if (tipo === 'egreso' || tipo === 'comision_intermediario') {
                data.egresosOperativos += montoNeto;
                data.saldos[cuenta] -= montoNeto;

                if (tipo === 'comision_intermediario') {
                    // find or create the intermediary in comisionesTurismo to reflect this payment/registry
                    const existingIntermediary = data.comisionesTurismo.find((c: any) => c.intermediario === concepto);
                    if (existingIntermediary) {
                        existingIntermediary.estatus = 'Pagado';
                        // we're simulating a direct payment here
                    } else {
                        data.comisionesTurismo.push({
                            intermediario: concepto,
                            operaciones: 1,
                            montoTotalPacientes: montoNeto * 10, // heuristic mock
                            aPagar: montoNeto,
                            estatus: 'Pagado'
                        });
                    }
                }
            }

            data.balanceNeto = data.ingresosAdicionales - data.egresosOperativos;

            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            resolve(data);
        }, 400);
    });
};
