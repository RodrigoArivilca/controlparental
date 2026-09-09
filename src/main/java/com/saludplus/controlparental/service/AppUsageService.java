package com.saludplus.controlparental.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.saludplus.controlparental.model.AppUsage;
import com.saludplus.controlparental.model.Device;
import com.saludplus.controlparental.repository.AppUsageRepository;
import com.saludplus.controlparental.repository.DeviceRepository;

@Service
public class AppUsageService {

    private final AppUsageRepository appUsageRepository;
    private final DeviceRepository deviceRepository;

    public AppUsageService(
            AppUsageRepository appUsageRepository,
            DeviceRepository deviceRepository) {

        this.appUsageRepository = appUsageRepository;
        this.deviceRepository = deviceRepository;
    }

    public AppUsage registrar(
            UUID deviceId,
            AppUsage usage) {

        Device device = deviceRepository
                .findById(deviceId)
                .orElseThrow(
                        () -> new IllegalArgumentException(
                                "Dispositivo no encontrado"
                        )
                );

        if (usage.getUsageSeconds() == null
                || usage.getUsageSeconds() < 0) {

            throw new IllegalArgumentException(
                    "El tiempo de uso no puede ser negativo"
            );
        }

        usage.setId(null);
        usage.setDevice(device);

        return appUsageRepository.save(usage);
    }

    public List<AppUsage> listarPorDispositivo(
            UUID deviceId) {

        return appUsageRepository
                .findByDeviceIdOrderByUsageSecondsDesc(deviceId);
    }

    public List<AppUsage> listarPorFecha(
            UUID deviceId,
            LocalDate fecha) {

        return appUsageRepository
                .findByDeviceIdAndRecordedDateOrderByUsageSecondsDesc(
                        deviceId,
                        fecha
                );
    }
}
