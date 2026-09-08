package com.saludplus.controlparental.controller;

import com.saludplus.controlparental.model.Device;
import com.saludplus.controlparental.service.DeviceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/devices")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class DeviceController {

    @Autowired
    private DeviceService deviceService;

    // Endpoint para registrar el celular (Padre o Hijo)
    @PostMapping("/register")
    public ResponseEntity<Device> register(@RequestBody Device device) {
        Device nuevoDispositivo = deviceService.registrarDispositivo(device);
        return ResponseEntity.ok(nuevoDispositivo);
    }

    // Endpoint para ver todos los celulares registrados (Útil para el mapa del Admin)
    @GetMapping
    public List<Device> getAll() {
        return deviceService.listarTodos();
    }

    /**
     * NUEVO: Obtener un dispositivo específico por su UUID.
     * Fundamental para que la App de Android verifique su propio ROL al iniciar.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Device> getById(@PathVariable UUID id) {
        return deviceService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * ACTUALIZADO: Actualiza la zona segura dinámica.
     * Permite que el padre defina el perímetro de seguridad desde el mapa.
     */
    @PutMapping("/{id}/safe-zone")
    public ResponseEntity<Device> updateSafeZone(
            @PathVariable UUID id,
            @RequestBody Map<String, Double> coordinates) {

        Double lat = coordinates.get("safeLatitude");
        Double lon = coordinates.get("safeLongitude");
        Double radius = coordinates.getOrDefault("safeRadius", 500.0); // Soporte para radio variable

        Device actualizado = deviceService.actualizarZonaSegura(id, lat, lon, radius);
        return ResponseEntity.ok(actualizado);
    }
}