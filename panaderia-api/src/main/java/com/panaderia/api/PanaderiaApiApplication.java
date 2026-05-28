package com.panaderia.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import com.panaderia.api.model.Usuario;
import com.panaderia.api.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.panaderia.api.model.Producto;
import com.panaderia.api.model.Inventario;
import com.panaderia.api.model.Cliente;
import com.panaderia.api.repository.ProductoRepository;
import com.panaderia.api.repository.InventarioRepository;
import com.panaderia.api.repository.ClienteRepository;
import java.math.BigDecimal;

@SpringBootApplication
@ComponentScan(basePackages = "com.panaderia.api")
public class PanaderiaApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(PanaderiaApiApplication.class, args);
    }

    @Bean
    CommandLineRunner runner(
            UsuarioRepository usuarioRepository, 
            ProductoRepository productoRepository,
            InventarioRepository inventarioRepository,
            ClienteRepository clienteRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Usuario Admin
            if (usuarioRepository.count() == 0) {
                Usuario admin = Usuario.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin123"))
                        .nombre("Administrador")
                        .rol(Usuario.Rol.ADMIN)
                        .build();
                admin.setActivo(true);
                usuarioRepository.save(admin);
            }

            // Datos de prueba para que NO esté vacío
            if (productoRepository.count() == 0) {
                Producto p1 = Producto.builder().descripcion("Pan Blandito x10").precio(new BigDecimal("5000")).build();
                p1.setActivo(true);
                productoRepository.save(p1);
                inventarioRepository.save(Inventario.builder().producto(p1).stockActual(50).build());

                Producto p2 = Producto.builder().descripcion("Pan Rollo x10").precio(new BigDecimal("6000")).build();
                p2.setActivo(true);
                productoRepository.save(p2);
                inventarioRepository.save(Inventario.builder().producto(p2).stockActual(30).build());
            }

            if (clienteRepository.count() == 0) {
                Cliente c1 = Cliente.builder().nombre("Juan Perez").documento("12345").build();
                c1.setActivo(true);
                clienteRepository.save(c1);
            }
            
            System.out.println("SISTEMA LISTO - Usuario: admin | Pass: admin123");
        };
    }
}
