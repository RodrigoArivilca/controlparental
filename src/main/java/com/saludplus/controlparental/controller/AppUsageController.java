package com.saludplus.controlparental.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saludplus.controlparental.model.AppUsage;
import com.saludplus.controlparental.service.AppUsageService;

@RestController
@RequestMapping("/api/v1/app-usage")
public class AppUsageController {

    private final AppUsageService appUsageService;

    public AppUsageController(
            AppUsageService appUsageService) {

        this.appUsageService = appUsageService;
    }

    @PostMapping("/device/{deviceId}")
    public ResponseEntity<?> registrar(
            @PathVariable UUID deviceId,
            @RequestBody AppUsage usage) {

        try {

            return ResponseEntity.ok(
                    appUsageService.registrar(
                            deviceId,
                            usage
                    )
            );

        } catch (IllegalArgumentException ex) {

            return ResponseEntity
                    .badRequest()
                    .body(ex.getMessage());
        }
    }

    @GetMapping("/device/{deviceId}")
    public List<AppUsage> listar(
            @PathVariable UUID deviceId) {

        return appUsageService
                .listarPorDispositivo(deviceId);
    }

    @GetMapping("/device/{deviceId}/date/{fecha}")
    public List<AppUsage> listarPorFecha(
            @PathVariable UUID deviceId,
            @PathVariable LocalDate fecha) {

        return appUsageService
                .listarPorFecha(deviceId, fecha);
    }
}
