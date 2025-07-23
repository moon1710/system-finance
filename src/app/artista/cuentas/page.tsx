'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CompactTable } from '@table-library/react-table-library/compact'
import { useTheme } from '@table-library/react-table-library/theme'
import { getTheme } from '@table-library/react-table-library/baseline'
import { motion } from 'framer-motion'
import {
    CreditCard,
    Globe,
    MapPin,
    Plus,
    DollarSign,
    Edit,
    Trash2,
    Star,
    Search,
    RefreshCw,
} from 'lucide-react'

// Asegúrate de que la ruta de importación sea correcta
import CuentaModal from '../components/CuentaModal'

// --- INTERFACES Y TIPOS ---
interface CuentaBancaria {
    id: string
    tipoCuenta: 'nacional' | 'internacional' | 'paypal'
    nombreBanco?: string
    clabe?: string
    numeroCuenta?: string
    swift?: string
    emailPaypal?: string
    nombreTitular: string
    esPredeterminada: boolean
    createdAt: string
    // ✅ === DIRECCIONES (TRANSFORMACIÓN CLAVE) ===
}

interface MobileAccountCardProps {
    cuenta: CuentaBancaria
    onEdit: (cuenta: CuentaBancaria) => void
    onDelete: (id: string) => void
    onSetDefault: (id: string) => void
}

// --- FUNCIONES HELPERS ---
const formatInfo = (c: CuentaBancaria) => {
    if (c.tipoCuenta === 'paypal') return c.emailPaypal || '';
    const number = c.clabe || c.numeroCuenta || '';
    return `${c.nombreBanco || ''} ****${number.slice(-4)}`;
}

const getIconForType = (type: CuentaBancaria['tipoCuenta']) => {
    switch (type) {
        case 'nacional': return <MapPin className="w-5 h-5" />;
        case 'internacional': return <Globe className="w-5 h-5" />;
        case 'paypal': return <DollarSign className="w-5 h-5" />;
        default: return null;
    }
}

// --- COMPONENTE DE TARJETA PARA MÓVIL ---
const MobileAccountCard = ({ cuenta, onEdit, onDelete, onSetDefault }: MobileAccountCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-3"
    >
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    {getIconForType(cuenta.tipoCuenta)}
                </div>
                <div>
                    <p className="font-bold text-sm text-gray-800">{formatInfo(cuenta)}</p>
                    <p className="text-xs text-gray-500 capitalize">{cuenta.tipoCuenta} {cuenta.pais ? `(${cuenta.pais})` : ''}</p>
                </div>
            </div>
            {cuenta.esPredeterminada && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
        </div>
        <div>
            <p className="text-xs text-gray-500">Titular</p>
            <p className="font-medium text-gray-800">{cuenta.nombreTitular}</p>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Agregada: {new Date(cuenta.createdAt).toLocaleDateString('es-MX')}</span>
        </div>
        <div className="border-t border-gray-200 pt-3 flex justify-end items-center gap-2">
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => onEdit(cuenta)} className="p-2 text-blue-500 hover:text-blue-700">
                <Edit className="w-4 h-4" />
            </motion.button>
            {!cuenta.esPredeterminada && (
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => onSetDefault(cuenta.id)} className="p-2 text-yellow-500 hover:text-yellow-700">
                    <Star className="w-4 h-4" />
                </motion.button>
            )}
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => onDelete(cuenta.id)} className="p-2 text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
            </motion.button>
        </div>
    </motion.div>
);

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function CuentasDashboardResponsive() {
    const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCuenta, setEditingCuenta] = useState<CuentaBancaria | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [formData, setFormData] = useState<Omit<CuentaBancaria, 'id' | 'createdAt'>>({
        tipoCuenta: 'nacional',
        nombreBanco: '',
        clabe: '',
        numeroCuenta: '',
        swift: '',
        pais: '',
        emailPaypal: '',
        nombreTitular: '',
        esPredeterminada: false
    });
    const router = useRouter();

    useEffect(() => { fetchCuentas() }, []);

    const fetchCuentas = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/cuentas');
            if (!res.ok) {
                if (res.status === 401) router.push('/login');
                return;
            }
            const data = await res.json();
            setCuentas(data.cuentas || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const resetForm = () => {
        setFormData({
            tipoCuenta: 'nacional', nombreBanco: '', clabe: '', numeroCuenta: '',
            swift: '', pais: '', emailPaypal: '', nombreTitular: '', esPredeterminada: false
        });
        setEditingCuenta(null);
    }

    const handleOpenModalForCreate = () => {
        resetForm();
        setShowModal(true);
    }

    const handleOpenModalForEdit = (cuenta: CuentaBancaria) => {
        console.log('🔍 [EDIT] Cuenta original desde BD:', cuenta);

        setEditingCuenta(cuenta);

        // ✅ TRANSFORMAR DATOS PARA EL MODAL (incluyendo direcciones)
        const datosTransformados = {
            tipoCuenta: cuenta.tipoCuenta,
            nombreTitular: cuenta.nombreTitular,
            nombreBanco: cuenta.nombreBanco || '',
            esPredeterminada: cuenta.esPredeterminada,

            // Campos básicos
            clabe: cuenta.clabe || '',
            tipoCuentaNacional: cuenta.tipoCuentaNacional || '',
            numeroCuenta: cuenta.numeroCuenta || '',
            swift: cuenta.swift || '',
            codigoABA: cuenta.codigoABA || '',
            tipoCuentaInternacional: cuenta.tipoCuentaInternacional || '',
            pais: cuenta.pais || '',
            emailPaypal: cuenta.emailPaypal || '',

            // ✅ DIRECCIONES (LA PARTE QUE FALTABA)
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

        console.log('✅ [EDIT] Datos transformados para modal:', datosTransformados);

        setFormData(datosTransformados);
        setShowModal(true);
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta cuenta?')) return;
        await fetch(`/api/cuentas/${id}`, { method: 'DELETE' });
        fetchCuentas();
    }

    const handleSetDefault = async (id: string) => {
        await fetch(`/api/cuentas/${id}/predeterminada`, { method: 'PUT' });
        fetchCuentas();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingCuenta ? `/api/cuentas/${editingCuenta.id}` : '/api/cuentas';
        const method = editingCuenta ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                setShowModal(false);
                fetchCuentas();
            } else {
                alert(`Error: ${data.error || 'Ocurrió un problema.'}`);
            }
        } catch (error) {
            console.error('Fallo al enviar formulario:', error);
            alert('Error de conexión al enviar el formulario.');
        }
    }

    const renderFormFields = () => {
        const commonInputClass = "mt-1 block w-full rounded-2xl border border-gray-200 bg-white/90 shadow focus:border-blue-400 focus:ring-blue-100 px-4 py-2 text-gray-800 text-base transition";
        const commonLabelClass = "block text-sm font-semibold text-gray-700 mb-1";

        switch (formData.tipoCuenta) {
            case 'nacional':
                return (
                    <>
                        <div className="mb-5">
                            <label className={commonLabelClass}>Nombre del Banco <span className="text-blue-500">*</span></label>
                            <input type="text" required value={formData.nombreBanco} onChange={e => setFormData({ ...formData, nombreBanco: e.target.value })} className={commonInputClass} />
                        </div>
                        <div className="mb-5">
                            <label className={commonLabelClass}>CLABE <span className="text-blue-500">*</span></label>
                            <input type="text" required maxLength={18} value={formData.clabe} onChange={e => setFormData({ ...formData, clabe: e.target.value })} className={commonInputClass} />
                        </div>
                    </>
                );
            case 'internacional':
                return (
                    <>
                        <div className="mb-5">
                            <label className={commonLabelClass}>Nombre del Banco <span className="text-blue-500">*</span></label>
                            <input type="text" required value={formData.nombreBanco} onChange={e => setFormData({ ...formData, nombreBanco: e.target.value })} className={commonInputClass} />
                        </div>
                        <div className="mb-5">
                            <label className={commonLabelClass}>País <span className="text-blue-500">*</span></label>
                            <select required value={formData.pais} onChange={e => setFormData({ ...formData, pais: e.target.value })} className={commonInputClass}>
                                <option value="" disabled>Selecciona un país</option>
                                <option value="US">Estados Unidos</option>
                                <option value="CA">Canadá</option>
                                <option value="ES">España</option>
                                <option value="GB">Reino Unido</option>
                                <option value="DE">Alemania</option>
                                <option value="FR">Francia</option>
                                <option value="CO">Colombia</option>
                                <option value="AR">Argentina</option>
                                <option value="CL">Chile</option>
                                <option value="PE">Perú</option>
                                <option value="OT">Otro</option>
                            </select>
                        </div>
                        <div className="mb-5">
                            <label className={commonLabelClass}>Número de Cuenta / IBAN <span className="text-blue-500">*</span></label>
                            <input type="text" required value={formData.numeroCuenta} onChange={e => setFormData({ ...formData, numeroCuenta: e.target.value })} className={commonInputClass} />
                        </div>
                        <div className="mb-5">
                            <label className={commonLabelClass}>Código SWIFT / BIC <span className="text-blue-500">*</span></label>
                            <input type="text" required value={formData.swift} onChange={e => setFormData({ ...formData, swift: e.target.value.toUpperCase() })} className={commonInputClass} />
                        </div>
                    </>
                );
            case 'paypal':
                return (
                    <div className="mb-5">
                        <label className={commonLabelClass}>Email de PayPal <span className="text-blue-500">*</span></label>
                        <input type="email" required value={formData.emailPaypal} onChange={e => setFormData({ ...formData, emailPaypal: e.target.value })} className={commonInputClass} />
                    </div>
                );
            default:
                return null;
        }
    };

    const metrics = [
        { title: 'Total', value: cuentas.length.toString(), icon: CreditCard },
        { title: 'Nacionales', value: cuentas.filter(c => c.tipoCuenta === 'nacional').length.toString(), icon: MapPin },
        { title: 'Internacionales', value: cuentas.filter(c => c.tipoCuenta === 'internacional').length.toString(), icon: Globe },
        { title: 'PayPal', value: cuentas.filter(c => c.tipoCuenta === 'paypal').length.toString(), icon: DollarSign }
    ];

    const cuentasFiltradas = cuentas.filter(c => {
        const s = searchTerm.toLowerCase();
        return (c.nombreTitular.toLowerCase().includes(s) || c.nombreBanco?.toLowerCase().includes(s) || c.emailPaypal?.toLowerCase().includes(s))
            && (filterType === 'all' || c.tipoCuenta === filterType);
    });

    const data = { nodes: cuentasFiltradas };
    const theme = useTheme([getTheme(), {
        Table: `--data-table-library_grid-template-columns: 40px 1fr 1fr 100px 120px 120px; font-size: 13px; border-radius: 8px;`,
        Header: `position: sticky; top: 0; background-color: #2b333c; color: #f7f7f7; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; z-index: 10;`,
        BaseRow: `&:hover { background-color: #f5f5f5; }`,
        BaseCell: `padding: 12px; vertical-align: middle; border-bottom: 1px solid #e0e0e0;`,
        Body: `background-color: #ffffff;`
    }]);

    const COLUMNS = [
        { label: '', renderCell: (i: CuentaBancaria) => i.esPredeterminada ? <Star className="w-4 h-4 text-yellow-500 fill-current" /> : null },
        { label: 'Cuenta', renderCell: (i: CuentaBancaria) => <div className="flex items-center space-x-2"><div className="p-1.5 rounded bg-blue-100 text-blue-600">{getIconForType(i.tipoCuenta)}</div><div><div className="font-medium text-gray-800 text-sm">{formatInfo(i)}</div><div className="text-xs text-gray-500 capitalize">{i.tipoCuenta} {i.pais ? `(${i.pais})` : ''}</div></div></div> },
        { label: 'Titular', renderCell: (i: CuentaBancaria) => <div><div className="font-medium text-gray-800 text-sm">{i.nombreTitular}</div><div className="text-xs text-gray-500">{new Date(i.createdAt).toLocaleDateString('es-MX')}</div></div> },
        { label: 'Tipo', renderCell: (i: CuentaBancaria) => <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">{i.tipoCuenta}</span> },
        { label: 'Estado', renderCell: (i: CuentaBancaria) => <span className={`px-2 py-0.5 text-xs rounded-full ${i.esPredeterminada ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{i.esPredeterminada ? 'Predeterminada' : 'Secundaria'}</span> },
        { label: 'Acciones', renderCell: (i: CuentaBancaria) => <div className="flex space-x-1"><motion.button whileHover={{ scale: 1.1 }} onClick={() => handleOpenModalForEdit(i)}><Edit className="w-4 h-4 text-blue-500 hover:text-blue-700" /></motion.button>{!i.esPredeterminada && <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleSetDefault(i.id)}><Star className="w-4 h-4 text-yellow-500 hover:text-yellow-600" /></motion.button>}<motion.button whileHover={{ scale: 1.1 }} onClick={() => handleDelete(i.id)}><Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" /></motion.button></div> }
    ];

    if (loading) return <div className="p-4 md:p-6 animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-6"></div><div className="h-64 bg-gray-200 rounded"></div></div>;

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Cuentas</h1>
                    <p className="text-sm text-gray-500">Administra tus cuentas bancarias para recibir pagos.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <motion.button whileHover={{ scale: 1.05 }} onClick={fetchCuentas} className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-100 transition"><RefreshCw className="w-4 h-4 mr-2" />Actualizar</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={handleOpenModalForCreate} className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition"><Plus className="w-4 h-4 mr-2" />Agregar Cuenta</motion.button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, index) => (
                    <motion.div key={index} whileHover={{ y: -5 }} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition">
                        <div className="flex items-center justify-between">
                            <div className="p-2 rounded-lg bg-blue-100"><m.icon className="w-5 h-5 text-blue-600" /></div>
                            <h3 className="text-2xl font-bold text-gray-800">{m.value}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{m.title}</p>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="text" placeholder="Buscar por titular, banco, email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="all">Todos los Tipos</option>
                        <option value="nacional">Nacional</option>
                        <option value="internacional">Internacional</option>
                        <option value="paypal">PayPal</option>
                    </select>
                </div>
            </div>

            <div>
                <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                    <CompactTable columns={COLUMNS} data={data} theme={theme} />
                </div>
                <div className="block md:hidden space-y-4">
                    {cuentasFiltradas.length > 0 ? (
                        cuentasFiltradas.map(cuenta => (
                            <MobileAccountCard
                                key={cuenta.id}
                                cuenta={cuenta}
                                onEdit={handleOpenModalForEdit}
                                onDelete={handleDelete}
                                onSetDefault={handleSetDefault}
                            />
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>No se encontraron cuentas que coincidan.</p>
                        </div>
                    )}
                </div>
            </div>
            <CuentaModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                isEditing={!!editingCuenta}
            />
        </div>
    );
}