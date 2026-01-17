import {coordenada, Posicion} from "../posicion";
import {generadorDeIDs} from "../servicios/generadorDeIDs.ts";
import {ElementoMER} from "./elementoMER.ts";

export class Atributo extends ElementoMER {
    private readonly _id: number;
    private _nombre: string;
    private _esPK: boolean = false;
    private _alCambiarLaPK: (() => void)[] = [];

    constructor(nombre: string = 'ATRIBUTO', posicion: Posicion = coordenada(0,0), esPK = false) {
        super(posicion);
        this._nombre = nombre;
        this._id = generadorDeIDs.tomarID();
        this._esPK = esPK;
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

    esPK() {
        return this._esPK;
    }

    marcarPK() {
        this._esPK = true;
        this._notificarCambio();
    }

    desmarcarPK() {
        this._esPK = false;
        this._notificarCambio();
    }

    alCambiarLaPK(callback: () => void) {
        this._alCambiarLaPK.push(callback);
    }

    private _notificarCambio() {
        this._alCambiarLaPK.forEach(callback => callback());
    }
}
