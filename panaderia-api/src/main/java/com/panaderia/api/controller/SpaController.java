package com.panaderia.api.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping(value = {
        "/",
        "/login",
        "/dashboard",
        "/productos",
        "/inventario",
        "/clientes",
        "/facturacion"
    })
    public String spa() {
        return "forward:/index.html";
    }
}
