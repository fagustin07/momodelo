import { describe, expect, it } from "vitest";
import { TokenizadorMR } from "../../src/mr/tokenizadorMR";
import { TipoTokenMR, TokenMR } from "../../src/tipos/tipos.ts";

describe("Tokenizador MR", () => {
    const tokenizador = new TokenizadorMR();

    function tokenizar(texto: string): TokenMR[] {
        return tokenizador.ejecutarseCon(texto);
    }

    function tiposEn(texto: string): TipoTokenMR[] {
        return tokenizar(texto).map((t) => t.tipo);
    }

    function valores(texto: string): string[] {
        return tokenizar(texto).map((t) => t.valor);
    }

    it("el tokenizador debería reconocer todos los símbolos del lenguaje", () => {
        expect(tiposEn("< > { } ( ) ,")).toEqual<TipoTokenMR[]>([
            "LANGLE", "RANGLE", "LBRACE", "RBRACE", "LPAREN", "RPAREN", "COMA"
        ]);
    });

    it("el tokenizador debería reconocer PK y FK como palabras reservadas", () => {
        expect(tiposEn("PK FK")).toEqual<TipoTokenMR[]>(["PK", "FK"]);
    });

    it("el tokenizador debería reconocer identificadores simples", () => {
        expect(tiposEn("legajo")).toEqual<TipoTokenMR[]>(["NOMBRE"]);
        expect(valores("legajo")).toEqual(["legajo"]);
    });

    it("el tokenizador debería distinguir palabras reservadas de identificadores", () => {
        expect(tiposEn("PK legajo FK")).toEqual<TipoTokenMR[]>(["PK", "NOMBRE", "FK"]);
    });

    it("el tokenizador debería reconocer identificadores con tildes y eñes", () => {
        expect(valores("añoIngreso")).toEqual(["añoIngreso"]);
    });

    it("el tokenizador debería reconocer identificadores con ? solo al final de la palabra", () => {
        expect(valores("act?ivo")).toEqual(["act?","ivo"]);
    });

    it("el tokenizador debería omitir espacios en blanco y saltos de línea de la secuencia resultante", () => {
        expect(tiposEn("  legajo  <  nyAp  >\n")).toEqual<TipoTokenMR[]>(["NOMBRE", "LANGLE", "NOMBRE", "RANGLE"]);
    });

    it("el tokenizador debería saber retornar cadenas vacías", () => {
        expect(tokenizar("   \n\t  ")).toHaveLength(0);
    });

    it("el tokenizador debería registrar caracteres no reconocidos como desconocidos", () => {
        expect(tiposEn("@")).toEqual<TipoTokenMR[]>(["DESCONOCIDO"]);
    });

    it("el tokenizador debería registrar la posición de cada token en la cadena original", () => {
        const tokens = tokenizar("Estudiante<legajo");
        expect(tokens[0]).toMatchObject({ tipo: "NOMBRE", valor: "Estudiante", posicion: 0  });
        expect(tokens[1]).toMatchObject({ tipo: "LANGLE", valor: "<",          posicion: 10 });
        expect(tokens[2]).toMatchObject({ tipo: "NOMBRE", valor: "legajo",     posicion: 11 });
    });

    it("el tokenizador debería producir la secuencia completa de tokens de una entrada válida", () => {
        expect(tiposEn("Estudiante<legajo(PK), nyAp>")).toEqual<TipoTokenMR[]>([
            "NOMBRE", "LANGLE", "NOMBRE", "LPAREN", "PK", "RPAREN", "COMA", "NOMBRE", "RANGLE"
        ]);
    });

    it("el tokenizador debería tokenizar restricciones con múltiples claves", () => {
        expect(tiposEn("Cursa<legajo(PK, FK), codigo(PK, FK)>")).toEqual<TipoTokenMR[]>([
            "NOMBRE", "LANGLE", "NOMBRE", "LPAREN", "PK", "COMA", "FK", "RPAREN",
            "COMA", "NOMBRE", "LPAREN", "PK", "COMA", "FK", "RPAREN", "RANGLE"
        ]);
    });

    it("el tokenizador debería reconocer un atributo multivaluado junto a otros símbolos", () => {
        expect(tiposEn("{emails}")).toEqual<TipoTokenMR[]>(["LBRACE", "NOMBRE", "RBRACE"]);
        expect(tiposEn("{emails}(PK)")).toEqual<TipoTokenMR[]>(["LBRACE", "NOMBRE", "RBRACE", "LPAREN", "PK", "RPAREN"]);
    });

    it("el tokenizador es idempotente, es decir que debería producir el mismo resultado ante el mismo input", () => {
        const entrada = "Comision<nro(PK), codigo(PK,FK), {horario}>";
        expect(tokenizar(entrada)).toEqual(tokenizar(entrada));
    });
});
