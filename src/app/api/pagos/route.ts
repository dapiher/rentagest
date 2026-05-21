// src/app/api/pagos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/pagos  →  genera recibos del mes para todos los contratos activos
// Llamar desde un cron job en Railway el día 1 de cada mes
export async function POST(request: NextRequest) {
  // Verificar clave de cron
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('generar_pagos_mes')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ generados: data })
}
