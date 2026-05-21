// src/app/(dashboard)/fianzas/page.tsx
import { createClient } from '@/lib/supabase/server'
import { formatEur, formatDate } from '@/lib/utils'
import { Shield, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

const ESTADO_LABEL: Record<string, string> = {
  retenida:          'Retenida',
  devuelta_parcial:  'Dev. parcial',
  devuelta_total:    'Devuelta',
}
const ESTADO_COLOR: Record<string, string> = {
  retenida:          'bg-blue-50 text-blue-800',
  devuelta_parcial:  'bg-amber-50 text-amber-800',
  devuelta_total:    'bg-green-50 text-green-800',
}

export default async function FianzasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: fianzas } = await supabase
    .from('fianzas')
    .select(`
      *,
      contratos (
        renta_mensual, fecha_inicio,
        viviendas (direccion, piso_puerta),
        inquilinos (nombre, apellidos)
      )
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const totalRetenido  = fianzas?.filter(f => f.estado === 'retenida').reduce((s, f) => s + f.importe, 0) ?? 0
  const totalDevuelto  = fianzas?.filter(f => f.estado === 'devuelta_total').reduce((s, f) => s + (f.importe_devuelto ?? f.importe), 0) ?? 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Fianzas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Depósitos y devoluciones</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500">Total retenido</span>
          </div>
          <p className="text-xl font-semibold text-blue-700">{formatEur(totalRetenido)}</p>
          <p className="text-xs text-gray-400 mt-1">{fianzas?.filter(f => f.estado === 'retenida').length} contratos</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">Devuelto</span>
          </div>
          <p className="text-xl font-semibold text-green-700">{formatEur(totalDevuelto)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-500">Devoluciones parciales</span>
          </div>
          <p className="text-xl font-semibold text-amber-700">
            {fianzas?.filter(f => f.estado === 'devuelta_parcial').length ?? 0}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Inquilino</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Vivienda</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Importe</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cobrado</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Devuelto</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {fianzas?.map(f => {
              const c = f.contratos as any
              return (
                <tr key={f.id} className="table-row">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {c?.inquilinos?.nombre} {c?.inquilinos?.apellidos}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {c?.viviendas?.direccion}
                    {c?.viviendas?.piso_puerta && ` · ${c.viviendas.piso_puerta}`}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatEur(f.importe)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {f.fecha_cobro ? formatDate(f.fecha_cobro) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {f.importe_devuelto ? formatEur(f.importe_devuelto) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${ESTADO_COLOR[f.estado]}`}>
                      {ESTADO_LABEL[f.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {f.estado === 'retenida' && (
                      <Link href={`/contratos/${f.contrato_id}`}
                        className="text-xs text-brand-600 hover:underline">
                        Gestionar
                      </Link>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!fianzas?.length && (
          <p className="text-center text-gray-400 py-10">No hay fianzas registradas</p>
        )}
      </div>
    </div>
  )
}
