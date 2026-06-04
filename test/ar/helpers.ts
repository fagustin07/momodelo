import {expect} from "vitest";
import {analizarSintácticamente} from "../../src/ar/parserAR.ts";
import {TokenizadorAR} from "../../src/ar/tokenizadorAR.ts";
import {TipoTokenAR, TokenAR} from "../../src/tipos/tipos.ts";
import {ErrorSintácticoAR} from "../../src/servicios/errores.ts";

export function tokenizar(texto: string): TokenAR[] {
    return new TokenizadorAR().ejecutarseCon(texto);
}

export function tiposEn(texto: string): TipoTokenAR[] {
    return tokenizar(texto).map(t => t.tipo);
}

export function esperarErrorSintácticoAR(entrada: string, mensaje: string | RegExp): void {
    expect(() => analizarSintácticamente(entrada)).toThrow(ErrorSintácticoAR);
    expect(() => analizarSintácticamente(entrada)).toThrow(mensaje);
}

export function esperarAnálisisSintácticoAR(entrada: string, forma: object): void {
    expect(analizarSintácticamente(entrada)).toMatchObject(forma);
}
