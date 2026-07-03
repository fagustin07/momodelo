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

export function encadenarCon<ValorActual, ValorSiguiente>(
    analizadorSintáctico: ReglaSintáctica<ValorActual>,
    transformar: (valor: ValorActual) => ReglaSintáctica<ValorSiguiente>,
): ReglaSintáctica<ValorSiguiente> {
    return (tokens, desde) => {
        const resultado = analizadorSintáctico(tokens, desde);
        if (!resultado) return null;
        return transformar(resultado.valor)(tokens, resultado.posición);
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

export function anteceden(primerTokenEsperado: TipoTokenAR, segundoTokenEsperado: TipoTokenAR): ReglaSintáctica<null> {
    return (tokens, desde) => {
        if (tokens[desde]?.tipo === primerTokenEsperado && tokens[desde + 1]?.tipo === segundoTokenEsperado) {
            return {valor: null, posición: desde};
        }
        return null;
    };
}

export function muchos<Valor>(parser: ReglaSintáctica<Valor>): ReglaSintáctica<Valor[]> {
    return (tokens, desde) => {
        const valores: Valor[] = [];
        let posiciónActual = desde;
        while (true) {
            const resultado = parser(tokens, posiciónActual);
            if (!resultado) break;
            valores.push(resultado.valor);
            posiciónActual = resultado.posición;
        }
        return { valor: valores, posición: posiciónActual };
    };
}

export function soloDerecha<ValorIzquierda, ValorDerecha>(
    izquierda: ReglaSintáctica<ValorIzquierda>,
    derecha: ReglaSintáctica<ValorDerecha>,
): ReglaSintáctica<ValorDerecha> {
    return encadenarCon(izquierda, () => derecha);
}

export function soloIzquierda<ValorIzquierda, ValorDerecha>(
    izquierda: ReglaSintáctica<ValorIzquierda>,
    derecha: ReglaSintáctica<ValorDerecha>,
): ReglaSintáctica<ValorIzquierda> {
    return encadenarCon(izquierda, valorIzquierda =>
        mapear(derecha, () => valorIzquierda),
    );
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
