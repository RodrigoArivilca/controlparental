package com.saludplus.controlparental.repository;

import com.saludplus.controlparental.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime; // IMPORTANTE: Cambiado de LocalDateTime
import java.util.List;
import java.util.UUID;

@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {

    // Busca todas las ubicaciones de un dispositivo específico
    List<Location> findByDeviceIdOrderByRecordedAtDesc(UUID deviceId);

    /**
     * CORREGIDO: Ahora usa OffsetDateTime para coincidir con el Service y la Entidad.
     * Esto permitirá filtrar por el rango del día (00:00 a 23:59) con el offset -05:00.
     */
    List<Location> findByDeviceIdAndRecordedAtBetweenOrderByRecordedAtAsc(
            UUID deviceId,
            OffsetDateTime start,
            OffsetDateTime end
    );
}
