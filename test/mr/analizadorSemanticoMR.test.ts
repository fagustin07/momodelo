import {describe, expect, it} from "vitest";
import {AnalizadorSemánticoMR} from "../../src/mr/analizadorSemanticoMR";
import {AtributoPK, AtributoSimple, DefiniciónRelación, ProgramaMR, RelacionMR} from "../../src/mr/modeloSintacticoMR";
import {ErroresValidaciónMR} from "../../src/servicios/errores";

function programa(...relaciones: RelacionMR[]): ProgramaMR {
    return new ProgramaMR(relaciones.map(r => new DefiniciónRelación(r)));
}

describe("[Modelo Relacional] Analizador Semántico", () => {
    const analizador = new AnalizadorSemánticoMR();

    it("el analizador semántico no levanta excepciones si todas las relaciones tienen PK", () => {
        const modelo = programa(
            new RelacionMR("CLIENTE", [new AtributoPK("id")]),
            new RelacionMR("VENTA", [new AtributoPK("nro"), new AtributoSimple("fecha")])
        );

        expect(() => analizador.validar(modelo)).not.toThrow();
    });

    it("el analizador levanta una excepción cuando alguna relación no tiene clave primaria", () => {
        const modelo = programa(
            new RelacionMR("pirata", [new AtributoSimple("attr")]),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidaciónMR);
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'pirata'.");
    });

    it("el analizador acumula todos los errores de relaciones sin clave primaria en una única excepción", () => {
        const modelo = programa(
            new RelacionMR("pirata", [new AtributoSimple("attr")]),
            new RelacionMR("fruta", [new AtributoPK("id")]),
            new RelacionMR("MARINERO", [new AtributoSimple("attr"), new AtributoSimple("attr2")]),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidaciónMR);
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'pirata'.");
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'MARINERO'.");
    });
});