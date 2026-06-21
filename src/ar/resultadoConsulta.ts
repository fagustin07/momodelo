import {claveDeTupla, TuplaAR} from "./tuplaAR.ts";

export class ResultadoConsulta {
    readonly nombre: string;
    readonly atributos: ReadonlyArray<string>;
    private readonly _tuplas: ReadonlyArray<TuplaAR>;

    constructor(nombre: string, atributos: string[], tuplas: Array<TuplaAR>) {
        const visto = new Set<string>();
        const tuplasSinRepetidos = tuplas.filter(t => {
            const clave = claveDeTupla(t, atributos);
            if (visto.has(clave)) return false;
            visto.add(clave);
            return true;
        });
        this.nombre = nombre;
        this.atributos = atributos;
        this._tuplas = tuplasSinRepetidos;
    }

    get tuplas(): ReadonlyArray<TuplaAR> {
        return this._tuplas;
    }

    filtrar(predicado: (t: TuplaAR) => boolean): ResultadoConsulta {
        return new ResultadoConsulta("", [...this.atributos], this._tuplas.filter(predicado));
    }
}