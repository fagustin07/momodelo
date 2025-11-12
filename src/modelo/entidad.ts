import {coordenada, Posicion} from "../posicion";
import {Atributo} from "./atributo.ts";
import {generadorDeIDs} from "../servicios/generadorDeIDs.ts";
import {ElementoMER} from "./elementoMER.ts";

export class Entidad extends ElementoMER {
    private readonly _id: number;
    private _nombre: string;
    private _atributos: Atributo[];

    constructor(nombre: string = 'ENTIDAD', atributos: Atributo[], posicion: Posicion = coordenada(0,0)) {
        super(posicion);
        this._nombre = nombre;
        this._atributos = atributos;
        this._id = generadorDeIDs.tomarID();
    }

    cambiarNombre(nuevoNombre: string) {
        this._nombre = nuevoNombre;
    }

    agregarAtributo(nombreDeNuevoAtributo: string, posicion: Posicion = coordenada(0,0)) {
        const nuevoAtributo = new Atributo(nombreDeNuevoAtributo, posicion);
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

    eliminarAtributo(atributoAEliminar: Atributo) {
        this._atributos = this._atributos.filter(atributo => atributoAEliminar !== atributo);
    }
}

