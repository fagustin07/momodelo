import {Entidad} from "./entidad";
import {Posicion} from "../posicion";

export class Relacion {
    private _nombre: string;
    private readonly _entidadOrigen: Entidad;
    private readonly _entidadDestino: Entidad;
    private _posicion: Posicion;

    constructor(nombre: string, entidadOrigen: Entidad, entidadDestino: Entidad, posicion: Posicion) {
        this._nombre = nombre;
        this._entidadOrigen = entidadOrigen;
        this._entidadDestino = entidadDestino;
        this._posicion = posicion;
    }

    nombre() {
        return this._nombre;
    }

    cambiarNombre(nuevoNombre: string) {
        this._nombre = nuevoNombre;
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

}
