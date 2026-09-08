    package com.saludplus.controlparental.controller;

    import com.saludplus.controlparental.model.Device;
    import com.saludplus.controlparental.model.Location;
    import com.saludplus.controlparental.model.Visita;
    import com.saludplus.controlparental.service.LocationService;
    import com.saludplus.controlparental.service.VisitaService;
    import com.saludplus.controlparental.repository.DeviceRepository;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.format.annotation.DateTimeFormat;
    import org.springframework.http.*;
    import org.springframework.web.bind.annotation.*;
    import org.springframework.web.client.RestTemplate;

    import java.time.LocalDate;
    import java.util.List;
    import java.util.UUID;

    @RestController
    @RequestMapping("/api/v1/locations")
    @CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
    public class LocationController {

        @Autowired
        private LocationService locationService;

        @Autowired
        private VisitaService visitaService;

        @Autowired
        private DeviceRepository deviceRepository;

        private final RestTemplate restTemplate = new RestTemplate();

        /**
         * PROXY DE DIRECCIONES: Resuelve el error de CORS consultando desde el servidor.
         */
        @GetMapping("/address")
        public ResponseEntity<?> getAddressProxy(@RequestParam Double lat, @RequestParam Double lon) {
            try {
                String url = String.format("https://nominatim.openstreetmap.org/reverse?format=json&lat=%s&lon=%s", lat, lon);

                // IMPORTANTE: Nominatim requiere un User-Agent para no bloquear la petición
                HttpHeaders headers = new HttpHeaders();
                headers.set("User-Agent", "SaludPlus_Monitor_Backend/1.0");
                HttpEntity<String> entity = new HttpEntity<>(headers);

                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(response.getBody());
            } catch (Exception e) {
                System.err.println("Error consultando Nominatim: " + e.getMessage());
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("{\"error\": \"No se pudo obtener la dirección\"}");
            }
        }

        /**
         * RECIBIR UBICACIÓN: Este es el que usa el celular para enviar su GPS, Batería y Modelo.
         */
        @PostMapping(value = "/send", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
        public ResponseEntity<?> sendLocation(@RequestBody Location location) {
            try {
                // Validaciones de seguridad
                if (location.getDevice() == null || location.getDevice().getId() == null) {
                    return ResponseEntity.badRequest().body("{\"error\": \"El campo 'device.id' es obligatorio.\"}");
                }

                UUID deviceId = location.getDevice().getId();
                Device device = deviceRepository.findById(deviceId).orElse(null);

                if (device == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("{\"error\": \"Dispositivo no registrado en el sistema\"}");
                }

                // Vinculamos el dispositivo a la ubicación
                location.setDevice(device);

                // Los campos batteryLevel y deviceModel se guardan automáticamente si vienen en el JSON
                Location nuevaUbicacion = locationService.guardarUbicacion(location);

                // Procesamos la visita para el historial de estancias
                visitaService.procesarUbicacion(
                        deviceId.toString(),
                        location.getLatitude(),
                        location.getLongitude()
                );

                return ResponseEntity.ok(nuevaUbicacion);
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("{\"error\": \"Error interno: " + e.getMessage() + "\"}");
            }
        }

        /**
         * TIME MACHINE: Busca el historial por una fecha específica.
         */
        @GetMapping("/device/{deviceId}/history")
        public ResponseEntity<List<Location>> getHistoryByDate(
                @PathVariable UUID deviceId,
                @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
            List<Location> history = locationService.obtenerHistorialPorFecha(deviceId, date);
            return ResponseEntity.ok(history);
        }

        /**
         * LISTA DE VISITAS: Para ver cuándo entró o salió de la zona segura.
         */
        @GetMapping("/device/{deviceId}/visitas")
        public ResponseEntity<List<Visita>> getVisitasByDevice(@PathVariable String deviceId) {
            return ResponseEntity.ok(visitaService.obtenerVisitasPorDispositivo(deviceId));
        }

        /**
         * ÚLTIMA UBICACIÓN Y ESTADO: Devuelve el historial para monitoreo en vivo.
         */
        @GetMapping("/device/{deviceId}")
        public ResponseEntity<List<Location>> getHistory(@PathVariable UUID deviceId) {
            List<Location> locations = locationService.obtenerHistorial(deviceId);
            return ResponseEntity.ok(locations);
        }
    }