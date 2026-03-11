// NOM-024-SSA3-2012 / GIIS Official Catalogs

export interface CatalogItem {
    code: string;
    description: string;
}

/** Entidades Federativas (Mexican States) per NOM-024/INEGI */
export const ENTIDADES_FEDERATIVAS = [
    { code: 'NE', name: 'Extranjero / Nacido en el Extranjero' },
    { code: 'AS', name: 'Aguascalientes' },
    { code: 'BC', name: 'Baja California' },
    { code: 'BS', name: 'Baja California Sur' },
    { code: 'CC', name: 'Campeche' },
    { code: 'CS', name: 'Chiapas' },
    { code: 'CH', name: 'Chihuahua' },
    { code: 'DF', name: 'Ciudad de México' },
    { code: 'CL', name: 'Coahuila' },
    { code: 'CM', name: 'Colima' },
    { code: 'DG', name: 'Durango' },
    { code: 'MC', name: 'Estado de México' },
    { code: 'GT', name: 'Guanajuato' },
    { code: 'GR', name: 'Guerrero' },
    { code: 'HG', name: 'Hidalgo' },
    { code: 'JC', name: 'Jalisco' },
    { code: 'MN', name: 'Michoacán' },
    { code: 'MS', name: 'Morelos' },
    { code: 'NT', name: 'Nayarit' },
    { code: 'NL', name: 'Nuevo León' },
    { code: 'OC', name: 'Oaxaca' },
    { code: 'PL', name: 'Puebla' },
    { code: 'QT', name: 'Querétaro' },
    { code: 'QR', name: 'Quintana Roo' },
    { code: 'SP', name: 'San Luis Potosí' },
    { code: 'SL', name: 'Sinaloa' },
    { code: 'SR', name: 'Sonora' },
    { code: 'TC', name: 'Tabasco' },
    { code: 'TS', name: 'Tamaulipas' },
    { code: 'TL', name: 'Tlaxcala' },
    { code: 'VZ', name: 'Veracruz' },
    { code: 'YN', name: 'Yucatán' },
    { code: 'ZS', name: 'Zacatecas' }
];

/** 
 * CIE-10 (ICD-10) Dental Related Diagnostics 
 * Full catalog would be too large for a single file, 
 * this is the 'Salud Bucal' (Oral Health) specific subset.
 */
export const CIE10_DENTAL: CatalogItem[] = [
    { code: 'K000', description: 'Anodoncia' },
    { code: 'K001', description: 'Dientes supernumerarios' },
    { code: 'K010', description: 'Dientes incluidos' },
    { code: 'K011', description: 'Dientes impactados' },
    { code: 'K020', description: 'Caries limitada al esmalte' },
    { code: 'K021', description: 'Caries de la dentina' },
    { code: 'K022', description: 'Caries del cemento' },
    { code: 'K023', description: 'Caries dentaria detenida' },
    { code: 'K024', description: 'Odontoclasia' },
    { code: 'K028', description: 'Otras caries dentales' },
    { code: 'K029', description: 'Caries dental, no especificada' },
    { code: 'K030', description: 'Atrición excesiva de los dientes' },
    { code: 'K031', description: 'Abrasión de los dientes' },
    { code: 'K032', description: 'Erosión de los dientes' },
    { code: 'K040', description: 'Pulpitis' },
    { code: 'K041', description: 'Necrosis de la pulpa' },
    { code: 'K042', description: 'Degeneración de la pulpa' },
    { code: 'K044', description: 'Periodontitis apical aguda de origen pulpar' },
    { code: 'K045', description: 'Periodontitis apical crónica' },
    { code: 'K046', description: 'Absceso periapical con fístula' },
    { code: 'K047', description: 'Absceso periapical sin fístula' },
    { code: 'K050', description: 'Gingivitis aguda' },
    { code: 'K051', description: 'Gingivitis crónica' },
    { code: 'K052', description: 'Periodontitis aguda' },
    { code: 'K053', description: 'Periodontitis crónica' },
    { code: 'K060', description: 'Retracción gingival' },
    { code: 'K061', description: 'Hiperplasia gingival' },
    { code: 'K070', description: 'Anomalías evidentes del tamaño de los maxilares' },
    { code: 'K071', description: 'Anomalías de la relación maxilomandibular' },
    { code: 'K072', description: 'Anomalías de la relación entre los arcos dentarios' },
    { code: 'K073', description: 'Anomalías de la posición de los dientes' },
    { code: 'K074', description: 'Maloclusión, no especificada' },
    { code: 'K080', description: 'Exfoliación de los dientes debida a causas sistémicas' },
    { code: 'K081', description: 'Pérdida de dientes debida a accidente, extracción o enfermedad periodontal local' },
    { code: 'K083', description: 'Raíz dental retenida' },
    { code: 'Z012', description: 'Examen dental (Revisión)' }
];
