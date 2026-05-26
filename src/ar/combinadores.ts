import {TipoTokenAR, TokenAR} from "../tipos/tipos.ts";
import {ExpresiónAR} from "./modeloSintácticoAR.ts";

export type ResultadoSintáctico = { valor: ExpresiónAR; posición: number } | null;
export type ReglaSintáctica = (tokens: TokenAR[], desde: number) => ResultadoSintáctico;

export function tokenMapeado(tipo: TipoTokenAR, callback: (tokAR: TokenAR) => ExpresiónAR): ReglaSintáctica {
    return (tokens, desde) => {
        const token = tokens[desde];
        if (!token || token.tipo !== tipo) {
            return null;
        } else {
            return {valor: callback(token), posición: desde + 1};
        }
    };
}
