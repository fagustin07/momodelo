import {Valor} from "../mr/modeloSintacticoMR.ts";

export class ResultadoConsulta {
    readonly nombre: string;
    readonly atributos: ReadonlyArray<string>;
    private readonly _tuplas: ReadonlyArray<Record<string, Valor>>;

    constructor(nombre: string, atributos: string[], tuplas: Array<Record<string, Valor>>) {
        this.nombre = nombre;
        this.atributos = atributos;
        this._tuplas = tuplas;
    }

    get tuplas(): ReadonlyArray<Record<string, Valor>> {
        return this._tuplas;
    }
}
