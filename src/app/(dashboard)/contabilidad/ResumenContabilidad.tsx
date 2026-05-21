// src/app/(dashboard)/contabilidad/ResumenContabilidad.tsx
'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatEur } from '@/lib/utils'

const MESES_LABEL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const CAT_LABEL: Record<string, string> = {
  reparacion: 'Reparaciones', seguro: 'Seguro', ibi: 'IBI',
  comunidad: 'Comunidad', hipoteca: 'Hipoteca', suministro: 'Suministros',
  gestion: 'Gestión', otro: 'Otros',
}

export default function ResumenContabilidad({
  meses, porCategoria
}: {
  meses: { mes: number; ingresos: number; gastos: number }[]
  porCategoria: Record<string, number>
}) {
  const data = meses.map(m => ({
    name:     MESES_LABEL[m.mes - 1],
    Ingresos: Math.round(m.ingresos),
    Gastos:   Math.round(m.gastos),
  }))

  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Ingresos vs Gastos por mes</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v/1000).toFixed(0)}k€`} />
            <Tooltip formatter={(v: number) => formatEur(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Ingresos" fill="#185fa5" radius={[4,4,0,0]} />
            <Bar dataKey="Gastos"   fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {Object.keys(porCategoria).length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Gastos por categoría</h2>
          <div className="space-y-2">
            {Object.entries(porCategoria)
              .sort(([,a],[,b]) => b - a)
              .map(([cat, importe]) => {
                const max = Math.max(...Object.values(porCategoria))
                const pct = (importe / max) * 100
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-24 flex-shrink-0">{CAT_LABEL[cat] ?? cat}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-20 text-right">{formatEur(importe)}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
