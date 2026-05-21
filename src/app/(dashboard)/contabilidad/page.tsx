// src/app/(dashboard)/contabilidad/page.tsx
import { createClient } from '@/lib/supabase/server'
import { formatEur } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import ResumenContabilidad from './ResumenContabilidad'

export default async function ContabilidadPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const anio = new Date().getFullYear()
  const desde = `${anio}-01-01`
  const hasta = `${anio}-12-31`

  const [{ data: pagos }, { data: gastos }] = await Promise.all([
    supabase.from('pagos')
      .select('importe, importe_pagado, fecha_pago, estado, tipo')
      .eq('user_id', user!.id)
      .eq('estado', 'pagado')
      .gte('fecha_pago', desde)
      .lte('fecha_pago', hasta),
    supabase.from('gastos')
      .select('importe, fecha, categoria')
      .eq('user_id', user!.id)
      .gte('fecha', desde)
      .lte('fecha', hasta),
  ])

  const totalIngresos = pagos?.reduce((s, p) => s + (p.importe_pagado ?? p.importe), 0) ?? 0
  const totalGastos   = gastos?.reduce((s, g) => s + g.importe, 0) ?? 0
  const beneficio     = totalIngresos - totalGastos

  // Agrupar por mes
  const meses = Array.from({ length: 12 }, (_, i) => {
    const mes = String(i + 1).padStart(2, '0')
    const ingMes  = pagos?.filter(p => p.fecha_pago?.startsWith(`${anio}-${mes}`))
      .reduce((s, p) => s + (p.importe_pagado ?? p.importe), 0) ?? 0
    const gastMes = gastos?.filter(g => g.fecha?.startsWith(`${anio}-${mes}`))
      .reduce((s, g) => s + g.importe, 0) ?? 0
    return { mes: i + 1, ingresos: ingMes, gastos: gastMes }
  })

  // Gastos por categoría
  const porCategoria: Record<string, number> = {}
  gastos?.forEach(g => {
    porCategoria[g.categoria] = (porCategoria[g.categoria] ?? 0) + g.importe
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Contabilidad {anio}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ingresos, gastos y rendimiento anual</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">Ingresos {anio}</span>
          </div>
          <p className="text-xl font-semibold text-green-700">{formatEur(totalIngresos)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500">Gastos {anio}</span>
          </div>
          <p className="text-xl font-semibold text-red-700">{formatEur(totalGastos)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-brand-500" />
            <span className="text-xs text-gray-500">Beneficio neto</span>
          </div>
          <p className={`text-xl font-semibold ${beneficio >= 0 ? 'text-brand-700' : 'text-red-700'}`}>
            {formatEur(beneficio)}
          </p>
        </div>
      </div>

      <ResumenContabilidad meses={meses} porCategoria={porCategoria} />
    </div>
  )
}
