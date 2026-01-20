import {coordenada, Posicion} from "../posicion";
import {generadorDeIDs} from "../servicios/generadorDeIDs.ts";
import {ElementoMER} from "./elementoMER.ts";

export class Atributo extends ElementoMER {
    private readonly _id: number;
    private _nombre: string;
    private _esPK: boolean = false;
    private _esMultivaluado: boolean = false;
    private _alCambiarLaPK: (() => void)[] = [];
    private _alCambiarElSerMultivaluado: (() => void)[] = [];

    constructor(nombre: string = 'ATRIBUTO', posicion: Posicion = coordenada(0,0), esPK = false, esMultivaluado = false) {
        super(posicion);
        this._nombre = nombre;
        this._id = generadorDeIDs.tomarID();
        this._esPK = esPK;
        this._esMultivaluado = esMultivaluado;
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

    marcarComoClavePrimaria() {
        this._esPK = true;
        if (this._esMultivaluado) {
            this.desmarcarComoMultivaluado();
        }
        this._notificarCambioPK();
    }

    desmarcarComoClavePrimaria() {
        this._esPK = false;
        this._notificarCambioPK();
    }

    esMultivaluado() {
        return this._esMultivaluado;
    }

    marcarComoMultivaluado() {
        this._esMultivaluado = true;
        if (this._esPK) {
            this.desmarcarComoClavePrimaria();
        }
        this._notificarCambioMultivaluado();
    }

    desmarcarComoMultivaluado() {
        this._esMultivaluado = false;
        this._notificarCambioMultivaluado();
    }

    alCambiarElSerPK(callback: () => void) {
        this._alCambiarLaPK.push(callback);
    }

    alCambiarElSerMultivaluado(callback: () => void) {
        this._alCambiarElSerMultivaluado.push(callback);
    }

    private _notificarCambioPK() {
        this._alCambiarLaPK.forEach(callback => callback());
    }

    private _notificarCambioMultivaluado() {
        this._alCambiarElSerMultivaluado.forEach(callback => callback());
    }
}
