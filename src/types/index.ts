// src/types/index.ts

export type EstadoVivienda = 'libre' | 'alquilada' | 'reservada' | 'en_obras'
export type EstadoContrato = 'borrador' | 'activo' | 'vencido' | 'rescindido'
export type EstadoPago     = 'pendiente' | 'pagado' | 'parcial' | 'impagado'
export type EstadoFianza   = 'retenida' | 'devuelta_parcial' | 'devuelta_total'
export type TipoPago       = 'renta' | 'fianza' | 'suministro' | 'reparacion' | 'otro'
export type TipoPlantilla  = 'lau_vivienda' | 'temporada' | 'habitacion' | 'custom'
export type FirmaEstado    = 'pendiente' | 'enviado' | 'firmado' | 'rechazado'

export interface Propietario {
  id: string
  user_id: string
  nombre: string
  dni?: string
  email?: string
  telefono?: string
  direccion?: string
  iban?: string
  created_at: string
}

export interface Vivienda {
  id: string
  user_id: string
  direccion: string
  piso_puerta?: string
  municipio: string
  provincia: string
  cp?: string
  referencia_catastral?: string
  superficie?: number
  habitaciones?: number
  banos?: number
  descripcion?: string
  estado: EstadoVivienda
  created_at: string
  // Joins opcionales
  viviendas_propietarios?: ViviendasPropietario[]
  contratos?: Contrato[]
}

export interface ViviendasPropietario {
  vivienda_id: string
  propietario_id: string
  porcentaje: number
  es_gestor: boolean
  propietarios?: Propietario
}

export interface Inquilino {
  id: string
  user_id: string
  nombre: string
  apellidos: string
  dni?: string
  email?: string
  telefono?: string
  fecha_nacimiento?: string
  nacionalidad: string
  ocupacion?: string
  ingresos_mes?: number
  notas?: string
  created_at: string
}

export interface PlantillaContrato {
  id: string
  user_id: string
  nombre: string
  tipo: TipoPlantilla
  descripcion?: string
  storage_path: string
  created_at: string
}

export interface Contrato {
  id: string
  user_id: string
  vivienda_id: string
  inquilino_id: string
  plantilla_id?: string
  estado: EstadoContrato
  fecha_inicio: string
  fecha_fin?: string
  duracion_meses?: number
  renta_mensual: number
  dia_pago: number
  forma_pago: 'transferencia' | 'domiciliacion' | 'efectivo'
  actualizacion: 'ipc' | 'irav' | 'fijo' | 'sin_actualizacion'
  gastos_incluidos: string[]
  clausulas: Record<string, boolean>
  pdf_path?: string
  pdf_generado_at?: string
  firma_estado: FirmaEstado
  firma_at?: string
  notas?: string
  created_at: string
  updated_at: string
  // Joins
  viviendas?: Vivienda
  inquilinos?: Inquilino
  fianzas?: Fianza[]
  pagos?: Pago[]
}

export interface Fianza {
  id: string
  contrato_id: string
  user_id: string
  importe: number
  num_mensualidades: number
  estado: EstadoFianza
  fecha_cobro?: string
  fecha_devolucion?: string
  importe_devuelto?: number
  motivo_deduccion?: string
  notas?: string
  created_at: string
  // Joins
  contratos?: Contrato
}

export interface Pago {
  id: string
  user_id: string
  contrato_id: string
  vivienda_id?: string
  inquilino_id?: string
  tipo: TipoPago
  concepto?: string
  importe: number
  fecha_vencimiento: string
  fecha_pago?: string
  estado: EstadoPago
  importe_pagado?: number
  metodo_pago?: string
  referencia?: string
  notas?: string
  created_at: string
  // Joins
  contratos?: Contrato
  viviendas?: Vivienda
  inquilinos?: Inquilino
}

export interface Gasto {
  id: string
  user_id: string
  vivienda_id?: string
  categoria: 'reparacion' | 'seguro' | 'ibi' | 'comunidad' | 'hipoteca' | 'suministro' | 'gestion' | 'otro'
  concepto: string
  importe: number
  fecha: string
  proveedor?: string
  factura_num?: string
  notas?: string
  created_at: string
  viviendas?: Vivienda
}

// Dashboard stats
export interface DashboardStats {
  totalViviendas: number
  viviendasAlquiladas: number
  ingresosMes: number
  ingresosAnio: number
  pagosPendientes: number
  pagosVencidos: number
  totalFianzas: number
  contratosPorVencer: number
}

// Datos para generación de contrato
export interface DatosContrato {
  fecha_contrato: string
  nombre_propietario: string
  dni_propietario: string
  direccion_propietario: string
  propietarios: { nombre: string; dni: string; porcentaje: number }[]
  nombre_inquilino: string
  apellidos_inquilino: string
  dni_inquilino: string
  direccion_vivienda: string
  referencia_catastral: string
  superficie: string
  renta: string
  importe_fianza: string
  num_mensualidades_fianza: number
  dia_pago: number
  forma_pago: string
  duracion: string
  fecha_inicio: string
  fecha_fin: string
  actualizacion: string
  // Cláusulas
  clausula_mascotas: boolean
  clausula_inventario: boolean
  clausula_seguro: boolean
  clausula_subarrendamiento: boolean
  clausula_obras: boolean
}
