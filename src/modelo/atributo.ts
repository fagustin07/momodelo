import {coordenada, Posicion} from "../posicion";
import {generadorDeIDs} from "../servicios/generadorDeIDs.ts";
import {ElementoMER} from "./elementoMER.ts";

export class Atributo extends ElementoMER {
    private readonly _id: number;
    private _nombre: string;

    constructor(nombre: string = 'ATRIBUTO', posicion: Posicion = coordenada(0,0)) {
        super(posicion);
        this._nombre = nombre;
        this._id = generadorDeIDs.tomarID();
    }

    nombre() {
        return this._nombre;
    }

    id() {
        return this._id;
    }

    cambiarNombre(nuevoNombre: string) {
        this._nombre = nuevoNombre;
    }
}
