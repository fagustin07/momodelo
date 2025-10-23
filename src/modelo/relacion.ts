import {Entidad} from "./entidad";
import {coordenada, Posicion} from "../posicion";
import {generadorDeIDs} from "../servicios/generadorDeIDs.ts";
import {ElementoMER} from "./elementoMER.ts";

export class Relacion extends ElementoMER {
    private readonly _id: number;
    private readonly _entidadOrigen: Entidad;
    private readonly _entidadDestino: Entidad;
    private _nombre: string;

    constructor(nombre: string, entidadOrigen: Entidad, entidadDestino: Entidad, posicion: Posicion = coordenada(0,0)) {
        super(posicion);
        this._nombre = nombre;
        this._entidadOrigen = entidadOrigen;
        this._entidadDestino = entidadDestino;
        this._id = generadorDeIDs.tomarID();
    }

    nombre() {
        return this._nombre;
    }

    cambiarNombre(nuevoNombre: string) {
        this._nombre = nuevoNombre;
    }

    entidades() {
        return [this._entidadOrigen, this._entidadDestino];
    }

    entidadOrigen() {
        return this._entidadOrigen;
    }

    entidadDestino() {
        return this._entidadDestino;
    }

    id() {
        return this._id;
    }

    contieneA(entidad: Entidad): boolean {
        return this._entidadOrigen === entidad || this._entidadDestino === entidad;
    }
}
