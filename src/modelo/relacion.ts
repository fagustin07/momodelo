import {Entidad} from "./entidad";
import {coordenadaInicial, Posicion} from "../posicion";
import {generadorDeIDs} from "../servicios/generadorDeIDs.ts";
import {ElementoMER} from "./elementoMER.ts";
import {Cardinalidad, TipoRelacion} from "../tipos/tipos.ts";

export class Relacion extends ElementoMER {
    private readonly _id: number;
    private readonly _entidadOrigen: Entidad;
    private readonly _entidadDestino: Entidad;
    private _nombre: string;
    private _cardinalidadOrigen: Cardinalidad;
    private _cardinalidadDestino: Cardinalidad;
    private _alCambiarCardinalidad: (() => void)[] = [];
    private _tipoRelacion: TipoRelacion = 'fuerte';

    constructor(
        entidadOrigen: Entidad,
        entidadDestino: Entidad,
        nombre: string = "RELACIÓN",
        cardinalidadOrigen: Cardinalidad = ['0', 'N'],
        cardinalidadDestino: Cardinalidad = ['0', 'N'],
        posicion: Posicion = coordenadaInicial(),
        tipoRelacion: TipoRelacion = 'fuerte',
    ) {
        super(posicion);
        this._nombre = nombre;
        this._entidadOrigen = entidadOrigen;
        this._entidadDestino = entidadDestino;
        this._id = generadorDeIDs.tomarID();
        this._cardinalidadOrigen = cardinalidadOrigen;
        this._cardinalidadDestino = cardinalidadDestino;
        this._tipoRelacion = tipoRelacion;
    }

    nombre() {
        return this._nombre;
    }

    cambiarNombre(nuevoNombre: string) {
        this._nombre = nuevoNombre;
    }

    entidades() {
        return [this._entidadOrigen, this._entidadDestino];
    }

    entidadOrigen() {
        return this._entidadOrigen;
    }

    entidadDestino() {
        return this._entidadDestino;
    }

    id() {
        return this._id;
    }

    contieneA(entidad: Entidad): boolean {
        return this._entidadOrigen === entidad || this._entidadDestino === entidad;
    }

    cardinalidadOrigen() {
        return this._cardinalidadOrigen;
    }

    cardinalidadDestino() {
        return this._cardinalidadDestino;
    }

    cambiarCardinalidadOrigenA(nuevaCardinalidad: Cardinalidad) {
        this._cardinalidadOrigen = nuevaCardinalidad;
        this._notificarCambio();
    }

    cambiarCardinalidadDestinoA(nuevaCardinalidad: Cardinalidad) {
        this._cardinalidadDestino = nuevaCardinalidad;
        this._notificarCambio();
    }

    alCambiarCardinalidad(callback: () => void) {
        this._alCambiarCardinalidad.push(callback);
    }

    private _notificarCambio() {
        this._alCambiarCardinalidad.forEach(callback => callback());
    }

    tipoRelacion() {
        return this._tipoRelacion;
    }

    cambiarTipoRelacionA(nuevoTipo: TipoRelacion) {
        this._tipoRelacion = nuevoTipo;
        if (nuevoTipo === 'débil') {
            this._cardinalidadOrigen = ['1', '1'];
        }
        this._notificarCambio();
    }

    esFuerte() {
        return this._tipoRelacion === 'fuerte';
    }

    esDebil() {
        return this._tipoRelacion === 'débil';
    }
}