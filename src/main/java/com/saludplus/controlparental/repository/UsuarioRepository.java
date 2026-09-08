package com.saludplus.controlparental.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saludplus.controlparental.model.Usuario;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCase(String correo);
}