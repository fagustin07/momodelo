import {ResultadoConsulta} from "../resultadoConsulta.ts";
import {ModeloRelacionalMaterializado} from "../../mr/modeloRelacionalMaterializado.ts";
import {ErrorSemánticoAR} from "../../servicios/errores.ts";
import {CondiciónAR, ExpresiónAR} from "../modeloSintácticoAR.ts";

export abstract class OperadorDeCombinación extends ExpresiónAR {
    constructor(readonly izq: ExpresiónAR, readonly der: ExpresiónAR) {
        super();
    }

    interpretarseCon(modelo: ModeloRelacionalMaterializado): ResultadoConsulta {
        const izqRes = this.izq.interpretarseCon(modelo);
        const derRes = this.der.interpretarseCon(modelo);

        izqRes.atributos.forEach(attr => {
            if (derRes.atributos.includes(attr)) {
                throw new ErrorSemánticoAR(
                    `Ambigüedad en ${this._nombre()}: el atributo '${attr}' existe en ambas relaciones.`,
                );
            }
        });

        return this._combinar(izqRes, derRes);
    }

    protected abstract _nombre(): string;

    protected abstract _combinar(izqRes: ResultadoConsulta, derRes: ResultadoConsulta): ResultadoConsulta;
}

export class ProductoCartesiano extends OperadorDeCombinación {
    protected _nombre(): string {
        return "producto cartesiano";
    }

    protected _combinar(izqRes: ResultadoConsulta, derRes: ResultadoConsulta): ResultadoConsulta {
        const tuplas = izqRes.tuplas.flatMap(tR =>
            derRes.tuplas.map(tS => ({ ...tR, ...tS })),
        );

        return new ResultadoConsulta("", [...izqRes.atributos, ...derRes.atributos], tuplas);
    }
}

export class JoinCondicional extends OperadorDeCombinación {
    constructor(izq: ExpresiónAR, readonly condición: CondiciónAR, der: ExpresiónAR) {
        super(izq, der);
    }

    protected _nombre(): string {
        return "join condicional";
    }

    protected _combinar(izqRes: ResultadoConsulta, derRes: ResultadoConsulta): ResultadoConsulta {
        const combinadas = izqRes.tuplas.flatMap(tR =>
            derRes.tuplas.map(tS => ({ ...tR, ...tS })),
        );

        const tuplas = combinadas.filter(t => this.condición.evaluarCon(t));

        return new ResultadoConsulta("", [...izqRes.atributos, ...derRes.atributos], tuplas);
    }
}