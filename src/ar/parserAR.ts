import {TokenizadorAR} from "./tokenizadorAR.ts";
import {
    CondiciónAR,
    ComparaciónPrimitiva,
    CondiciónAtómica,
    Conjunción,
    Disyunción,
    ExpresiónAR,
    ExpresiónSelección,
    Literal,
    NombreAtributo,
    NombreDeRelación,
    Operando,
} from "./modeloSintácticoAR.ts";
import {elección, ReglaSintáctica, token, mapear, secuencia, seguidoDe} from "./combinadores.ts";
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

const términoCondición: ReglaSintáctica<CondiciónAR> = elección<CondiciónAR>([
    comparación,
    mapear(operando, op => new CondiciónAtómica(op))
]);

const condición: ReglaSintáctica<CondiciónAR> = (tokens, desde) => {
    return elección<CondiciónAR>([
        mapear(
            secuencia([
                términoCondición,
                elección<string>([token("AND"), token("OR")]),
                (toks, d) => condición(toks, d)
            ]),
            ([izq, conector, der]) => {
                if (conector === "∧") {
                    return new Conjunción(izq, der);
                } else {
                    return new Disyunción(izq, der);
                }
            }
        ),
        términoCondición
    ])(tokens, desde);
};

const nombreDeRelación: ReglaSintáctica<NombreDeRelación> = mapear(
    token("NOMBRE"),
    v => new NombreDeRelación(v)
);

let expresión: ReglaSintáctica<ExpresiónAR>;

const selección: ReglaSintáctica<ExpresiónSelección> = mapear(
    secuencia([
        token("SIGMA"),
        token("LANGLE"),
        condición,
        token("RANGLE"),
        (toks, d) => expresión(toks, d)
    ]),
    ([_sigma, _langle, cond, _rangle, subexpr]) => new ExpresiónSelección(cond, subexpr)
);

expresión = elección<ExpresiónAR>([selección, nombreDeRelación]);

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
        throw new ErrorSintácticoAR(`Se esperaba una expresión pero se encontró '${primero.valor}'.`);
    }

    const siguiente = tokens[resultadoExpr.posición];
    if (siguiente.tipo !== "EOF") {
        throw new ErrorSintácticoAR(`Se esperaba fin de consulta pero se encontró '${siguiente.valor}'.`);
    }

    return resultadoExpr.valor;
}
