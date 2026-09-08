package com.saludplus.controlparental.service;

import com.saludplus.controlparental.model.Device;
import com.saludplus.controlparental.model.Visita;
import com.saludplus.controlparental.repository.DeviceRepository;
import com.saludplus.controlparental.repository.VisitaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class VisitaService {

    @Autowired
    private VisitaRepository visitaRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    public List<Visita> obtenerVisitasPorDispositivo(String deviceId) {
        return visitaRepository.findAllByDeviceIdOrderByHoraEntradaDesc(deviceId);
    }

    /**
     * LÓGICA DE INGENIERÍA: Separa el flujo entre ADMIN (Padre) y CONTROLLED (Hijo).
     */
    public void procesarUbicacion(String deviceId, Double lat, Double lng) {
        // 1. Buscamos el rol del dispositivo para decidir qué hacer
        UUID uuid = UUID.fromString(deviceId);
        Device device = deviceRepository.findById(uuid)
                .orElseThrow(() -> new RuntimeException("Dispositivo no encontrado"));

        // Actualizamos estado general de conexión para ambos casos
        device.setLastConnection(OffsetDateTime.now());
        device.setIsOnline(true);
        deviceRepository.save(device);

        // 2. Si es el PADRE, terminamos aquí (no genera historial de estancias)
        if ("ADMIN".equalsIgnoreCase(device.getRole())) {
            System.out.println("🔵 Ubicación de ADMIN (Padre) actualizada. Radar listo.");
            return;
        }

        // 3. Si es el HIJO (CONTROLLED), aplicamos la lógica de estancias
        procesarLogicaHijo(deviceId, lat, lng);
    }

    private void procesarLogicaHijo(String deviceId, Double lat, Double lng) {
        Optional<Visita> ultimaVisitaOpt = visitaRepository.findTopByDeviceIdOrderByHoraEntradaDesc(deviceId);
        LocalDateTime ahora = LocalDateTime.now();

        if (ultimaVisitaOpt.isPresent()) {
            Visita ultima = ultimaVisitaOpt.get();
            double distancia = calcularDistancia(lat, lng, ultima.getLatitud(), ultima.getLongitud());
            long minutosAusente = Duration.between(ultima.getHoraSalida(), ahora).toMinutes();

            // CASO 1: SIGUE EN EL MISMO LUGAR
            if (distancia < 50) {
                ultima.setHoraSalida(ahora);
                visitaRepository.save(ultima);
                System.out.println("⏳ Estancia de HIJO actualizada.");
            }
            // CASO 2: TRÁNSITO (Movimiento rápido)
            else if (distancia < 150 && minutosAusente < 5) {
                System.out.println("🚶 HIJO en tránsito: Ignorando creación de tarjeta.");
            }
            // CASO 3: NUEVA ESTANCIA
            else {
                crearNuevaVisita(deviceId, lat, lng);
            }
        } else {
            crearNuevaVisita(deviceId, lat, lng);
        }
    }

    private void crearNuevaVisita(String deviceId, Double lat, Double lng) {
        Map<String, String> datosDireccion = obtenerDetallesDireccion(lat, lng);

        Visita nueva = Visita.builder()
                .deviceId(deviceId)
                .latitud(lat)
                .longitud(lng)
                .direccion(datosDireccion.get("direccion"))
                .nombreLugar(datosDireccion.get("nombre"))
                .horaEntrada(LocalDateTime.now())
                .horaSalida(LocalDateTime.now())
                .build();

        visitaRepository.save(nueva);
        System.out.println("🚩 Nueva estancia registrada para el dispositivo controlado.");
    }

    private Map<String, String> obtenerDetallesDireccion(Double lat, Double lng) {
        String nombre = "Lugar desconocido";
        String direccion = "Calle en Arequipa";

        try {
            String url = String.format(Locale.US, "https://nominatim.openstreetmap.org/reverse?format=json&lat=%f&lon=%f", lat, lng);
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "SaludPlus-ControlParental-v3");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && body.containsKey("address")) {
                Map<String, Object> address = (Map<String, Object>) body.get("address");

                nombre = (String) address.getOrDefault("amenity",
                        address.getOrDefault("building",
                                address.getOrDefault("office",
                                        address.getOrDefault("shop",
                                                address.getOrDefault("tourism", "Punto de interés")))));

                String calle = (String) address.getOrDefault("road", "Calle desconocida");
                String numero = (String) address.getOrDefault("house_number", "");
                String distrito = (String) address.getOrDefault("suburb",
                        (String) address.getOrDefault("city", "Yanahuara"));

                direccion = String.format("%s %s, %s", calle, numero, distrito).trim();

                if (nombre.equals("Punto de interés")) {
                    nombre = calle;
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error en Geocoding: " + e.getMessage());
        }

        return Map.of("nombre", nombre, "direccion", direccion);
    }

    private double calcularDistancia(double lat1, double lng1, double lat2, double lng2) {
        double earthRadius = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }
}
