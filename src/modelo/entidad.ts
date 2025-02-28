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
        this._nombre = nuevoNombre;
    }

    agregarAtributo(nombreDeNuevoAtributo: string) {
        // todo: listas inmutables
        const nuevoAtributo = new Atributo(nombreDeNuevoAtributo);
        this._atributos.push(nuevoAtributo);
        return nuevoAtributo;
    }

    renombrarAtributo(atributo: Atributo, nuevoNombre: string) {
        // todo: listas inmutables
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
        // todo: listas inmutables
        //  return new Entidad(
        //     this._nombre,
        //     this._atributos.filter(atributo => atributo !== atributoAEliminar),
        //     this._posicion
        // );
        this._atributos = this._atributos.filter(atributo => atributoAEliminar !== atributo);
    }
}

