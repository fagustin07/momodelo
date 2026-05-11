import {FilaMR, RelacionMR} from "./modeloSintacticoMR.ts";

export abstract class SentenciaMR {
    esDefinición(): boolean {
        return false;
    }

    esInserción(): boolean {
        return false;
    }

    abstract validarseCon(relacionesDefinidas: Map<string, RelacionMR>, errores: string[]): void;
}

export class DefiniciónRelación extends SentenciaMR {
    constructor(public readonly relacion: RelacionMR) {
        super();
    }

    esDefinición(): boolean {
        return true;
    }

    validarseCon(relacionesDefinidas: Map<string, RelacionMR>, errores: string[]): void {
        if (this.relacion.clavesPrimarias().isEmpty()) {
            errores.push(`Falta clave primaria en '${this.relacion.nombre}'.`);
        }
        relacionesDefinidas.set(this.relacion.nombre.toLowerCase(), this.relacion);
    }
}

export class InsertarEn extends SentenciaMR {
    constructor(
        public readonly nombreRelacion: string,
        public readonly filas: FilaMR[]
    ) {
        super();
    }

    esInserción(): boolean {
        return true;
    }

    validarseCon(relacionesDefinidas: Map<string, RelacionMR>, errores: string[]): void {
        const relacion = relacionesDefinidas.get(this.nombreRelacion.toLowerCase());
        if (relacion === undefined) {
            errores.push(`Relación '${this.nombreRelacion}' no definida.`);
        } else {
            this.filas.forEach((fila, index) => {
                if (fila.valores.length !== relacion.atributos.length) {
                    errores.push(`La ${index + 1}ª inserción en '${this.nombreRelacion}' tiene ${fila.valores.length} ${this._palabraParaTamañoAtributos(fila.valores.length)} pero la relación espera ${relacion.atributos.length}.`);
                }
            });
        }
    }

    private _palabraParaTamañoAtributos(cantidadDeAtributos: number): string {
        return cantidadDeAtributos === 1 ? 'atributo' : 'atributos';
    }
}