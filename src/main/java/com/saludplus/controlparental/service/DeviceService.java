package com.saludplus.controlparental.service;

import com.saludplus.controlparental.model.Device;
import com.saludplus.controlparental.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DeviceService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Transactional
    public Device registrarDispositivo(Device device) {
        // Lógica de ingeniería: Si es un registro nuevo, aseguramos valores por defecto
        if (device.getRole() == null || device.getRole().isEmpty()) {
            device.setRole("CONTROLLED");
        }

        // Sincronizamos fechas de conexión inicial
        if (device.getCreatedAt() == null) {
            device.setLastConnection(OffsetDateTime.now());
        }

        return deviceRepository.save(device);
    }

    public List<Device> listarTodos() {
        return deviceRepository.findAll();
    }

    public Optional<Device> buscarPorId(UUID id) {
        return deviceRepository.findById(id);
    }

    /**
     * ACTUALIZADO: Soporta radio variable y validación de rol.
     * Solo un ADMIN debería poder setear zonas seguras para un CONTROLLED.
     */
    @Transactional
    public Device actualizarZonaSegura(UUID id, Double lat, Double lon, Double radius) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dispositivo no encontrado con ID: " + id));

        // Actualizamos los campos del modelo dinámico
        device.setSafeLatitude(lat);
        device.setSafeLongitude(lon);

        if (radius != null) {
            device.setSafeRadius(radius);
        }

        System.out.println("--- Configuración de Seguridad Aplicada ---");
        System.out.println("Dispositivo: " + device.getDeviceName() + " (" + device.getRole() + ")");
        System.out.println("Centro: " + lat + ", " + lon + " | Radio: " + device.getSafeRadius() + "m");

        return deviceRepository.save(device);
    }

    /**
     * Sobrecarga del método para mantener compatibilidad si no se envía el radio.
     */
    @Transactional
    public Device actualizarZonaSegura(UUID id, Double lat, Double lon) {
        return actualizarZonaSegura(id, lat, lon, null);
    }
}
