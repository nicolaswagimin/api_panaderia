package com.panaderia.api.util;

import com.panaderia.api.model.DetalleFactura;
import java.math.BigDecimal;
import java.util.List;

public class CalculadoraFactura {

    public static BigDecimal calcularSubtotalRecursivo(List<DetalleFactura> detalles, int indice) {
        if (indice >= detalles.size()) {
            return BigDecimal.ZERO;
        }
        BigDecimal subtotalActual = detalles.get(indice).getSubtotal();
        return subtotalActual.add(calcularSubtotalRecursivo(detalles, indice + 1));
    }

    public static int calcularDigitoVerificador(String numero, int indice, int acumulado) {
        if (indice >= numero.length()) {
            return acumulado % 11;
        }
        int digito = Character.getNumericValue(numero.charAt(indice));
        return calcularDigitoVerificador(numero, indice + 1, acumulado + digito * (indice + 2));
    }

    public static BigDecimal aplicarDescuentosRecursivo(BigDecimal monto,
                                                         List<BigDecimal> descuentos,
                                                         int indice) {
        if (indice >= descuentos.size()) {
            return monto;
        }
        BigDecimal factor = BigDecimal.ONE.subtract(
                descuentos.get(indice).divide(new BigDecimal("100")));
        BigDecimal montoConDescuento = monto.multiply(factor);
        return aplicarDescuentosRecursivo(montoConDescuento, descuentos, indice + 1);
    }

    public static String generarNumeroFactura(long consecutivo) {
        return String.format("FAC-%06d", consecutivo);
    }
}
