-- ============================================================
-- RentaGest — Esquema completo Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROPIETARIOS
-- ============================================================
CREATE TABLE propietarios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  dni        TEXT,
  email      TEXT,
  telefono   TEXT,
  direccion  TEXT,
  iban       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- VIVIENDAS
-- ============================================================
CREATE TABLE viviendas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  direccion             TEXT NOT NULL,
  piso_puerta           TEXT,
  municipio             TEXT NOT NULL DEFAULT 'Torrejón de Ardoz',
  provincia             TEXT NOT NULL DEFAULT 'Madrid',
  cp                    TEXT,
  referencia_catastral  TEXT,
  superficie            NUMERIC(7,2),
  habitaciones          INT,
  banos                 INT,
  descripcion           TEXT,
  estado                TEXT NOT NULL DEFAULT 'libre'
    CHECK (estado IN ('libre','alquilada','reservada','en_obras')),
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- Múltiples propietarios por vivienda
CREATE TABLE viviendas_propietarios (
  vivienda_id    UUID REFERENCES viviendas(id) ON DELETE CASCADE,
  propietario_id UUID REFERENCES propietarios(id) ON DELETE CASCADE,
  porcentaje     NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  es_gestor      BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (vivienda_id, propietario_id)
);

-- Validar que los porcentajes sumen 100 por vivienda
CREATE OR REPLACE FUNCTION check_porcentaje_vivienda()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT ABS(SUM(porcentaje) - 100)
    FROM viviendas_propietarios
    WHERE vivienda_id = NEW.vivienda_id
  ) > 0.01 THEN
    RAISE EXCEPTION 'Los porcentajes de propiedad deben sumar 100%%';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_check_porcentaje
  AFTER INSERT OR UPDATE ON viviendas_propietarios
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_porcentaje_vivienda();

-- ============================================================
-- INQUILINOS
-- ============================================================
CREATE TABLE inquilinos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  apellidos       TEXT NOT NULL,
  dni             TEXT,
  email           TEXT,
  telefono        TEXT,
  fecha_nacimiento DATE,
  nacionalidad    TEXT DEFAULT 'Española',
  ocupacion       TEXT,
  ingresos_mes    NUMERIC(10,2),
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PLANTILLAS DE CONTRATO
-- ============================================================
CREATE TABLE plantillas_contrato (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('lau_vivienda','temporada','habitacion','custom')),
  descripcion TEXT,
  storage_path TEXT NOT NULL,  -- ruta en Supabase Storage
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CONTRATOS
-- ============================================================
CREATE TABLE contratos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vivienda_id       UUID REFERENCES viviendas(id) ON DELETE RESTRICT,
  inquilino_id      UUID REFERENCES inquilinos(id) ON DELETE RESTRICT,
  plantilla_id      UUID REFERENCES plantillas_contrato(id),
  estado            TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador','activo','vencido','rescindido')),

  -- Fechas
  fecha_inicio      DATE NOT NULL,
  fecha_fin         DATE,
  duracion_meses    INT,

  -- Económico
  renta_mensual     NUMERIC(10,2) NOT NULL,
  dia_pago          INT NOT NULL DEFAULT 5 CHECK (dia_pago BETWEEN 1 AND 28),
  forma_pago        TEXT NOT NULL DEFAULT 'transferencia'
    CHECK (forma_pago IN ('transferencia','domiciliacion','efectivo')),
  actualizacion     TEXT NOT NULL DEFAULT 'ipc'
    CHECK (actualizacion IN ('ipc','irav','fijo','sin_actualizacion')),
  gastos_incluidos  TEXT[] DEFAULT '{}',

  -- Cláusulas opcionales
  clausulas         JSONB DEFAULT '{}',

  -- PDF generado
  pdf_path          TEXT,
  pdf_generado_at   TIMESTAMPTZ,

  -- Firma
  firma_estado      TEXT DEFAULT 'pendiente'
    CHECK (firma_estado IN ('pendiente','enviado','firmado','rechazado')),
  firma_at          TIMESTAMPTZ,

  notas             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contratos_updated_at
  BEFORE UPDATE ON contratos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- FIANZAS
-- ============================================================
CREATE TABLE fianzas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id     UUID REFERENCES contratos(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  importe         NUMERIC(10,2) NOT NULL,
  num_mensualidades INT NOT NULL DEFAULT 2,
  estado          TEXT NOT NULL DEFAULT 'retenida'
    CHECK (estado IN ('retenida','devuelta_parcial','devuelta_total')),
  fecha_cobro     DATE,
  fecha_devolucion DATE,
  importe_devuelto NUMERIC(10,2),
  motivo_deduccion TEXT,
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PAGOS
-- ============================================================
CREATE TABLE pagos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contrato_id     UUID REFERENCES contratos(id) ON DELETE CASCADE,
  vivienda_id     UUID REFERENCES viviendas(id),
  inquilino_id    UUID REFERENCES inquilinos(id),
  tipo            TEXT NOT NULL DEFAULT 'renta'
    CHECK (tipo IN ('renta','fianza','suministro','reparacion','otro')),
  concepto        TEXT,
  importe         NUMERIC(10,2) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago      DATE,
  estado          TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','pagado','parcial','impagado')),
  importe_pagado  NUMERIC(10,2),
  metodo_pago     TEXT,
  referencia      TEXT,
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- GASTOS (contabilidad)
-- ============================================================
CREATE TABLE gastos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vivienda_id UUID REFERENCES viviendas(id),
  categoria   TEXT NOT NULL
    CHECK (categoria IN ('reparacion','seguro','ibi','comunidad','hipoteca','suministro','gestion','otro')),
  concepto    TEXT NOT NULL,
  importe     NUMERIC(10,2) NOT NULL,
  fecha       DATE NOT NULL,
  proveedor   TEXT,
  factura_num TEXT,
  notas       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- GENERACIÓN AUTOMÁTICA DE RECIBOS MENSUALES
-- Llama a esta función el día 1 de cada mes (via cron o Edge Function)
-- ============================================================
CREATE OR REPLACE FUNCTION generar_pagos_mes(p_mes DATE DEFAULT date_trunc('month', now()))
RETURNS INT AS $$
DECLARE
  v_contrato RECORD;
  v_count    INT := 0;
BEGIN
  FOR v_contrato IN
    SELECT c.id, c.vivienda_id, c.inquilino_id, c.renta_mensual,
           c.dia_pago, c.user_id
    FROM contratos c
    WHERE c.estado = 'activo'
      AND (c.fecha_fin IS NULL OR c.fecha_fin >= p_mes)
  LOOP
    INSERT INTO pagos (
      user_id, contrato_id, vivienda_id, inquilino_id,
      tipo, concepto, importe, fecha_vencimiento, estado
    )
    VALUES (
      v_contrato.user_id,
      v_contrato.id,
      v_contrato.vivienda_id,
      v_contrato.inquilino_id,
      'renta',
      'Renta ' || to_char(p_mes, 'Month YYYY'),
      v_contrato.renta_mensual,
      (p_mes + (v_contrato.dia_pago - 1) * INTERVAL '1 day')::DATE,
      'pendiente'
    )
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY — cada usuario solo ve sus datos
-- ============================================================
ALTER TABLE propietarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE viviendas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE viviendas_propietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquilinos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_contrato   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE fianzas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos                ENABLE ROW LEVEL SECURITY;

-- Políticas: el usuario solo accede a sus propios registros
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'propietarios','viviendas','inquilinos',
    'plantillas_contrato','contratos','fianzas','pagos','gastos'
  ] LOOP
    EXECUTE format('
      CREATE POLICY "user_own_%s" ON %s
        FOR ALL USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    ', t, t);
  END LOOP;
END$$;

CREATE POLICY "user_own_vp" ON viviendas_propietarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM viviendas v
      WHERE v.id = vivienda_id AND v.user_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('plantillas', 'plantillas', false),
  ('contratos',  'contratos',  false),
  ('documentos', 'documentos', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "owner_plantillas" ON storage.objects
  FOR ALL USING (bucket_id = 'plantillas' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "owner_contratos" ON storage.objects
  FOR ALL USING (bucket_id = 'contratos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "owner_documentos" ON storage.objects
  FOR ALL USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);
