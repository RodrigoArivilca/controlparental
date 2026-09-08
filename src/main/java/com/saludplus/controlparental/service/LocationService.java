package com.saludplus.controlparental.service;

import com.saludplus.controlparental.model.Device;
import com.saludplus.controlparental.model.Location;
import com.saludplus.controlparental.repository.LocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.List;
import java.util.UUID;

@Service
public class LocationService {

    @Autowired
    private LocationRepository locationRepository;

    private static final int RADIO_TIERRA_METROS = 6371000;

    // Definimos el offset de Perú para que todas las consultas sean consistentes
    private static final ZoneOffset PERU_OFFSET = ZoneOffset.of("-05:00");

    public Location guardarUbicacion(Location location) {
        Device device = location.getDevice();

        if (device != null && device.getSafeLatitude() != null && device.getSafeLongitude() != null) {
            double distancia = calcularDistancia(
                    device.getSafeLatitude(),
                    device.getSafeLongitude(),
                    location.getLatitude(),
                    location.getLongitude()
            );

            double radioPermitido = (device.getSafeRadius() != null) ? device.getSafeRadius() : 500.0;

            System.out.println("--- Verificación de Posición Habitual ---");
            System.out.println("Dispositivo: " + device.getDeviceName());
            System.out.println("Distancia al centro marcado: " + String.format("%.2f", distancia) + " metros.");

            if (distancia > radioPermitido) {
                System.err.println("⚠️ ALERTA CRÍTICA: El dispositivo ha SALIDO de su zona habitual establecida.");
            } else {
                System.out.println("✅ Estado: El niño se encuentra en su zona segura.");
            }
            System.out.println("-----------------------------------------");
        }

        return locationRepository.save(location);
    }

    public List<Location> obtenerHistorial(UUID deviceId) {
        return locationRepository.findByDeviceIdOrderByRecordedAtDesc(deviceId);
    }

    /**
     * CORREGIDO: Ahora usa OffsetDateTime para evitar el error de tipos en Hibernate
     */
    public List<Location> obtenerHistorialPorFecha(UUID deviceId, LocalDate date) {
        // Convertimos LocalDate a OffsetDateTime definiendo el inicio y fin del día real
        OffsetDateTime inicioDia = date.atStartOfDay().atOffset(PERU_OFFSET);
        OffsetDateTime finDia = date.atTime(LocalTime.MAX).atOffset(PERU_OFFSET);

        return locationRepository.findByDeviceIdAndRecordedAtBetweenOrderByRecordedAtAsc(
                deviceId, inicioDia, finDia
        );
    }

    private double calcularDistancia(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return RADIO_TIERRA_METROS * c;
    }
}
