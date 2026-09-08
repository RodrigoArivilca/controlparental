package com.saludplus.controlparental.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.saludplus.controlparental.model.Usuario;
import com.saludplus.controlparental.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    public Optional<Usuario> buscarPorId(Long id) {
        return usuarioRepository.findById(id);
    }

    public Usuario crear(Usuario usuario) {
        if (usuarioRepository.existsByCorreoIgnoreCase(usuario.getCorreo())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }

        return usuarioRepository.save(usuario);
    }

    public Usuario actualizar(Long id, Usuario datos) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        usuario.setNombres(datos.getNombres());
        usuario.setApellidos(datos.getApellidos());
        usuario.setCorreo(datos.getCorreo());
        usuario.setRol(datos.getRol());
        usuario.setActivo(datos.getActivo());

        if (datos.getPassword() != null && !datos.getPassword().isBlank()) {
            usuario.setPassword(datos.getPassword());
        }

        return usuarioRepository.save(usuario);
    }

    public void eliminar(Long id) {
        usuarioRepository.deleteById(id);
    }
}
