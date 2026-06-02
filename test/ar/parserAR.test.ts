import {describe, expect, it} from "vitest";
import {analizarSintácticamente} from "../../src/ar/parserAR.ts";
import {ExpresiónSelección, NombreDeRelación} from "../../src/ar/modeloSintácticoAR.ts";

describe("[Álgebra Relacional] Parser AR", () => {
    it("un nombre de relación solo se parsea como NombreDeRelación con ese nombre", () => {
        const expr = analizarSintácticamente("PERSONA");
        expect(expr).toBeInstanceOf(NombreDeRelación);
        expect((expr as NombreDeRelación).nombre).toBe("PERSONA");
    });

    it("los espacios alrededor del nombre no afectan el resultado", () => {
        const expr = analizarSintácticamente("  CLIENTE  ");
        expect(expr).toBeInstanceOf(NombreDeRelación);
        expect((expr as NombreDeRelación).nombre).toBe("CLIENTE");
    });

    it("una consulta vacía lanza una excepción", () => {
        expect(() => analizarSintácticamente("")).toThrow("La consulta está vacía.");
    });

    it("dos nombres sin operador informa el token sobrante", () => {
        expect(() => analizarSintácticamente("PERSONA PEDIDO")).toThrow("Se esperaba fin de consulta pero se encontró 'PEDIDO'.");
    });

    it("un carácter desconocido informa qué se encontró", () => {
        expect(() => analizarSintácticamente("@")).toThrow("Se esperaba una expresión pero se encontró '@'.");
    });

    it("una selección con comparación de igualdad es una consulta válida", () => {
        expect(analizarSintácticamente("σ<marca='Quilmes'>Cerveza")).toBeInstanceOf(ExpresiónSelección);
    });

    it("una selección con comparación numérica mayor-que es una consulta válida", () => {
        expect(analizarSintácticamente("σ<grad>4.6>Cerveza")).toBeInstanceOf(ExpresiónSelección);
    });

    it("una selección con comparación de atributo contra atributo es una consulta válida", () => {
        expect(analizarSintácticamente("σ<precioMin<precioMax>Producto")).toBeInstanceOf(ExpresiónSelección);
    });

    it("una selección con comparación booleana es una consulta válida", () => {
        expect(analizarSintácticamente("σ<activo=TRUE>Usuario")).toBeInstanceOf(ExpresiónSelección);
    });

    it("una selección con atributo booleano directo es una consulta válida", () => {
        expect(analizarSintácticamente("σ<activo>Usuario")).toBeInstanceOf(ExpresiónSelección);
    });

    it("una selección con literal booleano directo es una consulta válida", () => {
        expect(analizarSintácticamente("σ<TRUE>Usuario")).toBeInstanceOf(ExpresiónSelección);
    });

    it("una selección con condición compuesta por intersección es una consulta válida", () => {
        expect(analizarSintácticamente("σ<variedad='Lager' ∧ grad>4.6>Cerveza")).toBeInstanceOf(ExpresiónSelección);
    });

    it("una selección con condición compuesta por disyunción es una consulta válida", () => {
        expect(analizarSintácticamente("σ<variedad='Lager' ∨ variedad='Stout'>Cerveza")).toBeInstanceOf(ExpresiónSelección);
    });

    it("se pueden anidar selecciones es una consulta válida", () => {
        expect(analizarSintácticamente("σ<grad>4.6>σ<variedad='Lager'>Cerveza")).toBeInstanceOf(ExpresiónSelección);
    });

    it("una selección sin condición informa que no tiene la estructura correcta", () => {
        expect(() => analizarSintácticamente("σ<>Cerveza")).toThrow("σ: se esperaba '<condición>expresión'.");
    });

    it("una selección sin cierre de condición informa que σ no tiene la estructura correcta", () => {
        expect(() => analizarSintácticamente("σ<marca='Quilmes'Cerveza")).toThrow("σ: se esperaba '<condición>expresión'.");
    });
});
