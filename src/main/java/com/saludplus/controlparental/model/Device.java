package com.saludplus.controlparental.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.OffsetDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "devices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "device_name", nullable = false, length = 100)
    private String deviceName;

    @Column(length = 50)
    private String model;

    @Column(name = "android_version", length = 20)
    private String androidVersion;

    @Column(name = "fcm_token", columnDefinition = "TEXT")
    private String fcmToken;

    @Column(name = "is_online")
    private Boolean isOnline = false;

    /**
     * ROL DEL DISPOSITIVO
     * ADMIN: Dispositivo del padre (Radar/Controlador)
     * CONTROLLED: Dispositivo del hijo (Emisor/Seguimiento)
     */
    @Column(name = "role", length = 20)
    private String role = "CONTROLLED";

    // --- CAMPOS PARA LA ZONA SEGURA DINÁMICA ---
    @Column(name = "safe_latitude")
    private Double safeLatitude;

    @Column(name = "safe_longitude")
    private Double safeLongitude;

    @Column(name = "safe_radius")
    private Double safeRadius = 500.0;
    // ------------------------------------------

    @Column(name = "last_connection")
    private OffsetDateTime lastConnection;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.lastConnection = OffsetDateTime.now();
        // Por defecto, si no se especifica, es un dispositivo controlado
        if (this.role == null) {
            this.role = "CONTROLLED";
        }
    }
}