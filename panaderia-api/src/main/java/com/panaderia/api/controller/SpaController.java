package com.panaderia.api.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controlador para el SPA (Single Page Application) de Angular.
 * Redirige todas las rutas del frontend a index.html para que
 * Angular Router gestione la navegación en el cliente.
 * Sin esto, al recargar la página daría HTTP 404.
 */
@Controller
public class SpaController {

    @GetMapping(value = {"/", "/login", "/dashboard", "/productos",
                         "/inventario", "/clientes", "/facturacion"})
    public String spa() {
        return "forward:/index.html"; // Spring sirve el index.html de Angular
    }
}
