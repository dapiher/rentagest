// src/app/(dashboard)/viviendas/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Home, MapPin } from 'lucide-react'
import { estadoViviendaColor, LABEL_ESTADO_VIVIENDA, formatEur } from '@/lib/utils'

export default async function ViviendasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: viviendas } = await supabase
    .from('viviendas')
    .select(`
      *,
      viviendas_propietarios (
        porcentaje, es_gestor,
        propietarios (nombre)
      ),
      contratos (
        renta_mensual, estado,
        inquilinos (nombre, apellidos)
      )
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Viviendas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{viviendas?.length ?? 0} propiedades registradas</p>
        </div>
        <Link href="/viviendas/nueva" className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva vivienda
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {viviendas?.map(v => {
          const contratoActivo = (v.contratos as any[])?.find(c => c.estado === 'activo')
          const propietarios   = (v.viviendas_propietarios as any[]) ?? []

          return (
            <Link key={v.id} href={`/viviendas/${v.id}`}
              className="card hover:border-brand-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                    <Home className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{v.direccion}</p>
                    {v.piso_puerta && <p className="text-xs text-gray-400">{v.piso_puerta}</p>}
                  </div>
                </div>
                <span className={`badge ${estadoViviendaColor(v.estado)}`}>
                  {LABEL_ESTADO_VIVIENDA[v.estado]}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                <MapPin className="w-3 h-3" />
                {v.municipio}, {v.provincia}
                {v.superficie && <span className="ml-2">· {v.superficie} m²</span>}
                {v.habitaciones && <span>· {v.habitaciones} hab.</span>}
              </div>

              {contratoActivo ? (
                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {contratoActivo.inquilinos?.nombre} {contratoActivo.inquilinos?.apellidos}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatEur(contratoActivo.renta_mensual)}/mes
                  </p>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400">Sin inquilino activo</p>
                </div>
              )}

              {propietarios.length > 1 && (
                <p className="text-[10px] text-gray-400 mt-2">
                  {propietarios.length} copropietarios
                </p>
              )}
            </Link>
          )
        })}
      </div>

      {!viviendas?.length && (
        <div className="text-center py-16">
          <Home className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No hay viviendas registradas</p>
          <Link href="/viviendas/nueva" className="btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" /> Añadir primera vivienda
          </Link>
        </div>
      )}
    </div>
  )
}
