import {PATRON_NOMBRE, TokenAR} from "../tipos/tipos.ts";

export class TokenizadorAR {
    ejecutarseCon(texto: string): TokenAR[] {
        const tokens: TokenAR[] = [];
        let pos = 0;

        while (pos < texto.length) {
            if (/\s/.test(texto[pos])) {
                pos++;
                continue;
            }

            const nombre = PATRON_NOMBRE.exec(texto.slice(pos));
            if (nombre) {
                tokens.push({tipo: "NOMBRE", valor: nombre[0], posicion: pos});
                pos += nombre[0].length;
                continue;
            }

            tokens.push({tipo: "DESCONOCIDO", valor: texto[pos], posicion: pos});
            pos++;
        }

        tokens.push({tipo: "EOF", valor: "", posicion: pos});
        return tokens;
    }
}
