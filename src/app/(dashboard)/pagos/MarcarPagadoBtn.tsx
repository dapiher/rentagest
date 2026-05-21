// src/app/(dashboard)/pagos/MarcarPagadoBtn.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MarcarPagadoBtn({ pagoId }: { pagoId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function marcar() {
    setLoading(true)
    await supabase
      .from('pagos')
      .update({ estado: 'pagado', fecha_pago: new Date().toISOString().split('T')[0] })
      .eq('id', pagoId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button onClick={marcar} disabled={loading}
      className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium disabled:opacity-50">
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <CheckCircle className="w-3.5 h-3.5" />}
      Cobrado
    </button>
  )
}
