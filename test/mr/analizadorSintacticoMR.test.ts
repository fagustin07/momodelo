import {describe, expect, it} from "vitest";
import {AnalizadorSintácticoMR} from "../../src/mr/analizadorSintacticoMR.ts";
import {AtributoPK, FilaMR} from "../../src/mr/modeloSintacticoMR.ts";
import {ErrorSintácticoMR} from "../../src/servicios/errores";

describe("[Modelo Relacional] Analizador Sintáctico", () => {
    const analizador = new AnalizadorSintácticoMR();

    it("el analizador reconoce múltiples relaciones con diversos espacios y saltos de línea", () => {
        const input = `
            ESTUDIANTE < legajo, nombre >
            PROFESOR < cuit >
        `;
        const modelo = analizador.analizarSintaxisDe(input);

        expect(modelo.relaciones()).toHaveLength(2);
        expect(modelo.relaciones()[0].nombre).toBe("ESTUDIANTE");
        expect(modelo.relaciones()[1].nombre).toBe("PROFESOR");
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

        expect(modelo.relaciones()[0].atributos[0]).toEqual(new AtributoPK("legajo"));
        expect(modelo.relaciones()[0].atributos[1]).toEqual(new AtributoPK("nombre"));
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

    it("una sentencia INSERTAR EN con literales de cadena genera una fila con esos valores", () => {
        const programa = analizador.analizarSintaxisDe(
            "INSERTAR EN Persona<('Juan', 'Pérez')>"
        );

        expect(programa.inserciones()).toHaveLength(1);
        const insercion = programa.inserciones()[0];
        expect(insercion.esInserción()).toBeTruthy();
        expect(insercion.nombreRelacion).toBe("Persona");
        expect(insercion.filas).toHaveLength(1);
        expect(insercion.filas[0]).toEqual(new FilaMR(["Juan", "Pérez"]));
    });

    it("los literales numéricos y booleanos dentro de una fila conservan su tipo", () => {
        const programa = analizador.analizarSintaxisDe(
            "INSERTAR EN Empleado<('Ana', 30, verdadero)>"
        );

        const insercion = programa.inserciones()[0];
        expect(insercion.filas[0]).toEqual(new FilaMR(["Ana", 30, true]));
    });

    it("true y false son alias en inglés equivalentes a verdadero y falso en inserciones", () => {
        const programa = analizador.analizarSintaxisDe(
            "INSERTAR EN T<(true, false)>"
        );

        expect(programa.inserciones()[0].filas[0]).toEqual(new FilaMR([true, false]));
    });

    it("una sentencia INSERTAR EN puede contener múltiples filas separadas por coma", () => {
        const programa = analizador.analizarSintaxisDe(
            "INSERTAR EN Persona<('Juan', 25), ('María', 30)>"
        );

        const insercion = programa.inserciones()[0];
        expect(insercion.filas).toHaveLength(2);
        expect(insercion.filas[0]).toEqual(new FilaMR(["Juan", 25]));
        expect(insercion.filas[1]).toEqual(new FilaMR(["María", 30]));
    });

    it("definiciones de relaciones e inserciones de datos pueden coexistir en el mismo programa conservando su orden", () => {
        const programa = analizador.analizarSintaxisDe(`
                Persona < dni(PK), nombre >
                INSERTAR EN Persona<('12345678', 'Juan')>
            `);

        expect(programa.relaciones()).toHaveLength(1);
        expect(programa.inserciones()).toHaveLength(1);
        expect(programa.sentencias[0].esDefinición()).toBeTruthy();
        expect(programa.sentencias[1].esInserción()).toBeTruthy();
    });

    it("múltiples sentencias de inserción para distintas relaciones se acumulan en el programa", () => {
        const programa = analizador.analizarSintaxisDe(`
                INSERTAR EN A<('x')>
                INSERTAR EN B<('y', 1)>
            `);

        expect(programa.inserciones()).toHaveLength(2);
        expect(programa.inserciones()[0].nombreRelacion).toBe("A");
        expect(programa.inserciones()[1].nombreRelacion).toBe("B");
    });

    it("INSERTAR EN se reconoce independientemente de la capitalización", () => {
        const programa = analizador.analizarSintaxisDe(
            "insertar en Persona<('Juan')>"
        );

        expect(programa.inserciones()).toHaveLength(1);
        expect(programa.inserciones()[0].nombreRelacion).toBe("Persona");
    });

    it("una sentencia INSERTAR EN sin nombre de relación es un error sintáctico", () => {
        expect(() => analizador.analizarSintaxisDe("INSERTAR EN <('x')>"))
            .toThrow(ErrorSintácticoMR);
    });

    it("una sentencia INSERTAR EN sin '<' de apertura es un error sintáctico", () => {
        expect(() => analizador.analizarSintaxisDe("INSERTAR EN Persona('x')>"))
            .toThrow(ErrorSintácticoMR);
    });

    it("una sentencia INSERTAR EN sin '>' de cierre es un error sintáctico", () => {
        expect(() => analizador.analizarSintaxisDe("INSERTAR EN Persona<('x')"))
            .toThrow(ErrorSintácticoMR);
    });

    it("una fila sin ')' de cierre es un error sintáctico", () => {
        expect(() => analizador.analizarSintaxisDe("INSERTAR EN Persona<('x'"))
            .toThrow(ErrorSintácticoMR);
    });

    it("un identificador como valor dentro de una inserción es un error sintáctico", () => {
        expect(() => analizador.analizarSintaxisDe("INSERTAR EN Persona<(nombreAtributo)>"))
            .toThrow(ErrorSintácticoMR);
    });

    it("los literales numéricos se representan como number en el árbol sintáctico", () => {
        const programa = analizador.analizarSintaxisDe("INSERTAR EN T<(42, 3.14)>");
        const fila = programa.inserciones()[0].filas[0];
        expect(fila.valores[0]).toBe(42);
        expect(fila.valores[1]).toBe(3.14);
    });
});
