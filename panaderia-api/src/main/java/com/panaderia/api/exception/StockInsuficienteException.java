package com.panaderia.api.exception;

public class StockInsuficienteException extends RuntimeException {
    public StockInsuficienteException(String producto, int solicitado, int disponible) {
        super(String.format("Stock insuficiente para '%s'. Solicitado: %d, Disponible: %d",
                producto, solicitado, disponible));
    }
}
