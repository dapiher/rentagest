// src/app/(dashboard)/pagos/page.tsx
import { createClient } from '@/lib/supabase/server'
import { formatEur, formatDate, estadoPagoColor, LABEL_ESTADO_PAGO } from '@/lib/utils'
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import MarcarPagadoBtn from './MarcarPagadoBtn'

export default async function PagosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pagos } = await supabase
    .from('pagos')
    .select(`
      *,
      viviendas (direccion, piso_puerta),
      inquilinos (nombre, apellidos)
    `)
    .eq('user_id', user!.id)
    .order('fecha_vencimiento', { ascending: false })
    .limit(100)

  const totalPendiente = pagos?.filter(p => p.estado === 'pendiente' || p.estado === 'impagado')
    .reduce((s, p) => s + p.importe, 0) ?? 0
  const totalCobrado = pagos?.filter(p => p.estado === 'pagado')
    .reduce((s, p) => s + (p.importe_pagado ?? p.importe), 0) ?? 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pagos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control de rentas y cobros</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-500">Pendiente de cobro</span>
          </div>
          <p className="text-xl font-semibold text-amber-700">{formatEur(totalPendiente)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">Cobrado este año</span>
          </div>
          <p className="text-xl font-semibold text-green-700">{formatEur(totalCobrado)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500">Impagados</span>
          </div>
          <p className="text-xl font-semibold text-red-700">
            {pagos?.filter(p => p.estado === 'impagado').length ?? 0}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Inquilino</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Vivienda</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Concepto</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Vencimiento</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Importe</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pagos?.map(p => (
              <tr key={p.id} className="table-row">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {(p.inquilinos as any)?.nombre} {(p.inquilinos as any)?.apellidos}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {(p.viviendas as any)?.direccion}
                  {(p.viviendas as any)?.piso_puerta && ` · ${(p.viviendas as any).piso_puerta}`}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.concepto ?? 'Renta mensual'}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(p.fecha_vencimiento)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatEur(p.importe)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`badge ${estadoPagoColor(p.estado)}`}>
                    {LABEL_ESTADO_PAGO[p.estado]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.estado === 'pendiente' && <MarcarPagadoBtn pagoId={p.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!pagos?.length && (
          <p className="text-center text-gray-400 py-10">No hay pagos registrados</p>
        )}
      </div>
    </div>
  )
}
