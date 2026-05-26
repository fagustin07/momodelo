import {TokenizadorAR} from "./tokenizadorAR.ts";
import {ExpresiónAR, NombreDeRelación} from "./modeloSintácticoAR.ts";
import {tokenMapeado, ReglaSintáctica} from "./combinadores.ts";
import {ErrorSintácticoAR} from "../servicios/errores.ts";

const parsearNombreDeRelación: ReglaSintáctica = tokenMapeado("NOMBRE", t => new NombreDeRelación(t.valor));

const parsearExpresión: ReglaSintáctica = parsearNombreDeRelación;

export function parsearConsulta(texto: string): ExpresiónAR {
    const tokens = new TokenizadorAR().ejecutarseCon(texto);

    const resultadoExpr = parsearExpresión(tokens, 0);
    if (resultadoExpr === null) {
        throw new ErrorSintácticoAR("Se esperaba el nombre de una relación pero la consulta está vacía.");
    }

    const siguiente = tokens[resultadoExpr.posición];
    if (siguiente.tipo !== "EOF") {
        throw new ErrorSintácticoAR(`Se esperaba fin de consulta pero se encontró '${siguiente.valor}'.`);
    }

    return resultadoExpr.valor;
}
