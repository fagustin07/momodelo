import {describe, expect, it} from "vitest";
import {ComparadorMR} from "../../src/mr/comparadorMR.ts";
import {ErroresValidación} from "../../src/servicios/errores.ts";
import {definición, entidad, fila, inserción, mer, pk, programa, relación, simple} from "./helpers.ts";

describe("[Modelo Relacional] Comparador MR", () => {
    const comparador = new ComparadorMR();

    it("el comparador no lanza excepciones si las entidades del MER coinciden con las relaciones y PKs del MR", () => {
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        const modeloMR = programa(definición(relación("cliente", pk("id"))));
        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });

    it("el comparador levanta una excepción si falta al menos una relación correspondiente a una entidad del MER", () => {
        const modeloER = mer(entidad("PIRATA"));
        const modeloMR = programa();
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("Falta la relación 'PIRATA' en el modelo relacional.");
    });

    it("el comparador levanta una excepción si las claves primarias de alguna relación no coinciden con las de la entidad", () => {
        const modeloER = mer(entidad("FRUTA", ["codigo"]));
        const modeloMR = programa(definición(relación("FRUTA", pk("id"))));
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("La relación 'FRUTA' tiene una clave primaria incorrecta.");
    });

    it("el comparador ignora los atributos multivaluados del MER en el esquema MR", () => {
        const modeloER = mer(entidad("BARCO", ["id"], ["nombre"], ["tripulantes"]));
        const modeloMR = programa(definición(relación("BARCO", pk("id"), simple("nombre"))));
        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });

    it("el comparador levanta una excepción si faltan atributos simples de la entidad en el MR", () => {
        const modeloER = mer(entidad("BARCO", ["id"], ["nombre"]));
        const modeloMR = programa(definición(relación("BARCO", pk("id"))));
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("La relación 'BARCO' no contiene los mismos atributos simples que la entidad.");
    });

    it("el comparador valida múltiples entidades del MER contra sus esquemas relacionales", () => {
        const modeloER = mer(entidad("CLIENTE", ["id"]), entidad("VENTA", ["nro"]));
        const modeloMR = programa(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("VENTA", pk("nro")))
        );
        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });

    it("el comparador acumula errores de múltiples entidades inconsistentes en una única excepción", () => {
        const modeloER = mer(entidad("CLIENTE", ["id"]), entidad("VENTA", ["nro"]));
        const modeloMR = programa();
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("Falta la relación 'CLIENTE' en el modelo relacional.");
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("Falta la relación 'VENTA' en el modelo relacional.");
    });

    it("se levanta una excepción cuando se define una relación en el MR que no tiene correspondencia en el MER", () => {
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        const modeloMR = programa(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("FANTASMA", pk("id"))),
        );
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("La relación 'FANTASMA' no tiene correspondencia en el MER.");
    });

    it("se levanta una excepción cuando se describe una inserción en una relación sin correspondencia en el MER", () => {
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        const modeloMR = programa(
            definición(relación("CLIENTE", pk("id"))),
            inserción("FANTASMA", fila(1)),
        );
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("No se puede insertar en 'FANTASMA': no tiene correspondencia en el MER.");
    });

    it("el comparador acumula los errores del MER y del MR para levantar una única excepción", () => {
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        const modeloMR = programa(inserción("FANTASMA", fila(1)));
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("Falta la relación 'CLIENTE' en el modelo relacional.");
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("No se puede insertar en 'FANTASMA': no tiene correspondencia en el MER.");
    });
});