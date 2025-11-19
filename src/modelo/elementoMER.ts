import {Posicion} from "../posicion.ts";

export abstract class ElementoMER {
    private _posicion: Posicion;

    protected constructor(posicion: Posicion) {
        this._posicion = posicion;
    }

    abstract nombre(): string;

    posicion() {
        return this._posicion;
    }

    moverseHacia(delta: Posicion) {
        this._posicion = this._posicion.plus(delta);
    }

    posicionarseEn(posicion: Posicion) {
        this._posicion = posicion;
    }

    representaUnaEntidad() {
        return false;
    }
}