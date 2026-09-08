-- Exclusivamente para el clúster verificado por Seed-IsolatedDevices.ps1 -IncludeMap.
-- Posiciones ficticias; no son ubicaciones de personas.
BEGIN;
UPDATE devices SET safe_latitude = -16.3988, safe_longitude = -71.5369, safe_radius = 500
WHERE device_name = 'Dispositivo de prueba A';
INSERT INTO locations (id, device_id, latitude, longitude, accuracy, battery_level, device_model, recorded_at)
SELECT gen_random_uuid(), d.id, sample.lat, sample.lon, 8, 80, 'Modelo de prueba A',
       ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date + sample.at_time) AT TIME ZONE 'America/Lima'
FROM devices d CROSS JOIN (VALUES
    (-16.3988, -71.5369, TIME '08:00'),
    (-16.4000, -71.5350, TIME '08:20'),
    (-16.4050, -71.5320, TIME '08:30')
) AS sample(lat, lon, at_time)
WHERE d.device_name = 'Dispositivo de prueba A'
AND NOT EXISTS (SELECT 1 FROM locations l WHERE l.device_id = d.id
    AND l.recorded_at = ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date + sample.at_time) AT TIME ZONE 'America/Lima');
INSERT INTO visitas (device_id, latitud, longitud, direccion, nombre_lugar, hora_entrada, hora_salida, duracion_minutos)
SELECT d.id::text, -16.3988, -71.5369, 'Dirección ficticia para demostración', 'Estancia de prueba',
       (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date + TIME '08:00',
       (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date + TIME '08:20', 20
FROM devices d WHERE d.device_name = 'Dispositivo de prueba A'
AND NOT EXISTS (SELECT 1 FROM visitas v WHERE v.device_id = d.id::text
    AND v.hora_entrada = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date + TIME '08:00');
COMMIT;
