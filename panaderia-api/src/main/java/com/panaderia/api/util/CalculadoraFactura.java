package com.panaderia.api.util;

import com.panaderia.api.model.DetalleFactura;
import java.math.BigDecimal;
import java.util.List;

/**
 * Clase utilitaria con métodos estáticos — Recursividad (POO/Algoritmos).
 * Agrupa operaciones matemáticas relacionadas con la facturación.
 * Todos los métodos son estáticos: no necesita instanciarse.
 */
public class CalculadoraFactura {

    /**
     * Suma los subtotales de todos los detalles usando recursión.
     * Caso base: índice fuera del rango → retorna 0.
     * Caso recursivo: subtotal actual + llamada con índice+1.
     */
    public static BigDecimal calcularSubtotalRecursivo(List<DetalleFactura> detalles, int indice) {
        if (indice >= detalles.size()) {       // caso base
            return BigDecimal.ZERO;
        }
        BigDecimal subtotalActual = detalles.get(indice).getSubtotal();
        return subtotalActual.add(calcularSubtotalRecursivo(detalles, indice + 1)); // recursión
    }

    /**
     * Calcula dígito verificador de un número usando recursión.
     * Útil para validar NITs o números de documento.
     */
    public static int calcularDigitoVerificador(String numero, int indice, int acumulado) {
        if (indice >= numero.length()) {       // caso base
            return acumulado % 11;
        }
        int digito = Character.getNumericValue(numero.charAt(indice));
        return calcularDigitoVerificador(numero, indice + 1, acumulado + digito * (indice + 2)); // recursión
    }

    /**
     * Aplica una lista de descuentos porcentuales en cascada usando recursión.
     * Cada descuento se aplica sobre el monto ya reducido por el anterior.
     */
    public static BigDecimal aplicarDescuentosRecursivo(BigDecimal monto,
                                                         List<BigDecimal> descuentos,
                                                         int indice) {
        if (indice >= descuentos.size()) {     // caso base: no quedan descuentos
            return monto;
        }
        BigDecimal factor = BigDecimal.ONE.subtract(
                descuentos.get(indice).divide(new BigDecimal("100")));
        BigDecimal montoConDescuento = monto.multiply(factor);
        return aplicarDescuentosRecursivo(montoConDescuento, descuentos, indice + 1); // recursión
    }

    /** Genera el número de factura con formato FAC-000001 */
    public static String generarNumeroFactura(long consecutivo) {
        return String.format("FAC-%06d", consecutivo);
    }
}
