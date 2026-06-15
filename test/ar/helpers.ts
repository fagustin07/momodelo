import {expect} from "vitest";
import {analizarSintácticamente} from "../../src/ar/parserAR.ts";
import {TokenizadorAR} from "../../src/ar/tokenizadorAR.ts";
import {TipoTokenAR, TokenAR} from "../../src/tipos/tipos.ts";
import {ErrorSintácticoAR} from "../../src/servicios/errores.ts";
import {ResultadoConsulta} from "../../src/ar/resultadoConsulta.ts";
import {Valor} from "../../src/mr/modeloSintacticoMR.ts";
import {ExpresiónAR} from "../../src/ar/modeloSintácticoAR.ts";

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

export function esperarAnálisisSintácticoAR(
    entrada: string,
    clase: new (...args: any[]) => ExpresiónAR,
    forma: object,
): void {
    const resultado = analizarSintácticamente(entrada);
    expect(resultado).toBeInstanceOf(clase);
    expect(resultado).toMatchObject(forma);
}

export function esperarResultadoConsulta(
    resultado: ResultadoConsulta,
    esperado: ReadonlyArray<Record<string, Valor>>,
): void {
    expect(resultado.tuplas).toHaveLength(esperado.length);
    esperado.forEach(tuplaEsperada => {
        expect(resultado.tuplas).toContainEqual(tuplaEsperada);
    });
}