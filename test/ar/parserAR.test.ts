import {describe, expect, it} from "vitest";
import {parsearConsulta} from "../../src/ar/parserAR.ts";
import {NombreDeRelación} from "../../src/ar/modeloSintácticoAR.ts";
import {ErrorSintácticoAR} from "../../src/servicios/errores.ts";

describe("[Álgebra Relacional] Parser AR", () => {
    it("un nombre de relación solo se parsea como NombreDeRelación con ese nombre", () => {
        const expr = parsearConsulta("PERSONA");
        expect(expr).toBeInstanceOf(NombreDeRelación);
        expect((expr as NombreDeRelación).nombre).toBe("PERSONA");
    });

    it("los espacios alrededor del nombre no afectan el resultado", () => {
        const expr = parsearConsulta("  CLIENTE  ");
        expect(expr).toBeInstanceOf(NombreDeRelación);
        expect((expr as NombreDeRelación).nombre).toBe("CLIENTE");
    });

    it("una consulta vacía lanza una excepción", () => {
        expect(() => parsearConsulta("")).toThrow(ErrorSintácticoAR);
    });

    it("una consulta vacía incluye mensaje descriptivo", () => {
        expect(() => parsearConsulta("")).toThrow("Se esperaba el nombre de una relación pero la consulta está vacía.");
    });

    it("dos nombres sin operador lanzan ErrorSintácticoAR", () => {
        expect(() => parsearConsulta("PERSONA PEDIDO")).toThrow(ErrorSintácticoAR);
    });

    it("el error por token inesperado menciona el nombre del token sobrante", () => {
        expect(() => parsearConsulta("PERSONA PEDIDO")).toThrow("Se esperaba fin de consulta pero se encontró 'PEDIDO'");
    });

    it("un carácter desconocido lanza ErrorSintácticoAR", () => {
        expect(() => parsearConsulta("@")).toThrow(ErrorSintácticoAR);
    });
});
