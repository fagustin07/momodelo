import {ResultadoConsulta} from "../resultadoConsulta.ts";
import {Valor} from "../../mr/modeloSintacticoMR.ts";
import {ErrorSemánticoAR} from "../../servicios/errores.ts";
import {OperadorDeConjuntos} from "./operadorDeConjuntos.ts";

type GrupoDelDividendo = {
    candidata: Record<string, Valor>;
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
        tuplasDelDividendo: ReadonlyArray<Record<string, Valor>>,
        tuplasDelDivisor: ReadonlyArray<Record<string, Valor>>,
        esquemaDelResultado: readonly string[],
        esquemaImplicadoEnLaDivisiónDelDividendo: readonly string[]
    ): Record<string, Valor>[] {
        return this._filtrarCandidatasQueCubrenElDivisor(
            this._agruparDividendo(
                tuplasDelDividendo, esquemaDelResultado, esquemaImplicadoEnLaDivisiónDelDividendo,
            ),
            tuplasDelDivisor,
            esquemaImplicadoEnLaDivisiónDelDividendo
        );
    }

    private _agruparDividendo(
        tuplas: ReadonlyArray<Record<string, Valor>>,
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
        tuplas: ReadonlyArray<Record<string, Valor>>,
        esquemaResultado: readonly string[],
    ): Map<string, Record<string, Valor>[]> {
        return Map.groupBy(tuplas, tupla => this._clave(tupla, esquemaResultado));
    }

    private _crearGrupoDelDividendo(
        tuplasDelGrupo: Record<string, Valor>[],
        esquemaResultado: readonly string[],
        esquemaImplicadoEnLaDivisiónDelDividendo: readonly string[],
    ): GrupoDelDividendo {
        return {
            candidata: this._proyectarTupla(tuplasDelGrupo[0], esquemaResultado),
            valoresDelDivisorQueCubre: new Set(
                tuplasDelGrupo.map(tupla =>
                    this._clave(tupla, esquemaImplicadoEnLaDivisiónDelDividendo)
                ),
            )
        };
    }

    private _filtrarCandidatasQueCubrenElDivisor(
        gruposDelDividendo: GrupoDelDividendo[],
        tuplasDelDivisor: ReadonlyArray<Record<string, Valor>>,
        esquemaImplicadoEnLaDivisiónDelDividendo: readonly string[],
    ): Record<string, Valor>[] {
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
        tuplasDelDivisor: ReadonlyArray<Record<string, Valor>>,
        esquemaImplicadoEnLaDivisiónDelDividendo: readonly string[],
    ): boolean {
        return tuplasDelDivisor.every(
            tuplaDivisor =>
                grupo.valoresDelDivisorQueCubre.has(
                    this._clave(
                        tuplaDivisor,
                        esquemaImplicadoEnLaDivisiónDelDividendo
                    )
                )
        );
    }

    private _proyectarTupla(tupla: Record<string, Valor>, esquema: readonly string[]): Record<string, Valor> {
        return Object.fromEntries(esquema.map(atributo => [atributo, tupla[atributo]]));
    }

    private _clave(tupla: Record<string, Valor>, esquema: readonly string[]): string {
        return esquema.map(columna => tupla[columna].toString()).join("|");
    }
}