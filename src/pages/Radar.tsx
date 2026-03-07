import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMarket } from '../context/MarketContext';
import { fetchDentalCompetitors } from '../lib/mockApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { MapPin, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

// Fix Leaflet default icon paths using a standard workaround
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for the user's clinic
const userClinicIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    map.setView(center, map.getZoom());
    return null;
}

export const Radar: React.FC = () => {
    const { competitors, setCompetitors, baseLocation, setBaseLocation, searchRadius, setSearchRadius, clinicProfile } = useMarket();
    const [isScanning, setIsScanning] = useState(false);
    const [scanRadius, setScanRadius] = useState<number>(10);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [searchCity, setSearchCity] = useState('Ciudad de México');

    const handleCitySearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const city = searchCity;
        if (!city.trim()) return;

        setIsGeocoding(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'NumiaDental/1.0 (Contact: numiadentalapp@gmail.com)' // required by Nominatim
                }
            });

            if (!res.ok) {
                throw new Error(`Nominatim API responded with status: ${res.status}`);
            }

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Nominatim API did not return JSON");
            }

            const data = await res.json();
            if (data && data.length > 0) {
                setBaseLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
            } else {
                alert("No se encontró la ubicación. Intenta nuevamente.");
            }
        } catch (error) {
            console.error("Geocoding failed", error);
        } finally {
            setIsGeocoding(false);
            setCompetitors([]);
        }
    };

    const [activeTab, setActiveTab] = useState<'mapa' | 'notificaciones'>('mapa');
    const [nuevasAperturas, setNuevasAperturas] = useState<any[]>([]);

    const handleAnalizarZona = async () => {
        setIsScanning(true);
        setSearchRadius(scanRadius);
        setCompetitors([]);
        setNuevasAperturas([]);

        try {
            const data = await fetchDentalCompetitors(baseLocation, scanRadius);
            setCompetitors(data.negocios);

            // Simulating live search for new business registrations in the area
            setTimeout(() => {
                setNuevasAperturas([
                    { id: 'new-1', nombre: 'Smile Studio Centro', fechaRegistro: 'Hace 2 días', plataforma: 'Google Empresa', direccion: 'Av. Constituyentes, Playa del Carmen' },
                    { id: 'new-2', nombre: 'Dental Care Riviera', fechaRegistro: 'Hace 5 días', plataforma: 'Directorio Médico Nacional', direccion: 'Quinta Avenida, Playa del Carmen' },
                    { id: 'new-3', nombre: 'Clinica Dental del Sol', fechaRegistro: 'Hace 1 semana', plataforma: 'Facebook Pages', direccion: 'Col. Zazil-Ha, Playa del Carmen' }
                ]);
            }, 1000);
        } catch (error) {
            console.error("Error al analizar la zona", error);
            alert("No se pudieron obtener los competidores reales en esta zona.");
        } finally {
            setIsScanning(false);
        }
    };

    // Gap Engine Metrics
    const avgPrices = React.useMemo(() => {
        if (!competitors.length) return [];
        const serviceMap: Record<string, { total: number, count: number }> = {};
        competitors.forEach(c => {
            Object.entries(c.precios).forEach(([service, price]) => {
                if (!serviceMap[service]) serviceMap[service] = { total: 0, count: 0 };
                serviceMap[service].total += price;
                serviceMap[service].count += 1;
            });
        });

        return Object.entries(serviceMap).map(([name, data]) => {
            const avg = Math.round(data.total / data.count);

            let myPrice = 0;
            if (clinicProfile?.servicios) {
                for (const category of Object.values(clinicProfile.servicios)) {
                    if (category[name]) {
                        myPrice = category[name];
                        break;
                    }
                }
            }

            return {
                name,
                "Promedio Local": avg,
                "Mi Precio": myPrice > 0 ? myPrice : undefined
            };
        }).sort((a, b) => b["Promedio Local"] - a["Promedio Local"]);
    }, [competitors, clinicProfile]);

    const topServices = avgPrices.slice(0, 5);

    // Dynamic Gap Insights
    const gapInsights = React.useMemo(() => {
        if (!competitors.length) return null;

        const serviceFrequency: Record<string, number> = {};
        competitors.forEach(c => {
            c.servicios.forEach(s => {
                serviceFrequency[s] = (serviceFrequency[s] || 0) + 1;
            });
        });

        let maxFreq = 0;
        let saturatedService = '';
        Object.entries(serviceFrequency).forEach(([s, freq]) => {
            if (freq > maxFreq) {
                maxFreq = freq;
                saturatedService = s;
            }
        });

        const allPossibleServices = ['Implantes', 'Ortodoncia', 'Limpieza', 'Blanqueamiento', 'Endodoncia', 'Carillas'];
        let minFreq = Infinity;
        let opportunityService = '';

        allPossibleServices.forEach(s => {
            const freq = serviceFrequency[s] || 0;
            if (freq < minFreq) {
                minFreq = freq;
                opportunityService = s;
            } else if (freq === minFreq) {
                const valueMap: Record<string, number> = { 'Implantes': 5, 'Ortodoncia': 4, 'Carillas': 3, 'Endodoncia': 2, 'Blanqueamiento': 1, 'Limpieza': 0 };
                if (valueMap[s] > (valueMap[opportunityService] || 0)) {
                    opportunityService = s;
                }
            }
        });

        const saturationPct = Math.round((maxFreq / competitors.length) * 100);
        const opportunityPct = 100 - Math.round(((serviceFrequency[opportunityService] || 0) / competitors.length) * 100);

        return { saturatedService, saturationPct, opportunityService, opportunityPct };
    }, [competitors]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="font-syne text-3xl font-bold bg-gradient-to-r from-electric to-premium text-transparent bg-clip-text flex items-center gap-2">
                        <MapPin className="text-electric w-8 h-8" /> Radar de Competencia
                    </h1>
                    <p className="text-clinical/60 mt-2">Analiza tu mercado local, detecta zonas saturadas y descubre oportunidades ocultas.</p>
                </div>

                <div className="flex flex-wrap items-end gap-4 bg-white/5 p-4 rounded-xl border border-white/10 w-full xl:w-auto">
                    <form onSubmit={handleCitySearch} className="flex-1 md:flex-none relative">
                        <label className="text-xs text-clinical/60 block mb-1">Ciudad / Región</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
                            <input
                                title="Campo"
                                type="text"
                                placeholder="Ciudad / Región"
                                className={`w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-electric transition-colors text-sm ${isGeocoding ? 'opacity-50' : ''}`}
                                value={searchCity}
                                onChange={(e) => setSearchCity(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                disabled={isGeocoding}
                            />
                            {isGeocoding && <span className="absolute right-3 top-2.5 w-4 h-4 rounded-full border-2 border-electric border-t-transparent animate-spin"></span>}
                        </div>
                    </form>
                    <div>
                        <label className="text-xs text-clinical/60 block mb-1">Radio (km)</label>
                        <input title="Campo" type="number"
                            value={scanRadius}
                            onChange={(e) => setScanRadius(Number(e.target.value))}
                            className="bg-cobalt border border-white/20 rounded-lg px-3 py-2 w-24 text-clinical focus:outline-none focus:border-electric"
                            min={1} max={100}
                        />
                    </div>
                    <button
                        onClick={handleAnalizarZona}
                        disabled={isScanning}
                        className="bg-electric hover:bg-electric/80 text-cobalt font-bold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isScanning ? (
                            <><span className="w-4 h-4 rounded-full border-2 border-cobalt border-t-transparent animate-spin"></span> Escaneando...</>
                        ) : "Analizar Zona"}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('mapa')}
                    className={`font-syne font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'mapa' ? 'bg-white/10 text-white' : 'text-clinical/50 hover:text-white hover:bg-white/5'}`}
                >
                    <MapPin className="w-4 h-4" /> Mapa Competitivo
                </button>
                <button
                    onClick={() => setActiveTab('notificaciones')}
                    className={`font-syne font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 relative ${activeTab === 'notificaciones' ? 'bg-white/10 text-white' : 'text-clinical/50 hover:text-white hover:bg-white/5'}`}
                >
                    <AlertTriangle className="w-4 h-4" /> Notificaciones de Nuevas Aperturas
                    {nuevasAperturas.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'mapa' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                    {/* Map View */}
                    <div className="col-span-1 lg:col-span-2 glass-panel rounded-2xl overflow-hidden relative border border-white/10 shadow-[0_0_30px_rgba(0,212,255,0.05)]">
                        {isScanning && (
                            <div className="absolute inset-0 z-[1000] pointer-events-none flex items-center justify-center bg-cobalt/20 backdrop-blur-sm">
                                <div className="w-full h-2 bg-electric/50 animate-scan absolute shadow-[0_0_20px_#00D4FF]"></div>
                                <p className="text-electric font-syne font-bold animate-pulse">Analizando sector y triangulando competidores...</p>
                            </div>
                        )}
                        <MapContainer center={[baseLocation.lat, baseLocation.lng]} zoom={13} className="w-full h-full z-0 bg-[#0A1628]">
                            <ChangeView center={[baseLocation.lat, baseLocation.lng]} />
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            />

                            {/* User Clinic Marker */}
                            {clinicProfile && (
                                <Marker position={[clinicProfile.lat, clinicProfile.lng]} icon={userClinicIcon}>
                                    <Popup className="custom-popup border-premium">
                                        <div className="font-sans text-clinical p-1">
                                            <h3 className="font-bold text-premium mb-1">Tu Clínica: {clinicProfile.nombre}</h3>
                                            <p className="text-xs text-white/70">{clinicProfile.direccion}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}

                            {competitors.map(comp => (
                                <Marker key={comp.id} position={[comp.lat, comp.lng]}>
                                    <Popup className="custom-popup">
                                        <div className="font-sans text-clinical p-1">
                                            <h3 className="font-bold text-electric mb-1">{comp.nombre}</h3>
                                            <p className="text-xs text-white/70 mb-2">{comp.direccion}</p>
                                            <div className="flex justify-between items-center text-xs border-t border-white/10 pt-2">
                                                <span className="bg-white/10 px-2 py-1 rounded">{comp.segmento}</span>
                                                <span className="text-premium">★ {comp.rating}</span>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                            {competitors.length > 0 && (
                                <Circle center={[baseLocation.lat, baseLocation.lng]} radius={searchRadius * 1000} pathOptions={{ color: '#00D4FF', fillColor: '#00D4FF', fillOpacity: 0.1 }} />
                            )}
                        </MapContainer>
                    </div>

                    {/* Gap Engine & Competitors List */}
                    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 overflow-y-auto custom-scrollbar border border-white/10">
                        <div>
                            <h3 className="font-syne text-xl text-clinical mb-4 flex items-center gap-2">
                                <ShieldCheck className="text-premium w-5 h-5" /> Gap Engine Analysis
                            </h3>
                            {competitors.length === 0 && !isScanning ? (
                                <div className="text-clinical/50 text-sm text-center py-10 bg-white/5 rounded-xl border border-white/5">
                                    Inicia un análisis para ver los insights.
                                </div>
                            ) : isScanning ? (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-20 bg-white/5 rounded-xl"></div>
                                    <div className="h-20 bg-white/5 rounded-xl"></div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-emerald-400 font-bold text-sm flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Alta Oportunidad</span>
                                            <span className="text-clinical/50 text-xs">Gap +{gapInsights?.opportunityPct || 0}%</span>
                                        </div>
                                        <p className="text-clinical text-sm">{gapInsights?.opportunityService || 'Servicios Premium'} (Baja oferta local, alto margen potencial en {searchRadius}km).</p>
                                    </div>

                                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-red-400 font-bold text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Mercado Saturado</span>
                                            <span className="text-clinical/50 text-xs">Penetración {gapInsights?.saturationPct || 0}%</span>
                                        </div>
                                        <p className="text-clinical text-sm">{gapInsights?.saturatedService || 'Servicios Generales'}. Alta competencia detectada en {searchRadius}km.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <h3 className="font-syne text-xl text-clinical mb-4">Competidores Cercanos</h3>
                            <div className="space-y-3">
                                {competitors.map(c => (
                                    <div key={c.id} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between">
                                            <h4 className="font-bold text-sm text-electric">{c.nombre}</h4>
                                            <span className="text-xs text-clinical/50">{c.distancia_km} km</span>
                                        </div>
                                        <p className="text-[11px] text-clinical/60 mt-1">{c.posicionamiento}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing Analysis Charts */}
            {
                activeTab === 'mapa' && competitors.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl border border-white/10">
                        <h3 className="font-syne text-xl mb-6">Comparativa de Precios vs Competencia (MXN)</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topServices} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickMargin={10} />
                                    <YAxis stroke="#ffffff50" fontSize={12} />
                                    <Tooltip
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{ backgroundColor: '#0A1628', borderColor: '#ffffff20', borderRadius: '12px', color: '#fff' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Promedio Local" fill="#00D4FF" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="Mi Precio" fill="#FFB800" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )
            }

            {
                activeTab === 'notificaciones' && (
                    /* Notificaciones / Live Radar Tab */
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-8 rounded-2xl border border-white/10 min-h-[500px]">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                            <div className="p-3 bg-red-500/20 rounded-xl">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h2 className="font-syne text-2xl font-bold bg-gradient-to-r from-red-500 to-white text-transparent bg-clip-text">Radar de Nuevas Aperturas</h2>
                                <p className="text-clinical/60 text-sm mt-1">Monitoreo en tiempo real de nuevos registros comerciales (Google, Directorios, Redes Sociales) en tu ciudad.</p>
                            </div>
                        </div>

                        {isScanning ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <span className="w-12 h-12 rounded-full border-4 border-electric border-t-transparent animate-spin"></span>
                                <p className="text-electric font-syne font-bold animate-pulse">Rastreando nuevos registros en internet para {baseLocation.lat === 19.4326 ? 'tu zona' : 'Playa del Carmen'}...</p>
                            </div>
                        ) : nuevasAperturas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-clinical/40">
                                <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
                                <p>No se han detectado nuevas aperturas recientemente. Intenta analizar la zona nuevamente.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {nuevasAperturas.map(apertura => (
                                    <div key={apertura.id} className="bg-white/5 border border-red-500/30 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/10 transition-colors relative overflow-hidden group">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/80 group-hover:bg-red-500 transition-colors"></div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="bg-red-500 text-white text-[9px] uppercase font-black tracking-widest px-2 py-1 rounded">ALERTA</span>
                                                <h3 className="text-lg font-bold text-white">{apertura.nombre}</h3>
                                            </div>
                                            <p className="text-sm text-clinical/70">{apertura.direccion}</p>
                                        </div>
                                        <div className="text-left md:text-right">
                                            <p className="text-xs text-clinical/50 mb-1">Detectado en: <span className="text-white font-bold">{apertura.plataforma}</span></p>
                                            <p className="text-sm font-syne font-bold text-red-400">{apertura.fechaRegistro}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )
            }
        </motion.div >
    );
};
