import {Fila, RelacionMR, Valor} from "./modeloSintacticoMR.ts";
import {ErrorPKDuplicada, MomodeloLogicaError} from "../servicios/errores.ts";

export class Tupla {
    private readonly _valores: Record<string, Valor>;
    private readonly _nombresPK: string[];

    constructor(fila: Fila, relacion: RelacionMR) {
        this._valores = {};
        relacion.atributos.forEach((atr, i) => {
            this._valores[atr.nombre] = fila.valores[i];
        });
        this._nombresPK = relacion.clavesPrimarias().map(a => a.nombre);
    }

    valor(atributo: string): Valor {
        return this._valores[atributo];
    }

    equals(other: Tupla): boolean {
        return Object.keys(this._valores).every(k => this._valores[k] === other._valores[k]);
    }

    comparteClavesPKCon(other: Tupla): boolean {
        return this._nombresPK.every(pk => this._valores[pk] === other.valor(pk));
    }

    valoresPK(): Valor[] {
        return this._nombresPK.map(pk => this._valores[pk]);
    }
}

export class RelacionMaterializada {
    private readonly _relacion: RelacionMR;
    private readonly _tuplas: Tupla[] = [];

    constructor(relacion: RelacionMR) {
        this._relacion = relacion;
    }

    get nombre(): string {
        return this._relacion.nombre;
    }

    get tuplas(): Tupla[] {
        return this._tuplas;
    }

    insertarFila(fila: Fila): void {
        const nueva = new Tupla(fila, this._relacion);

        if (this._tuplas.some(t => t.equals(nueva))) return;

        if (this._tuplas.some(t => nueva.comparteClavesPKCon(t))) {
            throw new ErrorPKDuplicada(this._relacion.nombre, nueva.valoresPK());
        }

        this._tuplas.push(nueva);
    }
}

export class ModeloRelacionalMaterializado {
    private readonly _relaciones = new Map<string, RelacionMaterializada>();

    registrarRelacion(relacion: RelacionMaterializada): void {
        this._relaciones.set(relacion.nombre.toLowerCase(), relacion);
    }

    obtenerRelacion(nombre: string): RelacionMaterializada {
        const relacion = this._relaciones.get(nombre.toLowerCase());
        if (relacion === undefined)
            throw new MomodeloLogicaError(`La relación '${nombre}' no existe en el modelo.`);
        return relacion;
    }

    relaciones(): RelacionMaterializada[] {
        return [...this._relaciones.values()];
    }
}
