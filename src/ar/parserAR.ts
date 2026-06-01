import {TokenizadorAR} from "./tokenizadorAR.ts";
import {
    CondiciónAR,
    ComparaciónPrimitiva,
    Conjunción,
    Disyunción,
    ExpresiónAR,
    ExpresiónSelección,
    Literal,
    NombreAtributo,
    NombreDeRelación,
} from "./modeloSintácticoAR.ts";
import {elección, ReglaSintáctica, tokenMapeado} from "./combinadores.ts";
import {ErrorSintácticoAR} from "../servicios/errores.ts";
import {TokenAR} from "../tipos/tipos.ts";

type ResultadoCondición = { condición: CondiciónAR; posición: number } | null;

function operando(tokens: TokenAR[], desde: number): {
    operando: NombreAtributo | Literal;
    posición: number
} | null {
    const tok = tokens[desde];
    if (!tok) return null;
    if (tok.tipo === "NOMBRE") return {operando: new NombreAtributo(tok.valor), posición: desde + 1};
    if (tok.tipo === "NUMERO") return {operando: new Literal(Number(tok.valor)), posición: desde + 1};
    if (tok.tipo === "CADENA") return {operando: new Literal(tok.valor), posición: desde + 1};
    if (tok.tipo === "VERDADERO") return {operando: new Literal(true), posición: desde + 1};
    if (tok.tipo === "FALSO") return {operando: new Literal(false), posición: desde + 1};
    return null;
}

function comparación(tokens: TokenAR[], desde: number): ResultadoCondición {
    const izq = operando(tokens, desde);
    if (!izq) return null;
    const opTok = tokens[izq.posición];
    const esOp = opTok && (opTok.tipo === "OP_COMP" || opTok.tipo === "LANGLE" || opTok.tipo === "RANGLE");
    if (!esOp) return null;
    const der = operando(tokens, izq.posición + 1);
    if (!der) return null;
    return {condición: new ComparaciónPrimitiva(izq.operando, opTok.valor, der.operando), posición: der.posición};
}

function condición(tokens: TokenAR[], desde: number): ResultadoCondición {
    const comp = comparación(tokens, desde);
    if (!comp) return null;
    const conector = tokens[comp.posición];
    if (conector?.tipo === "AND") {
        const der = condición(tokens, comp.posición + 1);
        if (!der) return null;
        return {condición: new Conjunción(comp.condición, der.condición), posición: der.posición};
    }
    if (conector?.tipo === "OR") {
        const der = condición(tokens, comp.posición + 1);
        if (!der) return null;
        return {condición: new Disyunción(comp.condición, der.condición), posición: der.posición};
    }
    return comp;
}

const nombreDeRelación: ReglaSintáctica = tokenMapeado("NOMBRE", t => new NombreDeRelación(t.valor));

let expresión: ReglaSintáctica;

const selección: ReglaSintáctica = (tokens, desde) => {
    if (tokens[desde]?.tipo !== "SIGMA") return null;
    if (tokens[desde + 1]?.tipo !== "LANGLE") return null;
    const cond = condición(tokens, desde + 2);
    if (!cond) return null;
    if (tokens[cond.posición]?.tipo !== "RANGLE") return null;
    const subexpr = expresión(tokens, cond.posición + 1);
    if (!subexpr) return null;
    return {valor: new ExpresiónSelección(cond.condición, subexpr.valor), posición: subexpr.posición};
};

expresión = elección([selección, nombreDeRelación]);

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
