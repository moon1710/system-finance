// Archivo: CuentaModal.tsx - VERSIÓN COMPLETA MEJORADA
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Globe, DollarSign, User, Building, Hash, Landmark, Mail, Home, AlertTriangle, ChevronDown } from 'lucide-react'

// Importar países desde tu archivo JSON
import paisesData from '@/data/paises.json';

// --- INTERFACES ---
interface DireccionCompleta {
    direccion: string;
    ciudad: string;
    estado: string;
    codigoPostal: string;
    pais: string;
}

interface FormDataCompleta {
    tipoCuenta: 'nacional' | 'internacional' | 'paypal';
    nombreTitular: string;
    nombreBanco: string;
    esPredeterminada: boolean;

    // Nacional
    clabe: string;
    tipoCuentaNacional: 'cheques' | 'ahorros' | '';

    // Internacional
    numeroCuenta: string;
    swift: string;
    codigoABA: string;
    tipoCuentaInternacional: 'checking' | 'savings' | '';
    pais: string;

    // Direcciones
    direccionBeneficiario: DireccionCompleta;
    direccionBanco: DireccionCompleta;

    // PayPal
    emailPaypal: string;
}

interface CuentaModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: FormDataCompleta;
    setFormData: React.Dispatch<React.SetStateAction<FormDataCompleta>>;
    isEditing: boolean;
    loading?: boolean;
    error?: string;
}

const transformarCuentaParaModal = (cuenta: any) => {
    return {
        // === CAMPOS BÁSICOS ===
        tipoCuenta: cuenta.tipoCuenta || 'nacional',
        nombreTitular: cuenta.nombreTitular || '',
        nombreBanco: cuenta.nombreBanco || '',
        esPredeterminada: cuenta.esPredeterminada || false,

        // === CUENTAS NACIONALES ===
        clabe: cuenta.clabe || '',
        tipoCuentaNacional: cuenta.tipoCuentaNacional || '',

        // === CUENTAS INTERNACIONALES ===
        numeroCuenta: cuenta.numeroCuenta || '',
        swift: cuenta.swift || '',
        codigoABA: cuenta.codigoABA || '',
        tipoCuentaInternacional: cuenta.tipoCuentaInternacional || '',
        pais: cuenta.pais || '',

        // === PAYPAL ===
        emailPaypal: cuenta.emailPaypal || '',

        // ✅ === DIRECCIONES (TRANSFORMACIÓN CLAVE) ===
        direccionBeneficiario: {
            direccion: cuenta.direccionBeneficiario || '',
            ciudad: cuenta.ciudadBeneficiario || '',
            estado: cuenta.estadoBeneficiario || '',
            codigoPostal: cuenta.codigoPostalBeneficiario || '',
            pais: cuenta.paisBeneficiario || ''
        },
        direccionBanco: {
            direccion: cuenta.direccionBanco || '',
            ciudad: cuenta.ciudadBanco || '',
            estado: cuenta.estadoBanco || '',
            codigoPostal: cuenta.codigoPostalBanco || '',
            pais: cuenta.paisBanco || ''
        }
    };
};

// --- COMPONENTES INTERNOS ---
const FormInput = ({ label, icon, id, required = false, tooltip, ...props }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
            {label}
            {required && <span className="text-red-500">*</span>}
            {tooltip && (
                <div className="group relative">
                    <AlertTriangle className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 px-3 py-2 text-xs bg-gray-800 text-white rounded-lg whitespace-nowrap z-10">
                        {tooltip}
                    </div>
                </div>
            )}
        </label>
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                {icon}
            </div>
            <input
                id={id}
                className="block w-full rounded-lg border-gray-300 bg-white py-2.5 pl-10 pr-4 text-gray-800 shadow-sm transition duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                {...props}
            />
        </div>
    </div>
);

const FormSelect = ({ label, icon, id, children, required = false, ...props }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-semibold text-gray-600 mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                {icon}
            </div>
            <select
                id={id}
                className="block w-full appearance-none rounded-lg border-gray-300 bg-white py-2.5 pl-10 pr-4 text-gray-800 shadow-sm transition duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                {...props}
            >
                {children}
            </select>
        </div>
    </div>
);

const TypeSelectorButton = ({ type, label, icon, currentType, setType, badge }: any) => (
    <motion.button
        type="button"
        onClick={() => setType(type)}
        className={`p-4 w-full rounded-lg border-2 text-center transition-all duration-200 relative ${currentType === type
            ? 'bg-[#527ceb] border-[#527ceb] text-white shadow-lg'
            : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:text-[#527ceb]'
            }`}
        whileHover={{ y: currentType === type ? 0 : -2 }}
        whileTap={{ scale: 0.98 }}
    >
        {badge && (
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {badge}
            </span>
        )}
        <div className="flex flex-col items-center gap-2">
            {icon}
            <span className="font-semibold text-sm">{label}</span>
        </div>
    </motion.button>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="col-span-full mb-4 mt-6 first:mt-0">
        <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        <div className="h-px bg-gradient-to-r from-blue-500 to-transparent mt-2"></div>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
const CuentaModal: React.FC<CuentaModalProps> = ({
    show,
    onClose,
    onSubmit,
    formData,
    setFormData,
    isEditing,
    loading = false,
    error = ''
}) => {
    const [showDireccionBeneficiario, setShowDireccionBeneficiario] = useState(false);
    const [showDireccionBanco, setShowDireccionBanco] = useState(false);
    const [listaPaises, setListaPaises] = useState<{ name: string; code: string }[]>([]);

    // Cargar países desde el archivo JSON
    useEffect(() => {
        setListaPaises(paisesData);
    }, []);

    // Formatear CLABE mientras se escribe
    const formatearCLABE = (value: string) => {
        const numeros = value.replace(/\D/g, '');
        return numeros.replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 21);
    };

    const handleTypeChange = (type: 'nacional' | 'internacional' | 'paypal') => {
        setFormData(prev => ({
            ...prev,
            tipoCuenta: type,
            // Limpiar campos específicos del tipo anterior
            nombreBanco: type === 'paypal' ? '' : prev.nombreBanco,
            clabe: '',
            numeroCuenta: '',
            swift: '',
            codigoABA: '',
            emailPaypal: '',
            pais: type === 'internacional' ? prev.pais : '',
            // Resetear direcciones
            direccionBeneficiario: {
                direccion: '',
                ciudad: '',
                estado: '',
                codigoPostal: '',
                pais: ''
            },
            direccionBanco: {
                direccion: '',
                ciudad: '',
                estado: '',
                codigoPostal: '',
                pais: ''
            }
        }));
    };

    const updateDireccionBeneficiario = (field: keyof DireccionCompleta, value: string) => {
        setFormData(prev => ({
            ...prev,
            direccionBeneficiario: {
                ...prev.direccionBeneficiario,
                [field]: value
            }
        }));
    };

    const updateDireccionBanco = (field: keyof DireccionCompleta, value: string) => {
        setFormData(prev => ({
            ...prev,
            direccionBanco: {
                ...prev.direccionBanco,
                [field]: value
            }
        }));
    };

    const renderFields = () => {
        const { tipoCuenta } = formData;

        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={tipoCuenta}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mt-6"
                >
                    {/* CAMPOS NACIONALES */}
                    {tipoCuenta === 'nacional' && (
                        <>
                            <SectionHeader
                                title="Cuenta Nacional (México)"
                                subtitle="Para transferencias SPEI dentro de México"
                            />

                            <FormInput
                                label="Nombre del Banco"
                                id="nombreBanco"
                                icon={<Building className="text-gray-400 w-5 h-5" />}
                                type="text"
                                required
                                value={formData.nombreBanco}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData(prev => ({ ...prev, nombreBanco: e.target.value }))
                                }
                                placeholder="Ej: BBVA México, Santander, Banorte"
                            />

                            <FormSelect
                                label="Tipo de Cuenta"
                                id="tipoCuentaNacional"
                                icon={<DollarSign className="text-gray-400 w-5 h-5" />}
                                value={formData.tipoCuentaNacional}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    setFormData(prev => ({ ...prev, tipoCuentaNacional: e.target.value as 'cheques' | 'ahorros' | '' }))
                                }
                            >
                                <option value="">Seleccionar tipo...</option>
                                <option value="ahorros">Cuenta de Ahorros</option>
                                <option value="cheques">Cuenta de Cheques</option>
                            </FormSelect>

                            <div className="md:col-span-2">
                                <FormInput
                                    label="CLABE"
                                    id="clabe"
                                    icon={<Hash className="text-gray-400 w-5 h-5" />}
                                    type="text"
                                    required
                                    maxLength={21}
                                    value={formatearCLABE(formData.clabe)}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData(prev => ({ ...prev, clabe: e.target.value.replace(/\s/g, '') }))
                                    }
                                    placeholder="0000 0000 0000 0000 00"
                                    tooltip="18 dígitos de tu CLABE bancaria"
                                />
                            </div>
                        </>
                    )}

                    {/* CAMPOS INTERNACIONALES */}
                    {tipoCuenta === 'internacional' && (
                        <>
                            <SectionHeader
                                title="Cuenta Internacional"
                                subtitle="Para transferencias Wire Transfer globales"
                            />

                            <FormInput
                                label="Nombre del Banco"
                                id="nombreBanco"
                                icon={<Building className="text-gray-400 w-5 h-5" />}
                                type="text"
                                required
                                value={formData.nombreBanco}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData(prev => ({ ...prev, nombreBanco: e.target.value }))
                                }
                                placeholder="Ej: Wells Fargo, Chase, Royal Bank"
                            />

                            <FormSelect
                                label="País del Banco"
                                id="pais"
                                icon={<Globe className="text-gray-400 w-5 h-5" />}
                                required
                                value={formData.pais}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    setFormData(prev => ({ ...prev, pais: e.target.value }))
                                }
                            >
                                <option value="">Seleccionar país...</option>
                                {listaPaises.map(p => (
                                    <option key={p.code} value={p.code}>{p.name}</option>
                                ))}
                            </FormSelect>

                            <FormInput
                                label="Número de Cuenta / IBAN"
                                id="numeroCuenta"
                                icon={<Hash className="text-gray-400 w-5 h-5" />}
                                type="text"
                                required
                                value={formData.numeroCuenta}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData(prev => ({ ...prev, numeroCuenta: e.target.value.toUpperCase() }))
                                }
                                placeholder="Ej: DE89370400440532013000"
                                tooltip="Número de cuenta bancaria o IBAN según el país"
                            />

                            <FormInput
                                label="Código SWIFT/BIC"
                                id="swift"
                                icon={<Landmark className="text-gray-400 w-5 h-5" />}
                                type="text"
                                required
                                maxLength={11}
                                value={formData.swift}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData(prev => ({ ...prev, swift: e.target.value.toUpperCase() }))
                                }
                                placeholder="Ej: WFBIUS6S"
                                tooltip="Código internacional del banco (8-11 caracteres)"
                            />

                            {formData.pais === 'US' && (
                                <FormInput
                                    label="Código ABA (Routing Number)"
                                    id="codigoABA"
                                    icon={<Hash className="text-gray-400 w-5 h-5" />}
                                    type="text"
                                    maxLength={9}
                                    value={formData.codigoABA}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData(prev => ({ ...prev, codigoABA: e.target.value.replace(/\D/g, '') }))
                                    }
                                    placeholder="Ej: 121000248"
                                    tooltip="Solo requerido para bancos de Estados Unidos"
                                />
                            )}

                            <FormSelect
                                label="Tipo de Cuenta"
                                id="tipoCuentaInternacional"
                                icon={<DollarSign className="text-gray-400 w-5 h-5" />}
                                value={formData.tipoCuentaInternacional}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    setFormData(prev => ({ ...prev, tipoCuentaInternacional: e.target.value as 'checking' | 'savings' | '' }))
                                }
                            >
                                <option value="">Seleccionar tipo...</option>
                                <option value="checking">Checking Account</option>
                                <option value="savings">Savings Account</option>
                            </FormSelect>

                            {/* Dirección del Beneficiario */}
                            <div className="md:col-span-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowDireccionBeneficiario(!showDireccionBeneficiario)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-md bg-[#f7f7f7] text-[#21252d] hover:bg-[#f0f0f0] transition-colors font-medium"
                                >
                                    <span className="flex items-center gap-2">
                                        <Home className="w-4 h-4 text-[#7c777a]" />
                                        Dirección del Beneficiario (AML/KYC)
                                    </span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-[#7c777a] transition-transform duration-300 ${showDireccionBeneficiario ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                {showDireccionBeneficiario && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-[#f7f7f7] rounded-lg border mt-4">
                                        <div className="md:col-span-2">
                                            <FormInput
                                                label="Dirección Completa"
                                                id="direccionBeneficiario"
                                                icon={<Home className="text-gray-400 w-5 h-5" />}
                                                type="text"
                                                value={formData.direccionBeneficiario?.direccion || ''}
                                                onChange={(e) => updateDireccionBeneficiario('direccion', e.target.value)}
                                                placeholder="Calle, número, colonia"
                                            />
                                        </div>
                                        <FormInput
                                            label="Ciudad"
                                            id="ciudadBeneficiario"
                                            icon={<MapPin className="text-gray-400 w-5 h-5" />}
                                            type="text"
                                            value={formData.direccionBeneficiario?.ciudad || ''}
                                            onChange={(e) => updateDireccionBeneficiario('ciudad', e.target.value)}
                                            placeholder="Ciudad"
                                        />
                                        <FormInput
                                            label="Estado/Provincia"
                                            id="estadoBeneficiario"
                                            icon={<MapPin className="text-gray-400 w-5 h-5" />}
                                            type="text"
                                            value={formData.direccionBeneficiario?.estado || ''}
                                            onChange={(e) => updateDireccionBeneficiario('estado', e.target.value)}
                                            placeholder="Estado o Provincia"
                                        />
                                        <FormInput
                                            label="Código Postal"
                                            id="codigoPostalBeneficiario"
                                            icon={<Hash className="text-gray-400 w-5 h-5" />}
                                            type="text"
                                            value={formData.direccionBeneficiario?.codigoPostal || ''}
                                            onChange={(e) => updateDireccionBeneficiario('codigoPostal', e.target.value)}
                                            placeholder="Código Postal"
                                        />
                                        <FormInput
                                            label="País del Beneficiario"
                                            id="paisBeneficiario"
                                            icon={<Globe className="text-gray-400 w-5 h-5" />}
                                            type="text"
                                            value={formData.direccionBeneficiario?.pais || ''}
                                            onChange={(e) => updateDireccionBeneficiario('pais', e.target.value)}
                                            placeholder="País de residencia"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Dirección del Banco */}
                            <div className="md:col-span-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowDireccionBanco(!showDireccionBanco)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-md bg-[#f7f7f7] text-[#21252d] hover:bg-[#f0f0f0] transition-colors font-medium"
                                >
                                    <span className="flex items-center gap-2">
                                        <Building className="w-4 h-4 text-[#7c777a]" />
                                        Dirección del Banco
                                    </span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-[#7c777a] transition-transform duration-300 ${showDireccionBanco ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                {showDireccionBanco && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-[#f0f0f0] rounded-lg border mt-4">
                                        <div className="md:col-span-2">
                                            <FormInput
                                                label="Dirección del Banco"
                                                id="direccionBanco"
                                                icon={<Building className="text-gray-400 w-5 h-5" />}
                                                type="text"
                                                value={formData.direccionBanco?.direccion || ''}
                                                onChange={(e) => updateDireccionBanco('direccion', e.target.value)}
                                                placeholder="Dirección de la sucursal o sede principal"
                                            />
                                        </div>
                                        <FormInput
                                            label="Ciudad del Banco"
                                            id="ciudadBanco"
                                            icon={<MapPin className="text-gray-400 w-5 h-5" />}
                                            type="text"
                                            value={formData.direccionBanco?.ciudad || ''}
                                            onChange={(e) => updateDireccionBanco('ciudad', e.target.value)}
                                            placeholder="Ciudad del banco"
                                        />
                                        <FormInput
                                            label="Estado/Provincia del Banco"
                                            id="estadoBanco"
                                            icon={<MapPin className="text-gray-400 w-5 h-5" />}
                                            type="text"
                                            value={formData.direccionBanco?.estado || ''}
                                            onChange={(e) => updateDireccionBanco('estado', e.target.value)}
                                            placeholder="Estado o provincia del banco"
                                        />
                                        <FormInput
                                            label="Código Postal del Banco"
                                            id="codigoPostalBanco"
                                            icon={<Hash className="text-gray-400 w-5 h-5" />}
                                            type="text"
                                            value={formData.direccionBanco?.codigoPostal || ''}
                                            onChange={(e) => updateDireccionBanco('codigoPostal', e.target.value)}
                                            placeholder="Código postal del banco"
                                        />
                                        <FormInput
                                            label="País del Banco"
                                            id="paisBanco"
                                            icon={<Globe className="text-gray-400 w-5 h-5" />}
                                            type="text"
                                            value={formData.direccionBanco?.pais || ''}
                                            onChange={(e) => updateDireccionBanco('pais', e.target.value)}
                                            placeholder="País donde está ubicado el banco"
                                        />
                                    </div>
                                )}
                            </div>

                        </>
                    )}

                    {/* CAMPOS PAYPAL */}
                    {tipoCuenta === 'paypal' && (
                        <>
                            <SectionHeader
                                title="Cuenta PayPal"
                                subtitle="Para pagos digitales rápidos y seguros"
                            />

                            <div className="md:col-span-2">
                                <FormInput
                                    label="Email de PayPal"
                                    id="emailPaypal"
                                    icon={<Mail className="text-gray-400 w-5 h-5" />}
                                    type="email"
                                    required
                                    value={formData.emailPaypal}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData(prev => ({ ...prev, emailPaypal: e.target.value }))
                                    }
                                    placeholder="tu.email@paypal.com"
                                    tooltip="Email asociado a tu cuenta PayPal"
                                />
                            </div>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(e);
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative w-full max-w-4xl bg-gray-50 rounded-2xl shadow-xl border flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <header className="flex items-center justify-between p-6 border-b shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {isEditing ? 'Editar Cuenta Bancaria' : 'Agregar Nueva Cuenta'}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {isEditing ? 'Modifica los datos de tu cuenta' : 'Completa la información de tu nueva cuenta'}
                                </p>
                            </div>
                            <button
                                className="text-gray-500 hover:text-gray-800 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                onClick={onClose}
                                disabled={loading}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1">
                            <div className="p-6">
                                {/* Error Message */}
                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                                        <AlertTriangle className="text-red-500 w-5 h-5 flex-shrink-0" />
                                        <span className="text-red-700 text-sm">{error}</span>
                                    </div>
                                )}

                                {/* Type Selector */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <TypeSelectorButton
                                        type="nacional"
                                        label="Nacional"
                                        icon={<MapPin className="w-6 h-6" />}
                                        currentType={formData.tipoCuenta}
                                        setType={handleTypeChange}
                                        badge="SPEI"
                                    />
                                    <TypeSelectorButton
                                        type="internacional"
                                        label="Internacional"
                                        icon={<Globe className="w-6 h-6" />}
                                        currentType={formData.tipoCuenta}
                                        setType={handleTypeChange}
                                        badge="SWIFT"
                                    />
                                    <TypeSelectorButton
                                        type="paypal"
                                        label="PayPal"
                                        icon={<DollarSign className="w-6 h-6" />}
                                        currentType={formData.tipoCuenta}
                                        setType={handleTypeChange}
                                        badge="Digital"
                                    />
                                </div>

                                {/* Dynamic Fields */}
                                {renderFields()}

                                {/* Titular (Common Field) */}
                                <div className="mt-8 pt-6 border-t">
                                    <FormInput
                                        label="Nombre del Titular de la Cuenta"
                                        id="nombreTitular"
                                        icon={<User className="text-gray-400 w-5 h-5" />}
                                        type="text"
                                        required
                                        value={formData.nombreTitular}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setFormData(prev => ({ ...prev, nombreTitular: e.target.value }))
                                        }
                                        placeholder="Nombre completo como aparece en tu cuenta"
                                    />
                                </div>

                                {/* Predeterminada Checkbox */}
                                <div className="flex items-center gap-3 mt-6 bg-blue-50 p-4 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="esPredeterminada"
                                        checked={formData.esPredeterminada}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setFormData(prev => ({ ...prev, esPredeterminada: e.target.checked }))
                                        }
                                        className="h-5 w-5 rounded border-gray-300 text-[#527ceb] focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="esPredeterminada" className="font-semibold text-sm text-blue-800 cursor-pointer select-none">
                                        Establecer como cuenta predeterminada
                                        <span className="block text-xs text-[#527ceb] font-normal">
                                            Esta cuenta se usará por defecto para tus retiros
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <footer className="flex items-center justify-end gap-3 p-6 border-t bg-gray-100/50 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-6 py-2.5 text-sm font-semibold text-white bg-[#527ceb] rounded-lg hover:bg-blue-600 disabled:bg-blue-400 transition-colors min-w-[140px]"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {isEditing ? 'Actualizando...' : 'Guardando...'}
                                    </span>
                                ) : (
                                    isEditing ? 'Actualizar Cuenta' : 'Guardar Cuenta'
                                )}
                            </button>
                        </footer>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CuentaModal;