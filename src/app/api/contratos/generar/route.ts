// src/app/api/contratos/generar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarContratoPDF, buildDatosContrato } from '@/lib/contratos/generador'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { contratoId } = await request.json()
    if (!contratoId) return NextResponse.json({ error: 'contratoId requerido' }, { status: 400 })

    // Verificar que el contrato pertenece al usuario
    const { data: contrato } = await supabase
      .from('contratos')
      .select('plantilla_id, plantillas_contrato(storage_path)')
      .eq('id', contratoId)
      .eq('user_id', user.id)
      .single()

    if (!contrato) return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })

    const plantillaPath = (contrato.plantillas_contrato as any)?.storage_path
    if (!plantillaPath) {
      return NextResponse.json({ error: 'El contrato no tiene plantilla asignada' }, { status: 400 })
    }

    const datos     = await buildDatosContrato(contratoId)
    const pdfBuffer = await generarContratoPDF(contratoId, plantillaPath, datos)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="contrato_${contratoId}.pdf"`,
        'Content-Length':      pdfBuffer.length.toString(),
      },
    })
  } catch (err: any) {
    console.error('[generar-contrato]', err)
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 })
  }
}
