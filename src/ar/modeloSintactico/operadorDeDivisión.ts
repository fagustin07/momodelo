import {ResultadoConsulta} from "../resultadoConsulta.ts";
import {ErrorSemánticoAR} from "../../servicios/errores.ts";
import {OperadorDeConjuntos} from "./operadorDeConjuntos.ts";
import {valoresDeTuplaDesdeEsquema, proyectarTupla, TuplaAR} from "../tuplaAR.ts";

type GrupoDelDividendo = {
    candidata: TuplaAR;
    valoresDelDivisorQueCubre: Set<string>;
};

export class División extends OperadorDeConjuntos {
    protected nombre(): string {
        return "División";
    }

    protected operar(operandoIzquierdo: ResultadoConsulta, operandoDerecho: ResultadoConsulta): ResultadoConsulta {
        const gradoDelResultado = operandoIzquierdo.atributos.length - operandoDerecho.atributos.length;
        const esquemaResultado = operandoIzquierdo.atributos.slice(0, gradoDelResultado);
        return new ResultadoConsulta(
            "",
            [...esquemaResultado],
            this._tuplasQueCubrenTodoElDivisor(
                operandoIzquierdo.tuplas,
                operandoDerecho.tuplas,
                esquemaResultado,
                operandoIzquierdo.atributos.slice(gradoDelResultado)
            )
        );
    }

    protected _validarGradoCompatibilidad(operandoIzquierdo: ResultadoConsulta, operandoDerecho: ResultadoConsulta): void {
        if (operandoDerecho.atributos.length >= operandoIzquierdo.atributos.length) {
            throw new ErrorSemánticoAR(
                "División: el esquema del divisor no puede tener el mismo/mayor grado que el esquema del dividendo.",
            );
        }
    }

    protected _esquemaDerechoRenombrado(operandoIzquierdo: ResultadoConsulta, operandoDerecho: ResultadoConsulta): readonly string[] {
        const cantColsDivisor = operandoDerecho.atributos.length;
        return operandoIzquierdo.atributos.slice(operandoIzquierdo.atributos.length - cantColsDivisor);
    }

    private _tuplasQueCubrenTodoElDivisor(
        tuplasDelDividendo: ReadonlyArray<TuplaAR>,
        tuplasDelDivisor: ReadonlyArray<TuplaAR>,
        esquemaDelResultado: readonly string[],
        esquemaImplicadoEnLaDivisiónDelDividendo: readonly string[]
    ): TuplaAR[] {
        return this._filtrarCandidatasQueCubrenElDivisor(
            this._agruparDividendo(
                tuplasDelDividendo, esquemaDelResultado, esquemaImplicadoEnLaDivisiónDelDividendo,
            ),
            tuplasDelDivisor,
            esquemaImplicadoEnLaDivisiónDelDividendo
        );
    }

    private _agruparDividendo(
        tuplas: ReadonlyArray<TuplaAR>,
        esquemaResultado: readonly string[],
        esquemaImplicadoEnLaDivisiónDelDividendo: readonly string[]
    ): GrupoDelDividendo[] {
        return [...this._agruparPorClaveDelResultado(tuplas, esquemaResultado).values()]
            .map(tuplasDelGrupo =>
                this._crearGrupoDelDividendo(
                    tuplasDelGrupo, esquemaResultado, esquemaImplicadoEnLaDivisiónDelDividendo,
                )
            );
    }

    private _agruparPorClaveDelResultado(
        tuplas: ReadonlyArray<TuplaAR>,
        esquemaResultado: readonly string[],
    ): Map<string, TuplaAR[]> {
        return Map.groupBy(tuplas, tupla => valoresDeTuplaDesdeEsquema(tupla, esquemaResultado));
    }

    private _crearGrupoDelDividendo(
        tuplasDelGrupo: TuplaAR[],
        esquemaResultado: readonly string[],
        esquemaImplicadoEnLaDivisiónDelDividendo: readonly string[],
    ): GrupoDelDividendo {
        return {
            candidata: proyectarTupla(tuplasDelGrupo[0], esquemaResultado),
            valoresDelDivisorQueCubre: new Set(
                tuplasDelGrupo.map(tupla =>
                    valoresDeTuplaDesdeEsquema(tupla, esquemaImplicadoEnLaDivisiónDelDividendo)
                ),
            )
        };
    }

    private _filtrarCandidatasQueCubrenElDivisor(
        gruposDelDividendo: GrupoDelDividendo[],
        tuplasDelDivisor: ReadonlyArray<TuplaAR>,
        esquemaImplicadoEnLaDivisiónDelDividendo: readonly string[],
    ): TuplaAR[] {
        return gruposDelDividendo
            .filter(grupo =>
                this._grupoCubreTodoElDivisor(
                    grupo,
                    tuplasDelDivisor,
                    esquemaImplicadoEnLaDivisiónDelDividendo
                )
            )
            .map(grupo => ({...grupo.candidata}));
    }

    private _grupoCubreTodoElDivisor(
        grupo: GrupoDelDividendo,
        tuplasDelDivisor: ReadonlyArray<TuplaAR>,
        esquemaImplicadoEnLaDivisiónDelDividendo: readonly string[],
    ): boolean {
        return tuplasDelDivisor.every(
            tuplaDivisor =>
                grupo.valoresDelDivisorQueCubre.has(
                    valoresDeTuplaDesdeEsquema(
                        tuplaDivisor,
                        esquemaImplicadoEnLaDivisiónDelDividendo
                    )
                )
        );
    }
}