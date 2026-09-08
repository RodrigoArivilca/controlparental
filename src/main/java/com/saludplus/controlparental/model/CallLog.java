package com.saludplus.controlparental.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "call_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"device", "hibernateLazyInitializer", "handler"}) // IMPORTANTE: Evita bucles infinitos al convertir a JSON
public class CallLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "contact_name")
    private String contactName;

    // Tipos: "INCOMING", "OUTGOING", "MISSED", "WHATSAPP"
    @Column(name = "call_type")
    private String callType;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "audio_url")
    private String audioUrl;

    @Column(name = "recorded_at") // Usamos un nombre claro para la BD
    private OffsetDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = OffsetDateTime.now();
        }
    }
}
