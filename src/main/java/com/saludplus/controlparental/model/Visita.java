package com.saludplus.controlparental.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.Duration;

@Entity
@Table(name = "visitas")
@Data // Genera Getters, Setters, toString, equals y hashCode automáticamente
@NoArgsConstructor // Genera el constructor vacío necesario para JPA
@AllArgsConstructor // Genera un constructor con todos los campos
@Builder // Permite crear objetos de forma fluida
public class Visita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String deviceId;

    @Column(nullable = false)
    private Double latitud;

    @Column(nullable = false)
    private Double longitud;

    /**
     * Almacena la dirección real (Calle, Distrito) obtenida desde el Backend
     * para evitar errores de cuota (429) en el navegador del padre.
     */
    private String direccion;

    @Column(nullable = false)
    private LocalDateTime horaEntrada;

    private LocalDateTime horaSalida;

    private Integer duracionMinutos;

    /**
     * Campo opcional para nombres de lugares específicos (ej: "Real Plaza", "Parque Selva Alegre")
     */
    private String nombreLugar;

    /**
     * Setter personalizado para horaSalida.
     * Sobrescribe el de Lombok para calcular automáticamente duracionMinutos
     * cada vez que se actualiza el tiempo de permanencia.
     */
    public void setHoraSalida(LocalDateTime horaSalida) {
        this.horaSalida = horaSalida;
        if (this.horaEntrada != null && this.horaSalida != null) {
            long minutos = Duration.between(this.horaEntrada, this.horaSalida).toMinutes();
            // Aseguramos que la duración sea al menos 0 (evita negativos por errores de reloj)
            this.duracionMinutos = Math.max(0, (int) minutos);
        }
    }
}
