// src/app/(dashboard)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { formatEur, formatDate, estadoPagoColor, LABEL_ESTADO_PAGO } from '@/lib/utils'
import { Home, TrendingUp, AlertCircle, Shield, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: viviendas },
    { data: contratos },
    { data: pagos },
    { data: fianzas },
  ] = await Promise.all([
    supabase.from('viviendas').select('estado').eq('user_id', user!.id),
    supabase.from('contratos').select('id, estado, fecha_fin, renta_mensual, viviendas(direccion), inquilinos(nombre, apellidos)').eq('user_id', user!.id).eq('estado', 'activo'),
    supabase.from('pagos').select('*').eq('user_id', user!.id).in('estado', ['pendiente', 'impagado']).order('fecha_vencimiento', { ascending: true }).limit(8),
    supabase.from('fianzas').select('importe, estado').eq('user_id', user!.id).eq('estado', 'retenida'),
  ])

  const totalViviendas     = viviendas?.length ?? 0
  const alquiladas         = viviendas?.filter(v => v.estado === 'alquilada').length ?? 0
  const ingresosMes        = contratos?.reduce((s, c) => s + (c.renta_mensual ?? 0), 0) ?? 0
  const totalFianzas       = fianzas?.reduce((s, f) => s + (f.importe ?? 0), 0) ?? 0
  const pagosPendientes    = pagos?.length ?? 0

  const stats = [
    { label: 'Viviendas',       value: `${alquiladas}/${totalViviendas}`, sub: 'alquiladas / total', icon: Home,         color: 'text-brand-600 bg-brand-50' },
    { label: 'Ingresos/mes',    value: formatEur(ingresosMes),            sub: 'rentas activas',     icon: TrendingUp,   color: 'text-green-700 bg-green-50' },
    { label: 'Pagos pendientes',value: pagosPendientes.toString(),        sub: 'por cobrar',         icon: AlertCircle,  color: 'text-amber-700 bg-amber-50' },
    { label: 'Fianzas',         value: formatEur(totalFianzas),           sub: 'retenidas',          icon: Shield,       color: 'text-purple-700 bg-purple-50' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen de tu cartera de alquileres</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="card">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            <p className="text-[11px] text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contratos activos */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" /> Contratos activos
            </h2>
            <Link href="/contratos" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {contratos?.slice(0, 5).map(c => (
              <Link key={c.id} href={`/contratos/${c.id}`}
                className="flex items-center justify-between py-2 border-b border-gray-50 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {(c.inquilinos as any)?.nombre} {(c.inquilinos as any)?.apellidos}
                  </p>
                  <p className="text-xs text-gray-400">{(c.viviendas as any)?.direccion}</p>
                </div>
                <span className="text-sm font-medium text-gray-700">{formatEur(c.renta_mensual)}</span>
              </Link>
            ))}
            {!contratos?.length && (
              <p className="text-sm text-gray-400 py-4 text-center">No hay contratos activos</p>
            )}
          </div>
        </div>

        {/* Pagos pendientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-400" /> Pagos pendientes
            </h2>
            <Link href="/pagos" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {pagos?.slice(0, 6).map(p => (
              <div key={p.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm text-gray-900">{p.concepto ?? 'Renta'}</p>
                  <p className="text-xs text-gray-400">Vence: {formatDate(p.fecha_vencimiento)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatEur(p.importe)}</span>
                  <span className={`badge ${estadoPagoColor(p.estado)}`}>
                    {LABEL_ESTADO_PAGO[p.estado]}
                  </span>
                </div>
              </div>
            ))}
            {!pagos?.length && (
              <p className="text-sm text-gray-400 py-4 text-center">No hay pagos pendientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
