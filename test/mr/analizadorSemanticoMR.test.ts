import {describe, expect, it} from "vitest";
import {AnalizadorSemánticoMR} from "../../src/mr/analizadorSemanticoMR";
import {
    AtributoMR,
    AtributoPK,
    AtributoSimple,
    FilaMR,
    ProgramaMR,
    ProgramaMRValidado,
    RelacionMR
} from "../../src/mr/modeloSintacticoMR";
import {ErroresValidaciónMR} from "../../src/servicios/errores";
import {TipoAtributo} from "../../src/tipos/tipos.ts";
import {DefiniciónRelación, InsertarEn, SentenciaMR} from "../../src/mr/sentenciaMR.ts";

function programa(...sentencias: SentenciaMR[]): ProgramaMR {
    return new ProgramaMR(sentencias);
}

function relación(nombre: string, ...atributos: AtributoMR[]): DefiniciónRelación {
    return new DefiniciónRelación(new RelacionMR(nombre, atributos));
}

function atributo(nombre: string, tipo: TipoAtributo = 'simple'): AtributoMR {
    return tipo === 'pk' ? new AtributoPK(nombre) : new AtributoSimple(nombre);
}

function inserción(nombre: string, ...valores: FilaMR[]): InsertarEn {
    return new InsertarEn(nombre, valores);
}

function fila(...valores: (string | number | boolean)[]) {
    return new FilaMR(valores);
}

describe("[Modelo Relacional] Analizador Semántico", () => {
    const analizador = new AnalizadorSemánticoMR();

    it("el analizador semántico no levanta excepciones si todas las relaciones tienen PK", () => {
        const modelo = programa(
            relación("CLIENTE", atributo("id", 'pk')),
            relación("VENTA", atributo("nro", 'pk'), atributo("fecha"))
        );

        expect(() => analizador.validar(modelo)).not.toThrow();
    });

    it("al leer un modelo sin errores semáticos, se retorna un objeto que representa que el programa es válido", () => {
        const modelo = programa(
            relación("CLIENTE", atributo("id", 'pk'))
        );

        expect(analizador.validar(modelo)).toBeInstanceOf(ProgramaMRValidado);
    });

    it("el analizador levanta una excepción cuando alguna relación no tiene clave primaria", () => {
        const modelo = programa(
            relación("pirata", atributo("attr")),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidaciónMR);
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'pirata'.");
    });

    it("el analizador acumula todos los errores de relaciones sin clave primaria en una única excepción", () => {
        const modelo = programa(
            relación("pirata", atributo("attr")),
            relación("fruta", atributo("id", 'pk')),
            relación("MARINERO", atributo("attr"), atributo("attr2")),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidaciónMR);
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'pirata'.");
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'MARINERO'.");
    });

    it("se puede declarar una inserción luego de la definición de la relación", () => {
        const modelo = programa(
            relación("CLIENTE", atributo("id", "pk")),
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
            relación("CLIENTE", atributo("id", 'pk')),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidaciónMR);
        expect(() => analizador.validar(modelo)).toThrow("Relación 'CLIENTE' no definida.");
    });

    it("al insertar filas con cantidades incorrectas acumula un error por fila", () => {
        const modelo = programa(
            relación("CLIENTE", atributo("id", 'pk')),
            inserción("CLIENTE", fila(1, 2), fila(3, 4, 'padre')),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidaciónMR);
        expect(() => analizador.validar(modelo)).toThrow("La 1ª inserción en 'CLIENTE' tiene 2 atributos pero la relación espera 1.");
        expect(() => analizador.validar(modelo)).toThrow("La 2ª inserción en 'CLIENTE' tiene 3 atributos pero la relación espera 1.");
    });

    it("los errores de definición e inserción semánticos se acumulan en una única excepción", () => {
        const modelo = programa(
            relación("pirata", atributo("attr")),
            inserción("INEXISTENTE", fila(1)),
            inserción("pirATA", fila(1, 2)),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidaciónMR);
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'pirata'.");
        expect(() => analizador.validar(modelo)).toThrow("Relación 'INEXISTENTE' no definida.");
        expect(() => analizador.validar(modelo)).toThrow("La 1ª inserción en 'pirATA' tiene 2 atributos pero la relación espera 1.");
    });
});