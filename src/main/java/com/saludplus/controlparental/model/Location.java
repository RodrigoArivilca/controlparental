package com.saludplus.controlparental.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.OffsetDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    private Double latitude;
    private Double longitude;
    private Double accuracy;

    // --- NUEVOS CAMPOS ---
    @Column(name = "battery_level")
    private Integer batteryLevel; // Nivel de 0 a 100

    @Column(name = "device_model")
    private String deviceModel;   // Marca y modelo enviado por el móvil
    // ---------------------

    @Column(name = "recorded_at")
    private OffsetDateTime recordedAt;

    @PrePersist
    protected void onCreate() {
        if (this.recordedAt == null) {
            this.recordedAt = OffsetDateTime.now();
        }
    }
}
