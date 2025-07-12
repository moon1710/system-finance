'use client'

import React from 'react'

interface CuentaModalProps {
    show: boolean
    onClose: () => void
    onSubmit: (e: React.FormEvent) => void
    editingCuenta: any
    formData: any
    setFormData: any
    renderFormFields: () => React.ReactNode
    isEditing: boolean
}

const CuentaModal: React.FC<CuentaModalProps> = ({
    show,
    onClose,
    onSubmit,
    editingCuenta,
    formData,
    setFormData,
    renderFormFields,
    isEditing,
}) => {
    if (!show) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg mx-2 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-100 p-0 overflow-hidden animate-fadeIn">
                {/* HEADER */}
                <div className="flex items-center justify-between px-8 pt-8 pb-2">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        {isEditing ? 'Editar Cuenta' : 'Agregar Nueva Cuenta'}
                    </h2>
                    <button
                        className="text-3xl text-gray-400 hover:text-gray-800 transition rounded-xl focus:outline-none"
                        onClick={onClose}
                        title="Cerrar"
                        tabIndex={0}
                    >
                        &times;
                    </button>
                </div>
                {/* LÍNEA SUTIL */}
                <div className="h-[2px] bg-gradient-to-r from-blue-100 via-gray-100 to-blue-100 opacity-60 mb-2"></div>
                {/* FORM */}
                <form
                    onSubmit={onSubmit}
                    className="px-8 pb-8 pt-2 flex flex-col gap-2"
                    autoComplete="off"
                >
                    {/* Tipo de cuenta */}
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Tipo de Cuenta <span className="text-blue-500 font-bold">*</span>
                        </label>
                        <select
                            value={formData.tipoCuenta}
                            onChange={(e) => {
                                const nuevoTipo = e.target.value as 'nacional' | 'internacional' | 'paypal'
                                setFormData({
                                    tipoCuenta: nuevoTipo,
                                    nombreBanco: '',
                                    clabe: '',
                                    numeroRuta: '',
                                    numeroCuenta: '',
                                    swift: '',
                                    emailPaypal: '',
                                    nombreTitular: formData.nombreTitular,
                                    esPredeterminada: formData.esPredeterminada,
                                })
                            }}
                            className="mt-1 block w-full rounded-2xl border border-gray-200 bg-white/90 shadow focus:border-blue-400 focus:ring-blue-100 px-4 py-2 text-gray-700 text-base transition"
                        >
                            <option value="nacional">Nacional (México)</option>
                            <option value="internacional">Internacional (USA y otros)</option>
                            <option value="paypal">PayPal</option>
                        </select>
                    </div>

                    {/* Campos dinámicos */}
                    <div>{renderFormFields()}</div>

                    {/* Nombre titular */}
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Nombre del Titular <span className="text-blue-500 font-bold">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.nombreTitular}
                            onChange={(e) => setFormData({ ...formData, nombreTitular: e.target.value })}
                            className="mt-1 block w-full rounded-2xl border border-gray-200 bg-white/90 shadow focus:border-blue-400 focus:ring-blue-100 px-4 py-2 text-gray-800 text-base transition"
                            placeholder="Nombre completo del titular"
                        />
                    </div>
                    {/* Checkbox predeterminada */}
                    <div className="mb-8 flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.esPredeterminada}
                            onChange={(e) => setFormData({ ...formData, esPredeterminada: e.target.checked })}
                            className="rounded border-gray-300 focus:ring-blue-400 accent-blue-600 w-5 h-5"
                            id="predeterminada"
                        />
                        <label htmlFor="predeterminada" className="text-base text-gray-700 cursor-pointer select-none">
                            Establecer como cuenta predeterminada
                        </label>
                    </div>
                    {/* Acciones */}
                    <div className="flex flex-row-reverse gap-3 mt-3">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 transition text-white font-semibold rounded-2xl shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            {isEditing ? 'Actualizar' : 'Crear'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 transition text-gray-700 font-semibold rounded-2xl shadow focus:outline-none"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CuentaModal
