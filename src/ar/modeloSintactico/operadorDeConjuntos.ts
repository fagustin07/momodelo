import {ResultadoConsulta} from "../resultadoConsulta.ts";
import {Valor} from "../../mr/modeloSintacticoMR.ts";
import {ModeloRelacionalMaterializado} from "../../mr/modeloRelacionalMaterializado.ts";
import {ErrorSemánticoAR} from "../../servicios/errores.ts";
import {ExpresiónAR} from "../modeloSintácticoAR.ts";

export abstract class OperadorDeConjuntos extends ExpresiónAR {
    constructor(readonly izq: ExpresiónAR, readonly der: ExpresiónAR) {
        super();
    }

    interpretarseCon(modelo: ModeloRelacionalMaterializado): ResultadoConsulta {
        const izqRes = this.izq.interpretarseCon(modelo);
        const derRes = this.der.interpretarseCon(modelo);
        if (izqRes.atributos.length !== derRes.atributos.length) {
            throw new ErrorSemánticoAR(`${this.nombre()}: las relaciones tienen grado incompatible.`);
        }
        const derReatribuidas = this._reatribuir(derRes.tuplas, derRes.atributos, izqRes.atributos);
        return this.operar(izqRes, derReatribuidas);
    }

    protected abstract nombre(): string;

    protected abstract operar(izqRes: ResultadoConsulta, derReatribuidas: Record<string, Valor>[]): ResultadoConsulta;

    private _reatribuir(tuplas: ReadonlyArray<Record<string, Valor>>, attrsViejos: readonly string[], attrsNuevos: readonly string[]): Record<string, Valor>[] {
        return tuplas.map(t => {
            const nueva: Record<string, Valor> = {};
            attrsNuevos.forEach((nombre, i) => {
                nueva[nombre] = t[attrsViejos[i]];
            });
            return nueva;
        });
    }
}

export class Unión extends OperadorDeConjuntos {
    protected nombre(): string {
        return "Unión";
    }

    protected operar(izqRes: ResultadoConsulta, derReatribuidas: Record<string, Valor>[]): ResultadoConsulta {
        return new ResultadoConsulta("", [...izqRes.atributos], [...izqRes.tuplas, ...derReatribuidas]);
    }
}

export class Intersección extends OperadorDeConjuntos {
    protected nombre(): string {
        return "Intersección";
    }

    protected operar(izqRes: ResultadoConsulta, derReatribuidas: Record<string, Valor>[]): ResultadoConsulta {
        const enComún = izqRes.tuplas.filter(a =>
            derReatribuidas.some(b => mismaTupla(a, b, izqRes.atributos))
        );
        return new ResultadoConsulta("", [...izqRes.atributos], enComún);
    }
}

export class Resta extends OperadorDeConjuntos {
    protected nombre(): string {
        return "Resta";
    }

    protected operar(izqRes: ResultadoConsulta, derReatribuidas: Record<string, Valor>[]): ResultadoConsulta {
        const soloEnIzq = izqRes.tuplas.filter(a =>
            !derReatribuidas.some(b => mismaTupla(a, b, izqRes.atributos))
        );
        return new ResultadoConsulta("", [...izqRes.atributos], soloEnIzq);
    }
}

function mismaTupla(a: Record<string, Valor>, b: Record<string, Valor>, atributos: readonly string[]): boolean {
    return atributos.every(attr => a[attr] === b[attr]);
}