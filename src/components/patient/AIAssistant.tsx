import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Loader2, Bot, User, AlertTriangle } from 'lucide-react';
import { PatientRecordData } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    patientName: string;
    patientAge?: number;
    patientRecord: PatientRecordData | null;
    medicalHistory?: {
        alergias?: string;
        medicamentos?: string;
        enfermedades?: string;
        antecedentes?: string;
    };
}

// ─── Build system prompt from patient context ─────────────────────────────────

function buildSystemPrompt(
    patientName: string,
    patientAge: number | undefined,
    record: PatientRecordData | null,
    medHistory?: AIAssistantProps['medicalHistory'],
): string {
    const lines: string[] = [
        'Eres un asistente clínico odontológico especializado para Nümia Dental.',
        'Responde siempre en español, de forma clara, precisa y profesional.',
        'Puedes sugerir diagnósticos diferenciales, protocolos de tratamiento, medicación, y recomendaciones clínicas.',
        'IMPORTANTE: Tus respuestas son de apoyo clínico. El médico siempre toma la decisión final.',
        '',
        `## Paciente: ${patientName}${patientAge ? ` · ${patientAge} años` : ''}`,
    ];

    if (medHistory) {
        if (medHistory.alergias) lines.push(`- Alergias: ${medHistory.alergias}`);
        if (medHistory.medicamentos) lines.push(`- Medicamentos actuales: ${medHistory.medicamentos}`);
        if (medHistory.enfermedades) lines.push(`- Enfermedades sistémicas: ${medHistory.enfermedades}`);
        if (medHistory.antecedentes) lines.push(`- Antecedentes: ${medHistory.antecedentes}`);
    }

    if (record?.treatmentPlan?.items?.length) {
        const active = record.treatmentPlan.items.filter(i => i.status !== 'cancelled');
        lines.push('', `## Plan de tratamiento (${active.length} procedimientos)`);
        active.slice(0, 10).forEach(item => {
            lines.push(`- ${item.status.toUpperCase()} | ${item.name}${item.toothNumber ? ` (D${item.toothNumber})` : ''}`);
        });
    }

    if (record?.visits?.length) {
        lines.push('', `## Últimas ${Math.min(3, record.visits.length)} consultas`);
        record.visits.slice(-3).reverse().forEach(v => {
            lines.push(`- ${v.date}: ${v.chiefComplaint || 'Consulta'} — ${v.diagnosis || 'Sin diagnóstico'}`);
        });
    }

    lines.push('', 'Responde concisamente. Usa bullets cuando sea apropiado. Si detectas contraindicaciones, menciónalas primero.');
    return lines.join('\n');
}

// ─── Google Gemini fetch helper ───────────────────────────────────────────────

async function callGemini(
    messages: Message[],
    systemPrompt: string,
    onChunk: (text: string) => void,
): Promise<void> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY no configurada. Agrégala en .env y en Vercel.');

    // Convert messages to Gemini content format (assistant → model)
    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents,
                generationConfig: { maxOutputTokens: 1024 },
            }),
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${err}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;
            try {
                const json = JSON.parse(data);
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) onChunk(text);
            } catch {
                // ignore parse errors
            }
        }
    }
}

// ─── Quick prompt suggestions ──────────────────────────────────────────────────

const QUICK_PROMPTS = [
    '¿Qué precauciones debo tener con este paciente?',
    'Sugiere un protocolo de anestesia',
    'Medicación post-operatoria recomendada',
    'Diagnóstico diferencial del caso',
    'Instrucciones de higiene personalizadas',
    'Riesgo de complicaciones',
];

// ─── Component ────────────────────────────────────────────────────────────────

export const AIAssistant: React.FC<AIAssistantProps> = ({
    isOpen, onClose, patientName, patientAge, patientRecord, medicalHistory,
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const systemPrompt = buildSystemPrompt(patientName, patientAge, patientRecord, medicalHistory);

    useEffect(() => {
        if (isOpen) {
            setMessages([]);
            setInput('');
            setError(null);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const send = async (text: string) => {
        if (!text.trim() || isStreaming) return;
        setError(null);

        const userMsg: Message = { role: 'user', content: text.trim() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsStreaming(true);

        // Add empty assistant message to stream into
        const assistantMsg: Message = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, assistantMsg]);

        try {
            await callGemini(newMessages, systemPrompt, (chunk) => {
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last.role !== 'assistant') return prev;
                    return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
                });
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            setMessages(prev => prev.slice(0, -1)); // remove empty assistant msg
        } finally {
            setIsStreaming(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-[#07111d] border border-electric/20 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-[0_0_60px_rgba(0,200,255,0.08)] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-electric/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-electric/20 border border-electric/30 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-electric" />
                            </div>
                            <div>
                                <h3 className="font-syne font-bold text-white text-sm">Asistente Clínico IA</h3>
                                <p className="text-[10px] text-clinical/40">{patientName} · Gemini AI</p>
                            </div>
                        </div>
                        <button type="button" title="Cerrar" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-clinical/40 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
                                <div>
                                    <Bot className="w-12 h-12 text-electric/30 mx-auto mb-3" />
                                    <p className="text-white font-syne font-bold text-lg">Asistente Clínico</p>
                                    <p className="text-clinical/40 text-sm mt-1 max-w-xs mx-auto">
                                        Tengo acceso al expediente de <span className="text-electric">{patientName}</span>. Pregúntame sobre diagnóstico, tratamiento o medicación.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                                    {QUICK_PROMPTS.map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => send(p)}
                                            className="text-left text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-clinical/60 hover:text-white hover:bg-white/10 hover:border-electric/30 transition-all"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-electric/20 border border-electric/30' : 'bg-premium/10 border border-premium/20'}`}>
                                    {msg.role === 'user'
                                        ? <User className="w-3.5 h-3.5 text-electric" />
                                        : <Sparkles className="w-3.5 h-3.5 text-premium" />
                                    }
                                </div>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-electric/10 border border-electric/20 text-white rounded-tr-sm'
                                        : 'bg-white/5 border border-white/10 text-clinical/90 rounded-tl-sm'
                                }`}>
                                    {msg.content}
                                    {isStreaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '' && (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-electric inline-block" />
                                    )}
                                </div>
                            </div>
                        ))}

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-white/10 bg-white/3">
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={inputRef}
                                rows={2}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        send(input);
                                    }
                                }}
                                placeholder="Pregunta sobre diagnóstico, tratamiento, medicación… (Enter para enviar)"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-clinical/30 focus:outline-none focus:border-electric resize-none"
                            />
                            <button
                                type="button"
                                onClick={() => send(input)}
                                disabled={!input.trim() || isStreaming}
                                className="p-3 rounded-xl bg-electric text-cobalt font-bold disabled:opacity-30 hover:bg-electric/90 transition-all shrink-0"
                            >
                                {isStreaming
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Send className="w-4 h-4" />
                                }
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
