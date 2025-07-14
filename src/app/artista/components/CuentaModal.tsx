// Archivo: CuentaModal.tsx

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Globe, DollarSign, User, Building, Hash, Landmark, Mail } from 'lucide-react'
import paisesData from '@/data/paises.json' // Importa la lista de países

// --- INTERFAZ DE PROPS (SIMPLIFICADA) ---
interface CuentaModalProps {
    show: boolean
    onClose: () => void
    onSubmit: (e: React.FormEvent) => void
    formData: any
    setFormData: React.Dispatch<React.SetStateAction<any>>
    isEditing: boolean
}

// --- COMPONENTES INTERNOS REUTILIZABLES ---
const FormInput = ({ label, icon, id, ...props }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-semibold text-gray-600 mb-1.5">{label}</label>
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">{icon}</div>
            <input id={id} className="block w-full rounded-lg border-gray-300 bg-white py-2.5 pl-10 pr-4 text-gray-800 shadow-sm transition duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" {...props} />
        </div>
    </div>
)

const FormSelect = ({ label, icon, id, children, ...props }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-semibold text-gray-600 mb-1.5">{label}</label>
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">{icon}</div>
            <select id={id} className="block w-full appearance-none rounded-lg border-gray-300 bg-white py-2.5 pl-10 pr-4 text-gray-800 shadow-sm transition duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" {...props}>
                {children}
            </select>
        </div>
    </div>
)

const TypeSelectorButton = ({ type, label, icon, currentType, setType }: any) => (
    <motion.button
        type="button"
        onClick={() => setType(type)}
        className={`p-4 w-full rounded-lg border-2 text-center transition-all duration-200 ${currentType === type ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600'}`}
        whileHover={{ y: currentType === type ? 0 : -5 }}
        whileTap={{ scale: 0.98 }}
    >
        {icon}
        <span className="font-semibold mt-1 block">{label}</span>
    </motion.button>
)


// --- COMPONENTE PRINCIPAL DEL MODAL ---
const CuentaModal: React.FC<CuentaModalProps> = ({ show, onClose, onSubmit, formData, setFormData, isEditing }) => {

    const [listaPaises, setListaPaises] = useState<{ name: string; code: string }[]>([]);

    useEffect(() => {
        // Carga la lista de países desde el archivo JSON importado
        setListaPaises(paisesData);
    }, []);

    const handleTypeChange = (type: 'nacional' | 'internacional' | 'paypal') => {
        setFormData((prev: any) => ({
            ...prev,
            tipoCuenta: type,
            // Limpia campos no relevantes al cambiar de tipo para evitar datos fantasma
            nombreBanco: '', clabe: '', numeroCuenta: '', swift: '', pais: '', emailPaypal: ''
        }));
    };

    const renderFields = () => {
        const type = formData.tipoCuenta;
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mt-6"
                >
                    {type === 'nacional' && (
                        <>
                            <div className="md:col-span-2"><FormInput label="Nombre del Banco *" id="nombreBanco" icon={<Building className="text-gray-400 w-5 h-5" />} type="text" required value={formData.nombreBanco || ''} onChange={(e: any) => setFormData({ ...formData, nombreBanco: e.target.value })} /></div>
                            <div className="md:col-span-2"><FormInput label="CLABE *" id="clabe" icon={<Hash className="text-gray-400 w-5 h-5" />} type="text" required maxLength={18} value={formData.clabe || ''} onChange={(e: any) => setFormData({ ...formData, clabe: e.target.value })} /></div>
                        </>
                    )}
                    {type === 'internacional' && (
                        <>
                            <FormInput label="Nombre del Banco *" id="nombreBanco" icon={<Building className="text-gray-400 w-5 h-5" />} type="text" required value={formData.nombreBanco || ''} onChange={(e: any) => setFormData({ ...formData, nombreBanco: e.target.value })} />
                            <FormSelect label="País *" id="pais" icon={<Globe className="text-gray-400 w-5 h-5" />} required value={formData.pais || ''} onChange={(e: any) => setFormData({ ...formData, pais: e.target.value })}>
                                <option value="" disabled>Selecciona un país...</option>
                                {listaPaises.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                            </FormSelect>
                            <div className="md:col-span-2"><FormInput label="Número de Cuenta / IBAN *" id="numeroCuenta" icon={<Hash className="text-gray-400 w-5 h-5" />} type="text" required value={formData.numeroCuenta || ''} onChange={(e: any) => setFormData({ ...formData, numeroCuenta: e.target.value })} /></div>
                            <div className="md:col-span-2"><FormInput label="Código SWIFT / BIC" id="swift" icon={<Landmark className="text-gray-400 w-5 h-5" />} type="text" value={formData.swift || ''} onChange={(e: any) => setFormData({ ...formData, swift: e.target.value.toUpperCase() })} /></div>
                        </>
                    )}
                    {type === 'paypal' && (
                        <div className="md:col-span-2"><FormInput label="Email de PayPal *" id="emailPaypal" icon={<Mail className="text-gray-400 w-5 h-5" />} type="email" required value={formData.emailPaypal || ''} onChange={(e: any) => setFormData({ ...formData, emailPaypal: e.target.value })} /></div>
                    )}
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="relative w-full max-w-3xl bg-gray-50 rounded-2xl shadow-xl border flex flex-col max-h-[90vh]">
                        <header className="flex items-center justify-between p-6 border-b shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Cuenta' : 'Agregar Nueva Cuenta'}</h2>
                            <button className="text-gray-500 hover:text-gray-800" onClick={onClose}><X /></button>
                        </header>
                        <form id="main-account-form" onSubmit={onSubmit} className="p-6 overflow-y-auto" autoComplete="off">
                            <div className="grid grid-cols-3 gap-4">
                                <TypeSelectorButton type="nacional" label="Nacional" icon={<MapPin />} currentType={formData.tipoCuenta} setType={handleTypeChange} />
                                <TypeSelectorButton type="internacional" label="Internacional" icon={<Globe />} currentType={formData.tipoCuenta} setType={handleTypeChange} />
                                <TypeSelectorButton type="paypal" label="PayPal" icon={<DollarSign />} currentType={formData.tipoCuenta} setType={handleTypeChange} />
                            </div>

                            {renderFields()}

                            <div className="md:col-span-2 mt-6 pt-6 border-t">
                                <FormInput label="Nombre del Titular de la Cuenta *" id="nombreTitular" icon={<User className="text-gray-400 w-5 h-5" />} type="text" required value={formData.nombreTitular || ''} onChange={(e: any) => setFormData({ ...formData, nombreTitular: e.target.value })} />
                            </div>
                            <div className="flex items-center gap-3 mt-4 bg-blue-50 p-3 rounded-lg">
                                <input type="checkbox" id="esPredeterminada" checked={formData.esPredeterminada || false} onChange={(e: any) => setFormData({ ...formData, esPredeterminada: e.target.checked })} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                <label htmlFor="esPredeterminada" className="font-semibold text-sm text-blue-800 cursor-pointer select-none">Establecer como cuenta predeterminada</label>
                            </div>
                        </form>
                        <footer className="flex items-center justify-end gap-3 p-4 border-t bg-gray-100/50 shrink-0">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border rounded-lg hover:bg-gray-100">Cancelar</button>
                            <button type="submit" form="main-account-form" className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"> {isEditing ? 'Actualizar Cuenta' : 'Guardar Cuenta'}</button>
                        </footer>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CuentaModal;