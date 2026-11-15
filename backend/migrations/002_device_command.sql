CREATE TABLE device_command (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  station_id    uuid NOT NULL REFERENCES station (id) ON DELETE CASCADE,
  action        text NOT NULL
                  CONSTRAINT device_command_action_values
                  CHECK (action IN ('SET_MODE', 'TEST_LED', 'TEST_BUZZER')),
  payload       jsonb NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'PENDING'
                  CONSTRAINT device_command_status_values
                  CHECK (status IN ('PENDING', 'DELIVERED')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  delivered_at  timestamptz
);