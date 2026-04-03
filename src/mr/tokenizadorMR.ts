import {PALABRAS_RESERVADAS, PATRON_NOMBRE, ResultadoReconocimiento, SIMBOLOS, TokenMR} from "../tipos/tipos.ts";

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
            token: {tipo: PALABRAS_RESERVADAS[lexema] ?? "NOMBRE", valor: lexema, posicion: pos},
            longitud: lexema.length
        };
    }

    private _reconocerSímbolo(caracter: string, pos: number): ResultadoReconocimiento | null {
        return caracter in SIMBOLOS ? {token: this._tokenSimbolo(caracter, pos), longitud: 1} : null;
    }

    private _reconocerDesconocido(caracter: string, pos: number): ResultadoReconocimiento {
        return {token: this._tokenDesconocido(caracter, pos), longitud: 1};
    }

    private _matchNombre(texto: string, pos: number): string | null {
        const match = PATRON_NOMBRE.exec(texto.slice(pos));
        return match ? match[0] : null;
    }

    private _tokenSimbolo(caracter: string, pos: number): TokenMR {
        return {tipo: SIMBOLOS[caracter], valor: caracter, posicion: pos};
    }

    private _tokenDesconocido(caracter: string, pos: number): TokenMR {
        return {tipo: "DESCONOCIDO", valor: caracter, posicion: pos};
    }
}