package com.saludplus.controlparental.model;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "app_usage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({
        "device",
        "hibernateLazyInitializer",
        "handler"
})
public class AppUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(name = "package_name", nullable = false, length = 200)
    private String packageName;

    @Column(name = "app_name", nullable = false, length = 120)
    private String appName;

    @Column(name = "usage_seconds", nullable = false)
    private Integer usageSeconds;

    @Column(name = "last_used_at")
    private OffsetDateTime lastUsedAt;

    @Column(name = "recorded_date", nullable = false)
    private LocalDate recordedDate;

    @PrePersist
    protected void onCreate() {
        if (recordedDate == null) {
            recordedDate = LocalDate.now();
        }
    }
}