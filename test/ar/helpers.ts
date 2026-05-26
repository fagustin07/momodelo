import {TokenizadorAR} from "../../src/ar/tokenizadorAR.ts";
import {TipoTokenAR, TokenAR} from "../../src/tipos/tipos.ts";

export function tokenizar(texto: string): TokenAR[] {
    return new TokenizadorAR().ejecutarseCon(texto);
}

export function tiposEn(texto: string): TipoTokenAR[] {
    return tokenizar(texto).map(t => t.tipo);
}
