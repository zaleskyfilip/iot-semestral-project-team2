-- pressure will be stored, but not evaluated by default (MONITOR_ONLY)

ALTER TABLE device_config
  ALTER COLUMN pressure_mask SET DEFAULT 'MONITOR_ONLY';

UPDATE device_config
SET pressure_mask = 'MONITOR_ONLY', updated_at = now()
WHERE pressure_mask = 'ACTIVE';