import {coordenada, Posicion} from "../posicion";
import {generadorDeIDs} from "../servicios/generadorDeIDs.ts";
import {ElementoMER} from "./elementoMER.ts";
import {TipoAtributo} from "../tipos/tipos.ts";

export class Atributo extends ElementoMER {
    private readonly _id: number;
    private _nombre: string;
    private _tipo: TipoAtributo = 'simple';
    private _alCambiarTipo: (() => void)[] = [];

    constructor(nombre: string = 'ATRIBUTO', posicion: Posicion = coordenada(0,0), tipo: TipoAtributo = 'simple') {
        super(posicion);
        this._nombre = nombre;
        this._id = generadorDeIDs.tomarID();
        this._tipo = tipo;
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

    tipo() {
        return this._tipo;
    }

    esPK() {
        return this._tipo === 'pk';
    }

    esMultivaluado() {
        return this._tipo === 'multivaluado';
    }

    cambiarTipo(nuevoTipo: TipoAtributo) {
        this._tipo = nuevoTipo;
        this._alCambiarTipo.forEach(callback => callback());
    }

    alCambiarTipo(callback: () => void) {
        this._alCambiarTipo.push(callback);
    }

    representaUnAtributo() {
        return true;
    }
}
