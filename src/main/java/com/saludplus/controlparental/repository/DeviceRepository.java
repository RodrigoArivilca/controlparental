package com.saludplus.controlparental.repository;

import com.saludplus.controlparental.model.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface DeviceRepository extends JpaRepository<Device, UUID> {
    // Heredas todos los métodos: save(), findAll(), findById(), delete()
}
