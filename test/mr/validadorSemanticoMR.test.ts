import {describe, expect, it} from "vitest";
import {ValidadorSemánticoMR} from "../../src/mr/validadorSemanticoMR.ts";
import {ErroresValidaciónMR} from "../../src/servicios/errores.ts";
import {definición, entidad, fila, inserción, mer, pk, programa, relación, simple} from "./helpers.ts";

describe("[Modelo Relacional] Validador Semántico MR", () => {
    const validador = new ValidadorSemánticoMR();

    it("la etapa semántica acepta múltiples relaciones con sus inserciones", () => {
        const programaMR = programa(
            definición(relación("CLIENTE", pk("id"), simple("nombre"))),
            inserción("CLIENTE", fila(1, "Ana"), fila(2, "Bob")),
        );
        const programaMRValidado = validador.ejecutarsePara(programaMR, null);
        expect(programaMRValidado.sentencias).toEqual(programaMR.sentencias);
    });

    it("se levanta una excepción cuando una relación no tiene clave primaria", () => {
        const programaMR = programa(definición(relación("CLIENTE")));
        expect(() => validador.ejecutarsePara(programaMR, null)).toThrow(ErroresValidaciónMR);
    });

    it("se levanta una excepción con el nombre de la relación que carece de clave primaria", () => {
        const programaMR = programa(definición(relación("PEDIDO")));
        expect(() => validador.ejecutarsePara(programaMR, null)).toThrow("Falta clave primaria en 'PEDIDO'.");
    });

    it("se levanta una excepción cuando la inserción tiene distinta cantidad de valores que atributos", () => {
        const programaMR = programa(
            definición(relación("CLIENTE", pk("id"), simple("nombre"))),
            inserción("CLIENTE", fila(1)),
        );
        expect(() => validador.ejecutarsePara(programaMR, null)).toThrow(ErroresValidaciónMR);
    });

    it("se levanta una excepción con todos los errores de las relaciones que carecen de clave primaria", () => {
        const programaMR = programa(
            definición(relación("CLIENTE")),
            definición(relación("PEDIDO")),
        );
        expect(() => validador.ejecutarsePara(programaMR, null)).toThrow("Falta clave primaria en 'CLIENTE'.");
        expect(() => validador.ejecutarsePara(programaMR, null)).toThrow("Falta clave primaria en 'PEDIDO'.");
    });

    it("la etapa semántica acepta un programa bien formado cuando cada relación tiene su entidad en el MER", () => {
        const programaMR = programa(definición(relación("CLIENTE", pk("id"))));
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        const validado = validador.ejecutarsePara(programaMR, modeloER);
        expect(validado.sentencias).toEqual(programaMR.sentencias);
    });

    it("la etapa semántica acepta inserciones sobre relaciones presentes en el MER", () => {
        const programaMR = programa(
            definición(relación("CLIENTE", pk("id"), simple("nombre"))),
            inserción("CLIENTE", fila(1, "Ana")),
        );
        const modeloER = mer(entidad("CLIENTE", ["id"], ["nombre"]));
        const validado = validador.ejecutarsePara(programaMR, modeloER);
        expect(validado.sentencias).toEqual(programaMR.sentencias);
    });

    it("se levanta una excepción cuando una relación no tiene entidad correspondiente en el MER", () => {
        const programaMR = programa(definición(relación("FANTASMA", pk("id"))));
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        expect(() => validador.ejecutarsePara(programaMR, modeloER)).toThrow(ErroresValidaciónMR);
    });

    it("se levanta una excepción con el nombre de la relación que no tiene entidad en el MER", () => {
        const programaMR = programa(definición(relación("FANTASMA", pk("id"))));
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        expect(() => validador.ejecutarsePara(programaMR, modeloER)).toThrow("La relación 'FANTASMA' no tiene correspondencia en el MER.");
    });

    it("se levanta una excepción cuando se inserta en una relación sin entidad en el MER", () => {
        const programaMR = programa(
            definición(relación("CLIENTE", pk("id"))),
            inserción("FANTASMA", fila(1)),
        );
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        expect(() => validador.ejecutarsePara(programaMR, modeloER)).toThrow(ErroresValidaciónMR);
    });

    it("se levanta una excepción con el nombre de la relación cuya inserción no tiene entidad en el MER", () => {
        const programaMR = programa(
            definición(relación("CLIENTE", pk("id"))),
            inserción("FANTASMA", fila(1)),
        );
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        expect(() => validador.ejecutarsePara(programaMR, modeloER)).toThrow("No se puede insertar en 'FANTASMA': no tiene correspondencia en el MER.");
    });

    it("se levanta una única excepción con errores internos y de consistencia con el MER", () => {
        const programaMR = programa(
            definición(relación("CLIENTE")),
            definición(relación("FANTASMA", pk("id"))),
        );
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        expect(() => validador.ejecutarsePara(programaMR, modeloER)).toThrow("Falta clave primaria en 'CLIENTE'.");
        expect(() => validador.ejecutarsePara(programaMR, modeloER)).toThrow("La relación 'FANTASMA' no tiene correspondencia en el MER.");
    });

    it("se levanta una excepción de consistencia con el MER aunque el programa sea internamente válido", () => {
        const programaMR = programa(
            definición(relación("CLIENTE", pk("id"))),
            inserción("FANTASMA", fila(1)),
        );
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        expect(() => validador.ejecutarsePara(programaMR, modeloER)).toThrow("No se puede insertar en 'FANTASMA': no tiene correspondencia en el MER.");
    });

    it("se levanta una excepción con errores internos y de consistencia cuando ambos están presentes", () => {
        const programaMR = programa(
            definición(relación("CLIENTE")),
            inserción("FANTASMA", fila(1)),
        );
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        expect(() => validador.ejecutarsePara(programaMR, modeloER)).toThrow("Falta clave primaria en 'CLIENTE'.");
        expect(() => validador.ejecutarsePara(programaMR, modeloER)).toThrow("No se puede insertar en 'FANTASMA': no tiene correspondencia en el MER.");
    });
});