import {TipoTokenAR, TokenAR} from "../tipos/tipos.ts";

export type ResultadoSintáctico<T> = { valor: T; posición: number } | null;
export type ReglaSintáctica<T> = (tokens: TokenAR[], desde: number) => ResultadoSintáctico<T>;

export function token(tipo: TipoTokenAR): ReglaSintáctica<string> {
    return (tokens, desde) => {
        const tok = tokens[desde];
        if (tok && tok.tipo === tipo) {
            return { valor: tok.valor, posición: desde + 1 };
        }
        return null;
    };
}

export function mapear<T, R>(regla: ReglaSintáctica<T>, transformar: (valor: T) => R): ReglaSintáctica<R> {
    return (tokens, desde) => {
        const resultado = regla(tokens, desde);
        if (!resultado) return null;
        return { valor: transformar(resultado.valor), posición: resultado.posición };
    };
}

export function secuencia<T extends any[]>(reglas: { [K in keyof T]: ReglaSintáctica<T[K]> }): ReglaSintáctica<T> {
    return (tokens, desde) => {
        const valores: any[] = [];
        let posicionActual = desde;
        for (const regla of reglas) {
            const res = regla(tokens, posicionActual);
            if (!res) return null;
            valores.push(res.valor);
            posicionActual = res.posición;
        }
        return { valor: valores as T, posición: posicionActual };
    };
}

export function elección<T>(reglas: ReglaSintáctica<T>[]): ReglaSintáctica<T> {
    return (tokens, desde) => {
        for (const regla of reglas) {
            const resultado = regla(tokens, desde);
            if (resultado !== null) return resultado;
        }
        return null;
    };
}

export function seguidoDe(regla: ReglaSintáctica<any>): ReglaSintáctica<null> {
    return (tokens, desde) => {
        const res = regla(tokens, desde);
        if (res !== null) {
            return { valor: null, posición: desde };
        }
        return null;
    };
}
