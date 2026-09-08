package com.saludplus.controlparental.repository;

import com.saludplus.controlparental.model.CallLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CallLogRepository extends JpaRepository<CallLog, UUID> {

    // 1. Para el "Resume Home" (Las 5 más recientes)
    List<CallLog> findTop5ByDeviceIdOrderByTimestampDesc(UUID deviceId);

    // 2. Para el "llamadas.html" (Todo el historial ordenado por fecha)
    // Este es el que faltaba para que el nuevo método del Controller funcione
    List<CallLog> findByDeviceIdOrderByTimestampDesc(UUID deviceId);
}