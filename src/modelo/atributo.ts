import {coordenada, Posicion} from "../posicion";
import {generadorDeIDs} from "../servicios/generadorDeIDs.ts";

export class Atributo {
    private readonly _id: number;
    private _nombre: string;
    private _posicion: Posicion;

    constructor(nombre: string = 'ATRIBUTO', posicion: Posicion = coordenada(0,0)) {
        this._nombre = nombre;
        this._posicion = posicion;
        this._id = generadorDeIDs.tomarID();
    }

    nombre() {
        return this._nombre;
    }

    posicion() {
        return this._posicion;
    }

    id() {
        return this._id;
    }

    moverseHacia(delta: Posicion) {
        this._posicion = this._posicion.plus(delta);
    }

    cambiarNombre(nuevoNombre: string) {
        this._nombre = nuevoNombre;
    }
}
