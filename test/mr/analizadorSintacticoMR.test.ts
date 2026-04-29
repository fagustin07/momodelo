import {describe, expect, it} from "vitest";
import {AnalizadorSintácticoMR} from "../../src/mr/analizadorSintacticoMR.ts";
import {AtributoPK} from "../../src/mr/modeloSintacticoMR.ts";
import {ErrorSintácticoMR} from "../../src/servicios/errores";

describe("[Modelo Relacional] Analizador Sintáctico", () => {
    const analizador = new AnalizadorSintácticoMR();

    it("el analizador reconoce múltiples relaciones con diversos espacios y saltos de línea", () => {
        const input = `
            ESTUDIANTE < legajo, nombre >
            PROFESOR < cuit >
        `;
        const modelo = analizador.analizarSintaxisDe(input);

        expect(modelo.relaciones).toHaveLength(2);
        expect(modelo.relaciones[0].nombre).toBe("ESTUDIANTE");
        expect(modelo.relaciones[1].nombre).toBe("PROFESOR");
    });

    it("el analizador falla lanzando ErrorSintácticoMR ante sintaxis inválida", () => {
        expect(() => analizador.analizarSintaxisDe("VACIA <>"))
            .toThrow(ErrorSintácticoMR);
    });

    it("el analizador informa el error esperado y la posición exacta", () => {
        expect(() => analizador.analizarSintaxisDe("VACIA <>"))
            .toThrow("Se esperaba nombre de un atributo en la fila 1, posición 8");
    });

    it("el analizador informa la línea correcta en errores multilínea", () => {
        const input = "REL1 < a1 >\nREL2 a2 >";
        expect(() => analizador.analizarSintaxisDe(input))
            .toThrow("Se esperaba '<' en la fila 2, posición 6");
    });

    it("el analizador falla si falta la coma entre atributos", () => {
        expect(() => analizador.analizarSintaxisDe("REL < a1 a2 >"))
            .toThrow("Se esperaba ',' en la fila 1, posición 10");
    });

    it("el analizador falla si hay una coma pero falta el nombre del atributo posterior", () => {
        expect(() => analizador.analizarSintaxisDe("REL < a1, >"))
            .toThrow("Se esperaba nombre de un atributo en la fila 1, posición 11");
    });

    it("el analizador reconoce atributos marcados como clave primaria", () => {
        const input = "ESTUDIANTE < legajo (PK \n ), nombre (PK) >";
        const modelo = analizador.analizarSintaxisDe(input);

        expect(modelo.relaciones[0].atributos[0]).toEqual(new AtributoPK("legajo"));
        expect(modelo.relaciones[0].atributos[1]).toEqual(new AtributoPK("nombre"));
    });


    it("el analizador falla si la restricción de clave primaria está mal formada", () => {
        expect(() => analizador.analizarSintaxisDe("REL < atr (PK >"))
            .toThrow("Se esperaba ')' en la fila 1, posición 15");


        expect(() => analizador.analizarSintaxisDe("REL < atr ( FK ) >"))
            .toThrow("Se esperaba 'PK' en la fila 1, posición 13");

        expect(() => analizador.analizarSintaxisDe("REL < atr PK ) >"))
            .toThrow("Se esperaba '(' en la fila 1, posición 11");

    });

    it("el analizador falla si una relación no comienza con un nombre", () => {
        expect(() => analizador.analizarSintaxisDe("< a1 >"))
            .toThrow("Se esperaba nombre de una relación en la fila 1, posición 1");
    });
});
