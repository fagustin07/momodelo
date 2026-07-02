import {valoresDeTuplaDesdeEsquema, TuplaAR} from "./tuplaAR.ts";
import {ErrorSemánticoAR} from "../servicios/errores.ts";

export class ResultadoConsulta {
    readonly nombre: string;
    readonly atributos: ReadonlyArray<string>;
    private readonly _tuplas: ReadonlyArray<TuplaAR>;

    constructor(nombre: string, atributos: string[], tuplas: Array<TuplaAR>) {
        const visto = new Set<string>();
        const tuplasSinRepetidos = tuplas.filter(t => {
            const clave = valoresDeTuplaDesdeEsquema(t, atributos);
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

    asertarAtributosExistentes(nombres: Iterable<string>): this {
        for (const nombre of nombres) {
            if (!this.atributos.includes(nombre)) {
                throw new ErrorSemánticoAR(
                    `El atributo '${nombre}' no existe en la relación.`
                );
            }
        }
        return this;
    }

    renombrarAtributos(mapeo: Map<string, string>): ResultadoConsulta {
        const nuevosAtributos = this.atributos.map(attr => mapeo.get(attr) ?? attr);

        const tuplasRenombradas = this._tuplas.map(tupla =>
            Object.fromEntries(
                this.atributos.map((attr, i) => [nuevosAtributos[i], tupla[attr]])
            ) as TuplaAR
        );

        return new ResultadoConsulta(this.nombre, [...nuevosAtributos], [...tuplasRenombradas]);
    }
}