import {Posicion} from "./posicion.ts";

export class Entidad {
    private _nombre: string;
    private _atributos: string[];
    private _posicion: Posicion;

    constructor(nombre: string, atributos: string[], posicion: Posicion) {
        this._nombre = nombre;
        this._posicion = posicion;
        this._atributos = atributos;
    }

    cambiarNombre(nuevoNombre: string) {
        this._nombre = nuevoNombre;
    }

    agregarAtributo(nuevoAtributo: string) {
        this._atributos.push(nuevoAtributo);
        return this._atributos.length - 1;
    }

    renombrarAtributo(idAtributo: number, nuevoNombre: string) {
        this._atributos[idAtributo] = nuevoNombre;
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

    nombreAtributo(idAtributo: number) {
        return this._atributos[idAtributo];
    }

    moverseHacia(delta: Posicion) {
        this._posicion = this._posicion.plus(delta);
    }
}