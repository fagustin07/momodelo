import {coordenada, Posicion} from "../posicion";
import {Atributo} from "./atributo.ts";
import {generadorDeIDs} from "../servicios/generadorDeIDs.ts";

export class Entidad {
    private readonly _id: number;
    private _nombre: string;
    private _atributos: Atributo[];
    private _posicion: Posicion;

    constructor(nombre: string = 'ENTIDAD', atributos: Atributo[], posicion: Posicion = coordenada(0,0)) {
        this._nombre = nombre;
        this._posicion = posicion;
        this._atributos = atributos;
        this._id = generadorDeIDs.tomarID();
    }

    cambiarNombre(nuevoNombre: string) {
        this._nombre = nuevoNombre;
    }

    agregarAtributo(nombreDeNuevoAtributo: string) {
        const nuevoAtributo = new Atributo(nombreDeNuevoAtributo, this.posicion().plus(coordenada(0, 20)));
        this._atributos.push(nuevoAtributo);
        return nuevoAtributo;
    }

    renombrarAtributo(atributo: Atributo, nuevoNombre: string) {
        this._atributos.find(atributoListado => atributoListado === atributo)!.cambiarNombre(nuevoNombre);
    }

    atributos() {
        return this._atributos;
    }

    nombre() {
        return this._nombre;
    }

    id() {
        return this._id;
    }

    posicion() {
        return this._posicion;
    }

    moverseHacia(delta: Posicion) {
        this._posicion = this._posicion.plus(delta);
    }

    eliminarAtributo(atributoAEliminar: Atributo) {
        this._atributos = this._atributos.filter(atributo => atributoAEliminar !== atributo);
    }
}

