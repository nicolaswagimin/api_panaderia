package com.panaderia.api.util;

import com.panaderia.api.model.DetalleFactura;
import java.math.BigDecimal;
import java.util.List;

/**
 * ============================================================
 * CLASE UTILITARIA CON RECURSIVIDAD - ALGORITMOS (POO)
 * ============================================================
 *
 * Esta clase agrupa operaciones matematicas del proceso de
 * facturacion. Todos sus metodos son ESTATICOS, lo que significa
 * que no es necesario crear un objeto de esta clase para usarlos.
 * Se llaman directamente: CalculadoraFactura.metodo(...)
 *
 * RECURSIVIDAD: tres de sus metodos usan recursion en lugar
 * de ciclos (for/while). Cada metodo recursivo tiene:
 *   1. CASO BASE: condicion que detiene la recursion
 *   2. CASO RECURSIVO: el metodo se llama a si mismo
 *      con un parametro diferente (indice + 1)
 * ============================================================
 */
public class CalculadoraFactura {

    /**
     * METODO RECURSIVO 1: Suma los subtotales de todos los detalles
     * ---------------------------------------------------------------
     * Recorre la lista de detalles de una factura y suma todos los subtotales.
     *
     * CASO BASE: cuando el indice llega al final de la lista, retorna 0
     * CASO RECURSIVO: toma el subtotal actual y lo suma con el resultado
     *                 de llamarse a si mismo con el siguiente indice
     *
     * Ejemplo con lista [DetalleA=5000, DetalleB=3000, DetalleC=2000]:
     *   llamada(lista, 0) = 5000 + llamada(lista, 1)
     *   llamada(lista, 1) = 3000 + llamada(lista, 2)
     *   llamada(lista, 2) = 2000 + llamada(lista, 3)
     *   llamada(lista, 3) = 0  <- CASO BASE, indice >= lista.size()
     *   resultado final   = 5000 + 3000 + 2000 + 0 = 10000
     *
     * @param detalles lista de lineas de la factura
     * @param indice   posicion actual en la lista (empieza en 0)
     * @return suma total de todos los subtotales
     */
    public static BigDecimal calcularSubtotalRecursivo(List<DetalleFactura> detalles, int indice) {
        // CASO BASE: ya no quedan elementos por sumar
        if (indice >= detalles.size()) {
            return BigDecimal.ZERO;
        }
        // CASO RECURSIVO: subtotal actual + suma del resto de la lista
        BigDecimal subtotalActual = detalles.get(indice).getSubtotal();
        return subtotalActual.add(calcularSubtotalRecursivo(detalles, indice + 1));
    }

    /**
     * METODO RECURSIVO 2: Calcula el digito verificador de un numero
     * ---------------------------------------------------------------
     * Se usa para validar NITs o numeros de documento.
     * Recorre cada digito del numero aplicando pesos y acumulando.
     *
     * CASO BASE: cuando el indice llega al final del numero
     *            retorna el acumulado modulo 11
     * CASO RECURSIVO: toma el digito actual, lo multiplica por su peso
     *                 y se llama a si mismo con el siguiente indice
     *
     * @param numero    el numero como texto (ej: "12345678")
     * @param indice    posicion actual (empieza en 0)
     * @param acumulado suma acumulada de digito * peso
     * @return digito verificador
     */
    public static int calcularDigitoVerificador(String numero, int indice, int acumulado) {
        // CASO BASE: se procesaron todos los digitos
        if (indice >= numero.length()) {
            return acumulado % 11;
        }
        // CASO RECURSIVO: agrega el aporte del digito actual
        int digito = Character.getNumericValue(numero.charAt(indice));
        return calcularDigitoVerificador(numero, indice + 1, acumulado + digito * (indice + 2));
    }

    /**
     * METODO RECURSIVO 3: Aplica descuentos porcentuales en cascada
     * ---------------------------------------------------------------
     * Aplica una lista de descuentos uno sobre el resultado del anterior.
     * Cada descuento reduce el monto que viene del descuento previo.
     *
     * CASO BASE: no quedan descuentos por aplicar, retorna el monto actual
     * CASO RECURSIVO: aplica el descuento actual y llama al siguiente
     *
     * Ejemplo: monto=10000, descuentos=[10%, 5%]
     *   llamada(10000, [10,5], 0):
     *     aplica 10% -> 10000 * 0.90 = 9000
     *     llamada(9000, [10,5], 1):
     *       aplica 5%  -> 9000 * 0.95 = 8550
     *       llamada(8550, [10,5], 2):
     *         CASO BASE -> retorna 8550
     *   resultado final = 8550
     *
     * @param monto      monto sobre el que se aplica el descuento
     * @param descuentos lista de porcentajes (ej: 10.0 para 10%)
     * @param indice     posicion actual en la lista de descuentos
     * @return monto final despues de todos los descuentos
     */
    public static BigDecimal aplicarDescuentosRecursivo(BigDecimal monto,
                                                         List<BigDecimal> descuentos,
                                                         int indice) {
        // CASO BASE: no quedan mas descuentos
        if (indice >= descuentos.size()) {
            return monto;
        }
        // CASO RECURSIVO: aplica el descuento actual y continua con el siguiente
        BigDecimal factor = BigDecimal.ONE.subtract(
                descuentos.get(indice).divide(new BigDecimal("100")));
        BigDecimal montoConDescuento = monto.multiply(factor);
        return aplicarDescuentosRecursivo(montoConDescuento, descuentos, indice + 1);
    }

    /**
     * Genera el numero de factura con formato FAC-000001
     * Usa el ID maximo de la BD + 1 para garantizar unicidad,
     * incluso si hay facturas anuladas (el count() fallaria en ese caso).
     *
     * @param consecutivo numero secuencial
     * @return string con formato "FAC-000001"
     */
    public static String generarNumeroFactura(long consecutivo) {
        return String.format("FAC-%06d", consecutivo);
    }
}
