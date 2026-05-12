import {describe, expect, it} from "vitest";
import {AnalizadorSemánticoMR} from "../../src/mr/analizadorSemanticoMR";
import {ProgramaMRValidado} from "../../src/mr/modeloSintacticoMR";
import {ErroresValidaciónMR} from "../../src/servicios/errores";
import {definición, fila, inserción, pk, programa, relación, simple} from "./helpers";

describe("[Modelo Relacional] Analizador Semántico", () => {
    const analizador = new AnalizadorSemánticoMR();

    it("el analizador semántico no levanta excepciones si todas las relaciones tienen PK", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("VENTA", pk("nro"), simple("fecha")))
        );

        expect(() => analizador.validar(modelo)).not.toThrow();
    });

    it("al leer un modelo sin errores semáticos, se retorna un objeto que representa que el programa es válido", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id")))
        );

        expect(analizador.validar(modelo)).toBeInstanceOf(ProgramaMRValidado);
    });

    it("el analizador levanta una excepción cuando alguna relación no tiene clave primaria", () => {
        const modelo = programa(
            definición(relación("pirata", simple("attr"))),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidaciónMR);
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'pirata'.");
    });

    it("el analizador acumula todos los errores de relaciones sin clave primaria en una única excepción", () => {
        const modelo = programa(
            definición(relación("pirata", simple("attr"))),
            definición(relación("fruta", pk("id"))),
            definición(relación("MARINERO", simple("attr"), simple("attr2"))),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidaciónMR);
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'pirata'.");
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'MARINERO'.");
    });

    it("se puede declarar una inserción luego de la definición de la relación", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id"))),
            inserción("CLIENTE", fila(1)),
        );

        expect(() => analizador.validar(modelo)).not.toThrow();
    });

    it("al insertar en una relación no definida se levanta una excepción", () => {
        const modelo = programa(
            inserción("INEXISTENTE", fila(1)),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidaciónMR);
        expect(() => analizador.validar(modelo)).toThrow("Relación 'INEXISTENTE' no definida.");
    });

    it("al insertar en una relación antes de su definición se levanta una excepción", () => {
        const modelo = programa(
            inserción("CLIENTE", fila(1)),
            definición(relación("CLIENTE", pk("id"))),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidaciónMR);
        expect(() => analizador.validar(modelo)).toThrow("Relación 'CLIENTE' no definida.");
    });

    it("al insertar filas con cantidades incorrectas acumula un error por fila", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id"))),
            inserción("CLIENTE", fila(1, 2), fila(3, 4, 'padre')),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidaciónMR);
        expect(() => analizador.validar(modelo)).toThrow("La 1ª inserción en 'CLIENTE' tiene 2 atributos pero la relación espera 1.");
        expect(() => analizador.validar(modelo)).toThrow("La 2ª inserción en 'CLIENTE' tiene 3 atributos pero la relación espera 1.");
    });

    it("los errores de definición e inserción semánticos se acumulan en una única excepción", () => {
        const modelo = programa(
            definición(relación("pirata", simple("attr"))),
            inserción("INEXISTENTE", fila(1)),
            inserción("pirATA", fila(1, 2)),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidaciónMR);
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'pirata'.");
        expect(() => analizador.validar(modelo)).toThrow("Relación 'INEXISTENTE' no definida.");
        expect(() => analizador.validar(modelo)).toThrow("La 1ª inserción en 'pirATA' tiene 2 atributos pero la relación espera 1.");
    });
});