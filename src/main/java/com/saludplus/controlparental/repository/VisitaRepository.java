package com.saludplus.controlparental.repository;

import com.saludplus.controlparental.model.Visita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VisitaRepository extends JpaRepository<Visita, Long> {

    /**
     * Lógica de Inteligencia:
     * Busca la ÚLTIMA visita para saber si el niño sigue ahí o se movió.
     */
    Optional<Visita> findTopByDeviceIdOrderByHoraEntradaDesc(String deviceId);

    /**
     * Lógica de Control Parental:
     * Obtiene TODAS las estancias de un dispositivo, ordenadas de la más reciente
     * a la más antigua para mostrar en la línea de tiempo (Timeline).
     */
    List<Visita> findAllByDeviceIdOrderByHoraEntradaDesc(String deviceId);
}
