package com.saludplus.controlparental.controller;

import com.saludplus.controlparental.model.CallLog;
import com.saludplus.controlparental.repository.CallLogRepository;
import com.saludplus.controlparental.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calls")
@CrossOrigin(origins = "*")
public class CallController {

    @Autowired private CallLogRepository callLogRepository;
    @Autowired private DeviceRepository deviceRepository;

    // 1. Registro compatible con el Emisor (Simulador)
    @PostMapping("/device/{deviceId}/register")
    public ResponseEntity<?> registrarLlamada(@PathVariable UUID deviceId, @RequestBody CallLog callData) {
        return deviceRepository.findById(deviceId).map(device -> {
            callData.setDevice(device);
            // IMPORTANTE: Asegúrate de que el ID sea null para que sea un INSERT
            callData.setId(null);
            return ResponseEntity.ok(callLogRepository.save(callData));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 2. Obtener TODO el historial para el archivo llamadas.html
    @GetMapping("/device/{deviceId}")
    public ResponseEntity<List<CallLog>> getFullHistory(@PathVariable UUID deviceId) {
        List<CallLog> history = callLogRepository.findByDeviceIdOrderByTimestampDesc(deviceId);
        return ResponseEntity.ok(history);
    }

    // 3. Subir el archivo de audio (Ya lo tienes bien)
    @PostMapping("/{callId}/audio")
    public ResponseEntity<?> uploadAudio(@PathVariable UUID callId, @RequestParam("file") MultipartFile file) {
        return callLogRepository.findById(callId).map(call -> {
            String fakeUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; // Simulación de URL
            call.setAudioUrl(fakeUrl);
            callLogRepository.save(call);
            return ResponseEntity.ok("{\"status\": \"Audio vinculado\"}");
        }).orElse(ResponseEntity.notFound().build());
    }
}
