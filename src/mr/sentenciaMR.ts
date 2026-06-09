import {Fila, RelacionMR} from "./modeloSintacticoMR.ts";
import {ModeloRelacionalMaterializado, RelacionMaterializada} from "./modeloRelacionalMaterializado.ts";

export abstract class SentenciaMR {
    esDefinición(): boolean {
        return false;
    }

    esInserción(): boolean {
        return false;
    }

    abstract validarseCon(relacionesDefinidas: Map<string, RelacionMR>, errores: string[]): void;
    abstract interpretarseCon(modelo: ModeloRelacionalMaterializado): void;
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

        const duplicados = this.relacion.atributosDuplicados();
        if (!duplicados.isEmpty()) {
            errores.push(`La relación '${this.relacion.nombre}' tiene atributos duplicados: ${duplicados.map(d => `'${d}'`).join(', ')}.`);
        }

        this._validarClavesForáneas(relacionesDefinidas, errores);

        relacionesDefinidas.set(this.relacion.nombre.toLowerCase(), this.relacion);
    }

    interpretarseCon(modelo: ModeloRelacionalMaterializado): void {
        modelo.registrarRelacion(new RelacionMaterializada(this.relacion));
    }

    private _validarClavesForáneas(relacionesDefinidas: Map<string, RelacionMR>, errores: string[]): void {
        this.relacion.clavesForáneas()
            .filter(fk => !this._existePKReferenciada(fk.nombre, relacionesDefinidas))
            .forEach(fk => errores.push(
                `El atributo FK '${fk.nombre}' en '${this.relacion.nombre}' no referencia ninguna clave primaria existente al momento de definir la relación.`
            ));
    }

    private _existePKReferenciada(nombreFK: string, relacionesDefinidas: Map<string, RelacionMR>): boolean {
        nombreFK = nombreFK.toLowerCase();
        return [...relacionesDefinidas].some(([nombreRelacion, relacion]) =>
            nombreRelacion !== this.relacion.nombre.toLowerCase() &&
            relacion.clavesPrimarias().some(pk =>
                pk.nombre.toLowerCase() === nombreFK ||
                `${pk.nombre.toLowerCase()}_${nombreRelacion}` === nombreFK
            )
        );
    }
}

export class InsertarEn extends SentenciaMR {
    constructor(
        public readonly nombreRelacion: string,
        public readonly filas: Fila[]
    ) {
        super();
    }

    esInserción(): boolean {
        return true;
    }

    interpretarseCon(modelo: ModeloRelacionalMaterializado): void {
        this.filas.forEach(fila => modelo.obtenerRelacion(this.nombreRelacion).insertarFila(fila));
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