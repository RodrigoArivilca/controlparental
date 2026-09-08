-- Solo se ejecuta mediante Seed-IsolatedDevices.ps1, que verifica el clúster.
-- Datos ficticios; no representan personas ni dispositivos reales.
INSERT INTO devices (id, device_name, model, android_version, role, is_online, safe_radius, created_at, last_connection)
SELECT gen_random_uuid(), sample.name, sample.model, '15', sample.role, false, 500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
    ('Dispositivo de prueba A', 'Modelo de prueba A', 'CONTROLLED'),
    ('Dispositivo de prueba B', 'Modelo de prueba B', 'ADMIN')
) AS sample(name, model, role)
WHERE NOT EXISTS (SELECT 1 FROM devices d WHERE d.device_name = sample.name);
