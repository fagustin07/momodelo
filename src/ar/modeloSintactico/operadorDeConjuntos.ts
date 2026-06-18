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
        const conjuntoOperandoIzquierda = this.izq.interpretarseCon(modelo);
        const conjuntoOperandoDerecha = this.der.interpretarseCon(modelo);

        this._validarGradoCompatibilidad(conjuntoOperandoIzquierda, conjuntoOperandoDerecha);

        const esquemaDerecho = this._esquemaDerechoRenombrado(conjuntoOperandoIzquierda, conjuntoOperandoDerecha);

        return this.operar(
            conjuntoOperandoIzquierda,
            new ResultadoConsulta("",
                [...esquemaDerecho],
                this._renombrarConjunto(
                    conjuntoOperandoDerecha.tuplas,
                    conjuntoOperandoDerecha.atributos,
                    esquemaDerecho
                )
            )
        );
    }

    protected abstract nombre(): string;

    protected abstract operar(operandoIzquierdo: ResultadoConsulta, operandoDerecho: ResultadoConsulta): ResultadoConsulta;

    protected _validarGradoCompatibilidad(operandoIzquierdo: ResultadoConsulta, operandoDerecho: ResultadoConsulta): void {
        if (operandoIzquierdo.atributos.length !== operandoDerecho.atributos.length) {
            throw new ErrorSemánticoAR(`${this.nombre()}: las relaciones tienen grado incompatible.`);
        }
    }

    protected _esquemaDerechoRenombrado(operandoIzquierdo: ResultadoConsulta, _operandoDerecho: ResultadoConsulta): readonly string[] {
        return operandoIzquierdo.atributos;
    }

    protected _renombrarConjunto(tuplas: ReadonlyArray<Record<string, Valor>>, esquemaActual: readonly string[], esquemaRenombrado: readonly string[]): Record<string, Valor>[] {
        return tuplas.map(tupla =>
            Object.fromEntries(
                esquemaRenombrado.map((nombre, i) => [nombre, tupla[esquemaActual[i]]]),
            ),
        );
    }
}

export class Unión extends OperadorDeConjuntos {
    protected nombre(): string {
        return "Unión";
    }

    protected operar(operandoIzquierdo: ResultadoConsulta, operandoDerecho: ResultadoConsulta): ResultadoConsulta {
        return new ResultadoConsulta("", [...operandoIzquierdo.atributos], [...operandoIzquierdo.tuplas, ...operandoDerecho.tuplas]);
    }
}

export class Intersección extends OperadorDeConjuntos {
    protected nombre(): string {
        return "Intersección";
    }

    protected operar(operandoIzquierdo: ResultadoConsulta, operandoDerecho: ResultadoConsulta): ResultadoConsulta {
        const enComún = operandoIzquierdo.tuplas.filter(a =>
            operandoDerecho.tuplas.some(b => mismaTupla(a, b, operandoIzquierdo.atributos))
        );
        return new ResultadoConsulta("", [...operandoIzquierdo.atributos], enComún);
    }
}

export class Resta extends OperadorDeConjuntos {
    protected nombre(): string {
        return "Resta";
    }

    protected operar(operandoIzquierdo: ResultadoConsulta, operandoDerecho: ResultadoConsulta): ResultadoConsulta {
        const soloEnIzq = operandoIzquierdo.tuplas.filter(a =>
            !operandoDerecho.tuplas.some(b => mismaTupla(a, b, operandoIzquierdo.atributos))
        );
        return new ResultadoConsulta("", [...operandoIzquierdo.atributos], soloEnIzq);
    }
}

function mismaTupla(a: Record<string, Valor>, b: Record<string, Valor>, atributos: readonly string[]): boolean {
    return atributos.every(attr => a[attr] === b[attr]);
}