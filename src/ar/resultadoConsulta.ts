import {Valor} from "../mr/modeloSintacticoMR.ts";

export class ResultadoConsulta {
    readonly nombre: string;
    readonly atributos: ReadonlyArray<string>;
    private readonly _tuplas: ReadonlyArray<Record<string, Valor>>;

    constructor(nombre: string, atributos: string[], tuplas: Array<Record<string, Valor>>) {
        const visto = new Set<string>();
        const tuplasSinRepetidos = tuplas.filter(t => {
            const clave = JSON.stringify(atributos.map(a => t[a]));
            if (visto.has(clave)) return false;
            visto.add(clave);
            return true;
        });
        this.nombre = nombre;
        this.atributos = atributos;
        this._tuplas = tuplasSinRepetidos;
    }

    get tuplas(): ReadonlyArray<Record<string, Valor>> {
        return this._tuplas;
    }

    filtrar(predicado: (t: Record<string, Valor>) => boolean): ResultadoConsulta {
        return new ResultadoConsulta("", [...this.atributos], this._tuplas.filter(predicado));
    }
}