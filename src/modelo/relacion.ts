import {Entidad} from "./entidad";
import {Posicion} from "../posicion";

export class Relacion {
    private _nombre: string;
    private readonly _entidadOrigen: Entidad;
    private readonly _entidadDestino: Entidad;
    private _posicion: Posicion;

    constructor(nombre: string, entidad1: Entidad, entidad2: Entidad, posicion: Posicion) {
        this._nombre = nombre;
        this._entidadOrigen = entidad1;
        this._entidadDestino = entidad2;
        this._posicion = posicion;
    }

    nombre() {
        return this._nombre;
    }

    cambiarNombre(nuevoNombre: string) {
        return new Relacion(nuevoNombre, this._entidadOrigen, this._entidadDestino, this._posicion);
    }

    posicion() {
        return this._posicion;
    }

    moverseHacia(delta: Posicion) {
        this._posicion = this._posicion.plus(delta);
    }

    entidades() {
        return [this._entidadOrigen, this._entidadDestino];
    }

    contieneA(entidad: Entidad): boolean {
        return this._entidadOrigen === entidad || this._entidadDestino === entidad;
    }

    cambiarReferenciaA(entidad: Entidad): Relacion {
        if (this._entidadOrigen === entidad) {
            return new Relacion(this._nombre, entidad, this._entidadDestino, this._posicion);
        } else if (this._entidadOrigen === entidad) {
            return new Relacion(this._nombre, this._entidadOrigen, entidad, this._posicion);
        } else {
            return this;
        }
    }
}
