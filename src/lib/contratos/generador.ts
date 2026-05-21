// src/lib/contratos/generador.ts
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { createServiceClient } from '@/lib/supabase/server'
import { formatDateLong } from '@/lib/utils'
import type { DatosContrato } from '@/types'

export async function generarContratoPDF(
  contratoId: string,
  plantillaPath: string,
  datos: DatosContrato
): Promise<Buffer> {
  const supabase = createServiceClient()

  // 1. Descargar plantilla desde Supabase Storage
  const { data: plantillaBlob, error } = await supabase.storage
    .from('plantillas')
    .download(plantillaPath)

  if (error || !plantillaBlob) {
    throw new Error(`No se pudo cargar la plantilla: ${error?.message}`)
  }

  const arrayBuffer = await plantillaBlob.arrayBuffer()
  const content = Buffer.from(arrayBuffer).toString('binary')

  // 2. Rellenar plantilla con docxtemplater
  const zip = new PizZip(content)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })

  doc.render({
    ...datos,
    fecha_contrato_larga: formatDateLong(datos.fecha_contrato),
    fecha_inicio_larga:   formatDateLong(datos.fecha_inicio),
  })

  const docxBuffer = doc.getZip().generate({ type: 'nodebuffer' })

  // 3. Convertir a PDF con LibreOffice headless
  const pdfBuffer = await convertirDocxAPDF(docxBuffer)

  // 4. Subir PDF a Supabase Storage
  const userId = datos.fecha_contrato // sustituido por user_id real en la API
  const pdfPath = `${contratoId}/contrato.pdf`

  await supabase.storage
    .from('contratos')
    .upload(pdfPath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  // 5. Actualizar registro del contrato con la ruta del PDF
  await supabase
    .from('contratos')
    .update({
      pdf_path: pdfPath,
      pdf_generado_at: new Date().toISOString(),
    })
    .eq('id', contratoId)

  return pdfBuffer
}

async function convertirDocxAPDF(docxBuffer: Buffer): Promise<Buffer> {
  const { writeFileSync, readFileSync, unlinkSync } = await import('fs')
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const path = await import('path')

  const execAsync = promisify(exec)
  const tmpId   = `contrato_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const tmpDocx = `/tmp/${tmpId}.docx`
  const tmpPdf  = `/tmp/${tmpId}.pdf`

  try {
    writeFileSync(tmpDocx, docxBuffer)
    await execAsync(
      `libreoffice --headless --convert-to pdf --outdir /tmp ${tmpDocx}`,
      { timeout: 30000 }
    )
    const pdfBuffer = readFileSync(tmpPdf)
    return pdfBuffer
  } finally {
    try { unlinkSync(tmpDocx) } catch {}
    try { unlinkSync(tmpPdf)  } catch {}
  }
}

// Construir datos del contrato desde los registros de Supabase
export async function buildDatosContrato(contratoId: string): Promise<DatosContrato> {
  const supabase = createServiceClient()

  const { data: contrato } = await supabase
    .from('contratos')
    .select(`
      *,
      viviendas (
        *,
        viviendas_propietarios (
          porcentaje, es_gestor,
          propietarios (*)
        )
      ),
      inquilinos (*)
    `)
    .eq('id', contratoId)
    .single()

  if (!contrato) throw new Error('Contrato no encontrado')

  const vivienda   = contrato.viviendas
  const inquilino  = contrato.inquilinos
  const propietariosVivienda = vivienda.viviendas_propietarios ?? []
  const gestor = propietariosVivienda.find((p: any) => p.es_gestor)?.propietarios
    ?? propietariosVivienda[0]?.propietarios

  const importe_fianza = contrato.renta_mensual * 2

  return {
    fecha_contrato:            contrato.created_at.split('T')[0],
    nombre_propietario:        gestor?.nombre ?? '',
    dni_propietario:           gestor?.dni ?? '',
    direccion_propietario:     gestor?.direccion ?? '',
    propietarios: propietariosVivienda.map((p: any) => ({
      nombre:     p.propietarios.nombre,
      dni:        p.propietarios.dni ?? '',
      porcentaje: p.porcentaje,
    })),
    nombre_inquilino:          inquilino.nombre,
    apellidos_inquilino:       inquilino.apellidos,
    dni_inquilino:             inquilino.dni ?? '',
    direccion_vivienda:        `${vivienda.direccion}${vivienda.piso_puerta ? ', ' + vivienda.piso_puerta : ''}, ${vivienda.cp ?? ''} ${vivienda.municipio}, ${vivienda.provincia}`,
    referencia_catastral:      vivienda.referencia_catastral ?? '',
    superficie:                vivienda.superficie?.toString() ?? '',
    renta:                     contrato.renta_mensual.toFixed(2),
    importe_fianza:            importe_fianza.toFixed(2),
    num_mensualidades_fianza:  2,
    dia_pago:                  contrato.dia_pago,
    forma_pago:                contrato.forma_pago,
    duracion:                  contrato.duracion_meses ? `${contrato.duracion_meses} meses` : 'indefinida',
    fecha_inicio:              contrato.fecha_inicio,
    fecha_fin:                 contrato.fecha_fin ?? '',
    actualizacion:             contrato.actualizacion,
    clausula_mascotas:         contrato.clausulas?.mascotas ?? false,
    clausula_inventario:       contrato.clausulas?.inventario ?? true,
    clausula_seguro:           contrato.clausulas?.seguro ?? false,
    clausula_subarrendamiento: contrato.clausulas?.subarrendamiento ?? true,
    clausula_obras:            contrato.clausulas?.obras ?? false,
  }
}
