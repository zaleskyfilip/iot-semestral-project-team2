CREATE DOMAIN operating_mode AS text
  CONSTRAINT operating_mode_values
  CHECK (VALUE IN ('DeepFocus', 'StandardOffice', 'VentilationAssist', 'NightMode'));

CREATE DOMAIN sensor_mask AS text
  CONSTRAINT sensor_mask_values
  CHECK (VALUE IN ('ACTIVE', 'MONITOR_ONLY'));

CREATE DOMAIN sensor_state AS text
  CONSTRAINT sensor_state_values
  CHECK (VALUE IN ('OK', 'WARN', 'CRIT'));

CREATE TABLE station (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  name          varchar(100) NOT NULL,
  status        text NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE')),
  last_seen_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE device_config (
  id                uuid PRIMARY KEY DEFAULT uuidv7(),
  station_id        uuid NOT NULL UNIQUE REFERENCES station (id) ON DELETE CASCADE,
  operating_mode    operating_mode NOT NULL DEFAULT 'StandardOffice',
  co2_mask          sensor_mask NOT NULL DEFAULT 'ACTIVE',
  voc_mask          sensor_mask NOT NULL DEFAULT 'ACTIVE',
  pm25_mask         sensor_mask NOT NULL DEFAULT 'ACTIVE',
  temperature_mask  sensor_mask NOT NULL DEFAULT 'ACTIVE',
  humidity_mask     sensor_mask NOT NULL DEFAULT 'ACTIVE',
  light_mask        sensor_mask NOT NULL DEFAULT 'ACTIVE',
  pressure_mask     sensor_mask NOT NULL DEFAULT 'ACTIVE',
  co2_warn          integer NOT NULL DEFAULT 900,
  co2_crit          integer NOT NULL DEFAULT 1300,
  schedule          jsonb NOT NULL DEFAULT '[]',
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (co2_warn < co2_crit),
  CHECK (jsonb_typeof(schedule) = 'array' AND jsonb_array_length(schedule) <= 10)
);

CREATE TABLE telemetry (
  id                 uuid PRIMARY KEY DEFAULT uuidv7(),
  station_id         uuid NOT NULL REFERENCES station (id) ON DELETE CASCADE,
  measured_at        timestamptz NOT NULL,
  mode               operating_mode,
  co2                real NOT NULL,
  voc                real NOT NULL,
  pm25               real NOT NULL,
  temperature        real NOT NULL,
  humidity           real NOT NULL,
  light              real NOT NULL,
  pressure           real NOT NULL,
  co2_state          sensor_state,
  voc_state          sensor_state,
  pm25_state         sensor_state,
  temperature_state  sensor_state,
  humidity_state     sensor_state,
  light_state        sensor_state,
  pressure_state     sensor_state,
  focus_readiness    smallint CHECK (focus_readiness BETWEEN 0 AND 100),
  health_comfort     smallint CHECK (health_comfort BETWEEN 0 AND 100),
  insights           text[] NOT NULL DEFAULT '{}' CHECK (cardinality(insights) <= 10),
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (station_id, measured_at)
);