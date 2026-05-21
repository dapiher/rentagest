// src/app/(dashboard)/viviendas/nueva/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface PropietarioForm {
  nombre: string
  dni: string
  email: string
  telefono: string
  iban: string
  porcentaje: number
  es_gestor: boolean
}

const PROP_EMPTY: PropietarioForm = {
  nombre: '', dni: '', email: '', telefono: '', iban: '', porcentaje: 100, es_gestor: true
}

export default function NuevaViviendaPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Datos vivienda
  const [form, setForm] = useState({
    direccion: '', piso_puerta: '', municipio: 'Torrejón de Ardoz',
    provincia: 'Madrid', cp: '', referencia_catastral: '',
    superficie: '', habitaciones: '', banos: '', descripcion: '',
  })

  // Propietarios
  const [propietarios, setPropietarios] = useState<PropietarioForm[]>([{ ...PROP_EMPTY }])

  function updateProp(idx: number, key: keyof PropietarioForm, value: string | number | boolean) {
    setPropietarios(prev => prev.map((p, i) => i === idx ? { ...p, [key]: value } : p))
  }

  function addPropietario() {
    const resto = 100 - propietarios.reduce((s, p) => s + p.porcentaje, 0)
    setPropietarios(prev => [...prev, { ...PROP_EMPTY, porcentaje: Math.max(0, resto), es_gestor: false }])
  }

  function removePropietario(idx: number) {
    if (propietarios.length === 1) return
    setPropietarios(prev => prev.filter((_, i) => i !== idx))
  }

  function setGestor(idx: number) {
    setPropietarios(prev => prev.map((p, i) => ({ ...p, es_gestor: i === idx })))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const sumaPct = propietarios.reduce((s, p) => s + Number(p.porcentaje), 0)
    if (Math.abs(sumaPct - 100) > 0.01) {
      setError(`Los porcentajes suman ${sumaPct.toFixed(1)}%, deben sumar 100%`)
      return
    }
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Insertar vivienda
      const { data: vivienda, error: errV } = await supabase
        .from('viviendas')
        .insert({
          ...form,
          user_id: user!.id,
          superficie:   form.superficie   ? Number(form.superficie)   : null,
          habitaciones: form.habitaciones ? Number(form.habitaciones) : null,
          banos:        form.banos        ? Number(form.banos)        : null,
        })
        .select()
        .single()

      if (errV) throw errV

      // 2. Insertar o recuperar propietarios y vincular
      for (const p of propietarios) {
        // Buscar si ya existe por DNI
        let propietarioId: string
        const { data: existing } = await supabase
          .from('propietarios')
          .select('id')
          .eq('user_id', user!.id)
          .eq('dni', p.dni)
          .maybeSingle()

        if (existing) {
          propietarioId = existing.id
        } else {
          const { data: nuevo, error: errP } = await supabase
            .from('propietarios')
            .insert({ user_id: user!.id, nombre: p.nombre, dni: p.dni, email: p.email, telefono: p.telefono, iban: p.iban })
            .select('id')
            .single()
          if (errP) throw errP
          propietarioId = nuevo.id
        }

        await supabase.from('viviendas_propietarios').insert({
          vivienda_id:    vivienda.id,
          propietario_id: propietarioId,
          porcentaje:     Number(p.porcentaje),
          es_gestor:      p.es_gestor,
        })
      }

      router.push(`/viviendas/${vivienda.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar la vivienda')
      setLoading(false)
    }
  }

  const pctTotal = propietarios.reduce((s, p) => s + Number(p.porcentaje), 0)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/viviendas" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Nueva vivienda</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Datos vivienda */}
        <div className="card space-y-4">
          <h2 className="text-sm font-medium text-gray-900">Datos de la vivienda</h2>
          <div>
            <label className="label">Dirección *</label>
            <input className="input" required value={form.direccion}
              onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
              placeholder="Calle Mayor, 12" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Piso / Puerta</label>
              <input className="input" value={form.piso_puerta}
                onChange={e => setForm(f => ({ ...f, piso_puerta: e.target.value }))}
                placeholder="3ºA" />
            </div>
            <div>
              <label className="label">C.P.</label>
              <input className="input" value={form.cp}
                onChange={e => setForm(f => ({ ...f, cp: e.target.value }))}
                placeholder="28850" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Municipio *</label>
              <input className="input" required value={form.municipio}
                onChange={e => setForm(f => ({ ...f, municipio: e.target.value }))} />
            </div>
            <div>
              <label className="label">Provincia *</label>
              <input className="input" required value={form.provincia}
                onChange={e => setForm(f => ({ ...f, provincia: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Referencia catastral</label>
            <input className="input" value={form.referencia_catastral}
              onChange={e => setForm(f => ({ ...f, referencia_catastral: e.target.value }))}
              placeholder="2847391TK6024N0004FG" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Superficie (m²)</label>
              <input className="input" type="number" value={form.superficie}
                onChange={e => setForm(f => ({ ...f, superficie: e.target.value }))} placeholder="75" />
            </div>
            <div>
              <label className="label">Habitaciones</label>
              <input className="input" type="number" value={form.habitaciones}
                onChange={e => setForm(f => ({ ...f, habitaciones: e.target.value }))} placeholder="3" />
            </div>
            <div>
              <label className="label">Baños</label>
              <input className="input" type="number" value={form.banos}
                onChange={e => setForm(f => ({ ...f, banos: e.target.value }))} placeholder="1" />
            </div>
          </div>
        </div>

        {/* Propietarios */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Propietarios</h2>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${Math.abs(pctTotal - 100) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                {pctTotal.toFixed(1)}% asignado
              </span>
              <button type="button" onClick={addPropietario} className="btn-secondary text-xs py-1 px-2.5">
                <Plus className="w-3 h-3" /> Añadir
              </button>
            </div>
          </div>

          {propietarios.map((p, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-gray-600">Propietario {idx + 1}</p>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input type="radio" name="gestor" checked={p.es_gestor}
                      onChange={() => setGestor(idx)} className="accent-brand-600" />
                    Gestor principal
                  </label>
                  {propietarios.length > 1 && (
                    <button type="button" onClick={() => removePropietario(idx)}
                      className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nombre completo *</label>
                  <input className="input bg-white" required value={p.nombre}
                    onChange={e => updateProp(idx, 'nombre', e.target.value)} placeholder="Juan García López" />
                </div>
                <div>
                  <label className="label">DNI / NIF</label>
                  <input className="input bg-white" value={p.dni}
                    onChange={e => updateProp(idx, 'dni', e.target.value)} placeholder="12345678A" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input bg-white" type="email" value={p.email}
                    onChange={e => updateProp(idx, 'email', e.target.value)} />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input className="input bg-white" value={p.telefono}
                    onChange={e => updateProp(idx, 'telefono', e.target.value)} />
                </div>
                <div>
                  <label className="label">IBAN (para reparto)</label>
                  <input className="input bg-white" value={p.iban}
                    onChange={e => updateProp(idx, 'iban', e.target.value)} placeholder="ES91 2100 0418 45..." />
                </div>
                <div>
                  <label className="label">% de propiedad</label>
                  <input className="input bg-white" type="number" min="0" max="100" step="0.01"
                    value={p.porcentaje}
                    onChange={e => updateProp(idx, 'porcentaje', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <Link href="/viviendas" className="btn-secondary">Cancelar</Link>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Guardando...' : 'Guardar vivienda'}
          </button>
        </div>
      </form>
    </div>
  )
}
