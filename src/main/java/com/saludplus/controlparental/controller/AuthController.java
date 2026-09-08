package com.saludplus.controlparental.controller;

import java.util.Map;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saludplus.controlparental.model.Usuario;
import com.saludplus.controlparental.repository.UsuarioRepository;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;

    public AuthController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        Usuario usuario = usuarioRepository
                .findByCorreoIgnoreCase(request.correo())
                .orElse(null);

        if (usuario == null
                || !Boolean.TRUE.equals(usuario.getActivo())
                || !Objects.equals(usuario.getPassword(), request.password())) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensaje", "Correo o contraseña incorrectos"));
        }

        return ResponseEntity.ok(
                new LoginResponse(
                        usuario.getId(),
                        usuario.getNombres(),
                        usuario.getApellidos(),
                        usuario.getCorreo(),
                        usuario.getRol()
                )
        );
    }

    public record LoginRequest(
            String correo,
            String password
    ) {}

    public record LoginResponse(
            Long id,
            String nombres,
            String apellidos,
            String correo,
            String rol
    ) {}
}
