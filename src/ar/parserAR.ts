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
} from "./modeloSintácticoAR.ts";
import {JoinCondicional, JoinNatural, ProductoCartesiano} from "./modeloSintactico/operadorDeCombinación.ts";
import {elección, encadenar, encadenarCon, muchos, ReglaSintáctica, soloDerecha, soloIzquierda, token, mapear, seguidoDe} from "./combinadores.ts";
import {ErrorSintácticoAR} from "../servicios/errores.ts";
import {Intersección, Resta, Unión} from "./modeloSintactico/operadorDeConjuntos.ts";
import {División} from "./modeloSintactico/operadorDeDivisión.ts";

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

const comparación = encadenarCon(operando, operandoIzquierda =>
    encadenarCon(operadorComp, operador =>
        encadenarCon(operando, operandoDerecha =>
            mapear(seguidoDe(finDeCondición), () =>
                new ComparaciónPrimitiva(operandoIzquierda, operador, operandoDerecha)
            )
        )
    )
);

let condición: ReglaSintáctica<CondiciónAR>;

const condiciónAgrupada = encadenarCon(token("LPAREN"), () =>
    soloIzquierda(condición, token("RPAREN"))
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

const expresiónAgrupada = encadenarCon(token("LPAREN"), () =>
    soloIzquierda(expresión, token("RPAREN"))
);

const expresiónAtómica: ReglaSintáctica<ExpresiónAR> = elección<ExpresiónAR>([
    expresiónAgrupada,
    nombreDeRelación,
]);

const listaDeAtributos = encadenarCon(token("NOMBRE"), primerNombre =>
    mapear(
        muchos(soloDerecha(token("COMA"), token("NOMBRE"))),
        resto => [primerNombre, ...resto],
    )
);

const proyección = soloDerecha(token("PI"),
    soloDerecha(token("LANGLE"),
        encadenarCon(listaDeAtributos, atributos =>
            soloDerecha(token("RANGLE"),
                mapear(términoExpresión, subexpresión =>
                    new ExpresiónProyección(atributos, subexpresión)
                )
            )
        )
    )
);

const selección = soloDerecha(token("SIGMA"),
    soloDerecha(token("LANGLE"),
        encadenarCon(condición, condiciónValor =>
            soloDerecha(token("RANGLE"),
                mapear(términoExpresión, subexpresión =>
                    new ExpresiónSelección(condiciónValor, subexpresión)
                )
            )
        )
    )
);

const términoExpresión: ReglaSintáctica<ExpresiónAR> = elección<ExpresiónAR>([
    selección,
    proyección,
    expresiónAtómica,
]);

const operadorProducto = mapear(token("PRODUCT"), () =>
    (izq: ExpresiónAR, der: ExpresiónAR) => new ProductoCartesiano(izq, der)
);

const operadorJoin = soloDerecha(token("BOWTIE"),
    soloDerecha(token("LANGLE"),
        encadenarCon(condición, condiciónValor =>
            mapear(token("RANGLE"), () =>
                (izq: ExpresiónAR, der: ExpresiónAR) => new JoinCondicional(izq, condiciónValor, der)
            )
        )
    )
);

const operadorJoinNatural = mapear(token("STAR"), () =>
    (izq: ExpresiónAR, der: ExpresiónAR) => new JoinNatural(izq, der)
);

const operadorDeCombinación = elección<(izq: ExpresiónAR, der: ExpresiónAR) => ExpresiónAR>([
    operadorProducto,
    operadorJoin,
    operadorJoinNatural,
]);

const expresiónDeCombinación = encadenar<ExpresiónAR, (izq: ExpresiónAR, der: ExpresiónAR) => ExpresiónAR>(
    términoExpresión,
    operadorDeCombinación,
    (izq, construir, der) => construir(izq, der),
);

const operadorConjunto: ReglaSintáctica<string> = elección<string>([
    token("UNION"),
    token("INTERSECTION"),
    token("DIFFERENCE"),
    token("DIVISION"),
]);

expresión = encadenar<ExpresiónAR, string>(
    expresiónDeCombinación,
    operadorConjunto,
    (izq, op, der) => {
        if (op === "∪") return new Unión(izq, der);
        if (op === "∩") return new Intersección(izq, der);
        if (op === "÷") return new División(izq, der);
        return new Resta(izq, der);
    },
);

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
        if (primero.tipo === "PRODUCT") {
            throw new ErrorSintácticoAR("×: se esperaba 'expresión × expresión'.");
        }
        if (primero.tipo === "BOWTIE") {
            throw new ErrorSintácticoAR("⋈: se esperaba 'expresión ⋈<condición> expresión'.");
        }
        if (primero.tipo === "STAR") {
            throw new ErrorSintácticoAR("*: se esperaba 'expresión * expresión'.");
        }
        throw new ErrorSintácticoAR(`Se esperaba una expresión pero se encontró '${primero.valor}'.`);
    }

    const siguiente = tokens[resultadoExpr.posición];
    if (siguiente.tipo !== "EOF") {
        throw new ErrorSintácticoAR(`Se esperaba fin de consulta pero se encontró '${siguiente.valor}'.`);
    }

    return resultadoExpr.valor;
}