// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { format, parseISO, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy', { locale: es })
}

export function formatDateLong(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: es })
}

export function diasHastaVencimiento(fecha: string): number {
  return differenceInDays(parseISO(fecha), new Date())
}

export function estadoPagoColor(estado: string): string {
  const map: Record<string, string> = {
    pagado:    'bg-green-50 text-green-800',
    pendiente: 'bg-amber-50 text-amber-800',
    impagado:  'bg-red-50 text-red-800',
    parcial:   'bg-blue-50 text-blue-800',
  }
  return map[estado] ?? 'bg-gray-50 text-gray-800'
}

export function estadoViviendaColor(estado: string): string {
  const map: Record<string, string> = {
    alquilada: 'bg-green-50 text-green-800',
    libre:     'bg-gray-50 text-gray-700',
    reservada: 'bg-blue-50 text-blue-800',
    en_obras:  'bg-amber-50 text-amber-800',
  }
  return map[estado] ?? 'bg-gray-50 text-gray-700'
}

export function estadoContratoColor(estado: string): string {
  const map: Record<string, string> = {
    activo:     'bg-green-50 text-green-800',
    borrador:   'bg-gray-50 text-gray-700',
    vencido:    'bg-red-50 text-red-800',
    rescindido: 'bg-red-50 text-red-800',
  }
  return map[estado] ?? 'bg-gray-50 text-gray-700'
}

export const LABEL_ESTADO_VIVIENDA: Record<string, string> = {
  libre:     'Libre',
  alquilada: 'Alquilada',
  reservada: 'Reservada',
  en_obras:  'En obras',
}

export const LABEL_ESTADO_PAGO: Record<string, string> = {
  pendiente: 'Pendiente',
  pagado:    'Pagado',
  parcial:   'Parcial',
  impagado:  'Impagado',
}

export const LABEL_ESTADO_CONTRATO: Record<string, string> = {
  borrador:   'Borrador',
  activo:     'Activo',
  vencido:    'Vencido',
  rescindido: 'Rescindido',
}
