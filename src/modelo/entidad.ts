import {Posicion} from "../posicion";
import {Atributo} from "./atributo.ts";

export class Entidad {
    private _nombre: string;
    private _atributos: Atributo[];
    private _posicion: Posicion;

    constructor(nombre: string = 'ENTIDAD', atributos: Atributo[], posicion: Posicion) {
        this._nombre = nombre;
        this._posicion = posicion;
        this._atributos = atributos;
    }

    cambiarNombre(nuevoNombre: string) {
        return new Entidad(nuevoNombre, this._atributos, this._posicion);
    }

    agregarAtributo(nombreDeNuevoAtributo: string) {
        const nuevoAtributo = new Atributo(nombreDeNuevoAtributo);
        this._atributos.push(nuevoAtributo);
        return nuevoAtributo;
    }

    renombrarAtributo(atributo: Atributo, nuevoNombre: string) {
        this._atributos = this._atributos.filter(atributoListado => atributoListado !== atributo);
        return this.agregarAtributo(nuevoNombre);
    }

    atributos() {
        return this._atributos;
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

    eliminarAtributo(atributoAEliminar: Atributo) {
        this._atributos = this._atributos.filter(atributo => atributoAEliminar !== atributo);
    }
}

