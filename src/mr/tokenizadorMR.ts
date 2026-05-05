import {PALABRAS_RESERVADAS, PATRON_CADENA, PATRON_NOMBRE, PATRON_NUMERO, ResultadoReconocimiento, SIMBOLOS, TokenMR} from "../tipos/tipos.ts";

export class TokenizadorMR {

    ejecutarseCon(texto: string): TokenMR[] {
        const tokens: TokenMR[] = [];
        let pos = 0;
        while (pos < texto.length) {
            const {token, longitud} = this._reconocerEn(texto, pos);
            if (token) tokens.push(token);
            pos += longitud;
        }
        return tokens;
    }

    private _reconocerEn(texto: string, pos: number): ResultadoReconocimiento {
        const caracter = texto[pos];

        return (
            this._reconocerEspacio(caracter) ??
            this._reconocerCadena(texto, pos) ??
            this._reconocerNúmero(texto, pos) ??
            this._reconocerNombre(texto, pos) ??
            this._reconocerSímbolo(caracter, pos) ??
            this._reconocerDesconocido(caracter, pos)
        );
    }

    private _reconocerEspacio(caracter: string): ResultadoReconocimiento | null {
        return /\s/.test(caracter) ? {token: null, longitud: 1} : null;
    }

    private _reconocerNombre(texto: string, pos: number): ResultadoReconocimiento | null {
        const lexema = this._matchNombre(texto, pos);
        if (!lexema) return null;

        return {
            token: {tipo: PALABRAS_RESERVADAS[lexema.toUpperCase()] ?? "NOMBRE", valor: lexema, posicion: pos},
            longitud: lexema.length
        };
    }

    private _reconocerNúmero(texto: string, pos: number): ResultadoReconocimiento | null {
        const lexema = this._matchNúmero(texto, pos);
        if (!lexema) return null;
        return {
            token: {tipo: "NUMERO", valor: lexema, posicion: pos},
            longitud: lexema.length
        };
    }

    private _reconocerCadena(texto: string, pos: number): ResultadoReconocimiento | null {
        const match = PATRON_CADENA.exec(texto.slice(pos));
        if (!match) return null;
        return {
            token: {tipo: "CADENA", valor: match[1], posicion: pos},
            longitud: match[0].length
        };
    }

    private _reconocerSímbolo(caracter: string, pos: number): ResultadoReconocimiento | null {
        return caracter in SIMBOLOS ? {token: this._tokenSimbolo(caracter, pos), longitud: 1} : null;
    }

    private _reconocerDesconocido(caracter: string, pos: number): ResultadoReconocimiento {
        return {token: this._tokenDesconocido(caracter, pos), longitud: 1};
    }

    private _matchNombre(texto: string, pos: number): string | null {
        return this._matchPatrón(PATRON_NOMBRE, texto, pos);
    }

    private _matchNúmero(texto: string, pos: number): string | null {
        return this._matchPatrón(PATRON_NUMERO, texto, pos);
    }

    private _matchPatrón(patrón: RegExp, texto: string, pos: number): string | null {
        const match = patrón.exec(texto.slice(pos));
        return match ? match[0] : null;
    }

    private _tokenSimbolo(caracter: string, pos: number): TokenMR {
        return {tipo: SIMBOLOS[caracter], valor: caracter, posicion: pos};
    }

    private _tokenDesconocido(caracter: string, pos: number): TokenMR {
        return {tipo: "DESCONOCIDO", valor: caracter, posicion: pos};
    }
}