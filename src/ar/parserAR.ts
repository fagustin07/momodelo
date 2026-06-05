import {TokenizadorAR} from "./tokenizadorAR.ts";
import {
    CondiciónAR,
    ComparaciónPrimitiva,
    CondiciónAtómica,
    Conjunción,
    Disyunción,
    ExpresiónAR,
    ExpresiónProyección,
    ExpresiónSelección,
    Literal,
    NombreAtributo,
    NombreDeRelación,
    Operando,
} from "./modeloSintácticoAR.ts";
import {elección, encadenar, ReglaSintáctica, token, mapear, secuencia, seguidoDe} from "./combinadores.ts";
import {ErrorSintácticoAR} from "../servicios/errores.ts";

const operando: ReglaSintáctica<NombreAtributo | Literal> = elección<NombreAtributo | Literal>([
    mapear(token("NOMBRE"), v => new NombreAtributo(v)),
    mapear(token("NUMERO"), v => new Literal(Number(v))),
    mapear(token("CADENA"), v => new Literal(v)),
    mapear(token("VERDADERO"), () => new Literal(true)),
    mapear(token("FALSO"), () => new Literal(false))
]);

const operadorComp: ReglaSintáctica<string> = elección<string>([
    token("OP_COMP"),
    token("LANGLE"),
    token("RANGLE")
]);

const finDeCondición: ReglaSintáctica<string> = elección<string>([
    token("RPAREN"),
    token("RANGLE"),
    token("AND"),
    token("OR")
]);

const comparación: ReglaSintáctica<ComparaciónPrimitiva> = (tokens, desde) => {
    const res = secuencia([
        operando,
        operadorComp,
        operando,
        seguidoDe(finDeCondición)
    ])(tokens, desde);

    if (!res) return null;

    const [izq, op, der] = res.valor;
    return {
        valor: new ComparaciónPrimitiva(izq as Operando, op as string, der as Operando),
        posición: res.posición
    };
};

let condición: ReglaSintáctica<CondiciónAR>;

const condiciónAgrupada: ReglaSintáctica<CondiciónAR> = mapear(
    secuencia([
        token("LPAREN"),
        (toks, d) => condición(toks, d),
        token("RPAREN"),
    ]),
    ([_lp, cond, _rp]) => cond,
);

const términoCondición: ReglaSintáctica<CondiciónAR> = elección<CondiciónAR>([
    condiciónAgrupada,
    comparación,
    mapear(operando, op => new CondiciónAtómica(op))
]);

condición = encadenar<CondiciónAR, string>(
    términoCondición,
    elección<string>([token("AND"), token("OR")]),
    (izq, op, der) => op === "∧" ? new Conjunción(izq, der) : new Disyunción(izq, der),
);

const nombreDeRelación: ReglaSintáctica<NombreDeRelación> = mapear(
    token("NOMBRE"),
    v => new NombreDeRelación(v)
);

let expresión: ReglaSintáctica<ExpresiónAR>;

const expresiónAgrupada: ReglaSintáctica<ExpresiónAR> = mapear(
    secuencia([
        token("LPAREN"),
        (toks, d) => expresión(toks, d),
        token("RPAREN"),
    ]),
    ([_lp, expr, _rp]) => expr,
);

const expresiónAtómica: ReglaSintáctica<ExpresiónAR> = elección<ExpresiónAR>([
    expresiónAgrupada,
    nombreDeRelación,
]);

const listaDeAtributos: ReglaSintáctica<string[]> = encadenar<string[], null>(
    mapear(token("NOMBRE"), v => [v]),
    mapear(token("COMA"), () => null),
    (acum, _sep, der) => [...acum, ...der],
);

const proyección: ReglaSintáctica<ExpresiónProyección> = mapear(
    secuencia([
        token("PI"),
        token("LANGLE"),
        listaDeAtributos,
        token("RANGLE"),
        (toks, d) => expresión(toks, d),
    ]),
    ([_pi, _langle, attrs, _rangle, subexpr]) => new ExpresiónProyección(attrs, subexpr),
);

const selección: ReglaSintáctica<ExpresiónSelección> = mapear(
    secuencia([
        token("SIGMA"),
        token("LANGLE"),
        (toks, d) => condición(toks, d),
        token("RANGLE"),
        (toks, d) => expresión(toks, d)
    ]),
    ([_sigma, _langle, cond, _rangle, subexpr]) => new ExpresiónSelección(cond, subexpr)
);

const términoExpresión: ReglaSintáctica<ExpresiónAR> = elección<ExpresiónAR>([
    selección,
    proyección,
    expresiónAtómica,
]);

expresión = términoExpresión;

export function analizarSintácticamente(texto: string): ExpresiónAR {
    const tokens = new TokenizadorAR().ejecutarseCon(texto);

    const resultadoExpr = expresión(tokens, 0);
    if (resultadoExpr === null) {
        const primero = tokens[0];
        if (primero.tipo === "EOF") {
            throw new ErrorSintácticoAR("La consulta está vacía.");
        }
        if (primero.tipo === "SIGMA") {
            throw new ErrorSintácticoAR("σ: se esperaba '<condición>expresión'.");
        }
        if (primero.tipo === "PI") {
            throw new ErrorSintácticoAR("π: se esperaba '<listaDeAtributos>expresión'.");
        }
        throw new ErrorSintácticoAR(`Se esperaba una expresión pero se encontró '${primero.valor}'.`);
    }

    const siguiente = tokens[resultadoExpr.posición];
    if (siguiente.tipo !== "EOF") {
        throw new ErrorSintácticoAR(`Se esperaba fin de consulta pero se encontró '${siguiente.valor}'.`);
    }

    return resultadoExpr.valor;
}