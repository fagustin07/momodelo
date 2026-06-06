import {TipoTokenAR, TokenAR} from "../tipos/tipos.ts";

export type ResultadoSintáctico<Valor> = { valor: Valor; posición: number } | null;
export type ReglaSintáctica<Valor> = (tokens: TokenAR[], desde: number) => ResultadoSintáctico<Valor>;

export function token(tipo: TipoTokenAR): ReglaSintáctica<string> {
    return (tokens, desde) => {
        const tok = tokens[desde];
        if (tok && tok.tipo === tipo) {
            return {valor: tok.valor, posición: desde + 1};
        }
        return null;
    };
}

export function mapear<ValorOriginal, ValorNuevo>(regla: ReglaSintáctica<ValorOriginal>, transformar: (valor: ValorOriginal) => ValorNuevo): ReglaSintáctica<ValorNuevo> {
    return (tokens, desde) => {
        const resultado = regla(tokens, desde);
        if (!resultado) return null;
        return {valor: transformar(resultado.valor), posición: resultado.posición};
    };
}

export function secuencia<T extends any[]>(reglas: { [K in keyof T]: ReglaSintáctica<T[K]> }): ReglaSintáctica<T> {
export function secuencia<Tupla extends any[]>(reglas: { [K in keyof Tupla]: ReglaSintáctica<Tupla[K]> }): ReglaSintáctica<Tupla> {
    return (tokens, desde) => {
        const valores: any[] = [];
        let posicionActual = desde;
        for (const regla of reglas) {
            const res = regla(tokens, posicionActual);
            if (!res) return null;
            valores.push(res.valor);
            posicionActual = res.posición;
        }
        return {valor: valores as Tupla, posición: posicionActual};
    };
}

export function elección<Valor>(reglas: ReglaSintáctica<Valor>[]): ReglaSintáctica<Valor> {
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
            return {valor: null, posición: desde};
        }
        return null;
    };
}

export function encadenar<ValorTérmino, ValorSeparador>(término: ReglaSintáctica<ValorTérmino>, separador: ReglaSintáctica<ValorSeparador>, combinar: (izq: ValorTérmino, sep: ValorSeparador, der: ValorTérmino) => ValorTérmino): ReglaSintáctica<ValorTérmino> {
    const restoDeCadena = (tokens: TokenAR[], desde: number, acumulado: ValorTérmino): ResultadoSintáctico<ValorTérmino> => {
        const sep = separador(tokens, desde);
        if (sep === null) return {valor: acumulado, posición: desde};
        const sig = término(tokens, sep.posición);
        if (sig === null) return {valor: acumulado, posición: desde};
        return restoDeCadena(tokens, sig.posición, combinar(acumulado, sep.valor, sig.valor));
    };
    return (tokens, desde) => {
        const primero = término(tokens, desde);
        if (primero === null) return null;
        return restoDeCadena(tokens, primero.posición, primero.valor);
    };
}
