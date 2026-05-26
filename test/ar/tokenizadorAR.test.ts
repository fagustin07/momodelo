import {describe, expect, it} from "vitest";
import {tiposEn, tokenizar} from "./helpers.ts";
import {TipoTokenAR} from "../../src/tipos/tipos.ts";

describe("[Álgebra Relacional] Tokenizador AR", () => {
    it("un identificador simple se tokeniza como NOMBRE con su lexema como valor", () => {
        const tokens = tokenizar("PERSONA");
        expect(tokens[0].tipo).toBe<TipoTokenAR>("NOMBRE");
        expect(tokens[0].valor).toBe("PERSONA");
    });

    it("varios identificadores separados por espacios producen un NOMBRE por cada uno", () => {
        expect(tiposEn("PERSONA PEDIDO")).toEqual<TipoTokenAR[]>(["NOMBRE", "NOMBRE", "EOF"]);
    });

    it("los espacios en blanco son ignorados", () => {
        expect(tiposEn("  CLIENTE  ")).toEqual<TipoTokenAR[]>(["NOMBRE", "EOF"]);
    });

    it("la secuencia siempre termina con un token EOF", () => {
        const ultimo = (texto: string) => tokenizar(texto).slice(-1)[0].tipo;
        expect(ultimo("PERSONA")).toBe<TipoTokenAR>("EOF");
        expect(ultimo("")).toBe<TipoTokenAR>("EOF");
    });

    it("un carácter desconocido produce un token DESCONOCIDO con ese carácter como valor", () => {
        const tokens = tokenizar("@");
        expect(tokens[0].tipo).toBe<TipoTokenAR>("DESCONOCIDO");
        expect(tokens[0].valor).toBe("@");
    });

    it("nombres con tildes y ñ se reconocen como NOMBRE", () => {
        expect(tiposEn("Dirección Ñoño")).toEqual<TipoTokenAR[]>(["NOMBRE", "NOMBRE", "EOF"]);
    });

    it("la posición de cada token refleja su índice de inicio en el texto original", () => {
        const tokens = tokenizar("PERSONA PEDIDO");
        expect(tokens[0].posicion).toBe(0);
        expect(tokens[1].posicion).toBe(8);
    });
});
