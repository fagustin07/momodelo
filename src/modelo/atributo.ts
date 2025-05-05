import {Posicion} from "../posicion";

export class Atributo {
    private _nombre: string;
    private _posicion: Posicion;

    constructor(nombre: string = 'ATRIBUTO', posicion: Posicion) {
        this._nombre = nombre;
        this._posicion = posicion;
    }

    nombre() {
        return this._nombre;
    }

    posicion() {
        return this._posicion;
    }

    moverseHacia(delta: Posicion) {
        this._posicion = this._posicion.plus(delta);
    }

    cambiarNombre(nuevoNombre: string) {
        this._nombre = nuevoNombre;
    }
}
