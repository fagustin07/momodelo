import { Entidad } from "./entidad";

export enum Rol {
    ORIGEN = "ORIGEN",
    DESTINO = "DESTINO"
}

export enum Minima {
    CERO = 0,
    UNO = 1
}

export enum Maxima {
    UNO = 1,
    N = "N"
}

export type Participacion = readonly [Minima, Maxima];

export class Relacion {
    private _nombre: string;
    private _entidadOrigen: Entidad;
    private _entidadDestino: Entidad;
    private _cardinalidades: Map<Rol, Participacion>;

    constructor(nombre: string, entidadOrigen: Entidad, entidadDestino: Entidad) {
        this._nombre = nombre;
        this._entidadOrigen = entidadOrigen;
        this._entidadDestino = entidadDestino;
        this._cardinalidades = new Map([ // OBJETO CARDINALIDAD
            [Rol.ORIGEN, [Minima.CERO, Maxima.N]],
            [Rol.DESTINO, [Minima.CERO, Maxima.UNO]],
        ]);
    }

    nombre(): string {
        return this._nombre;
    }

    setNombre(nombre: string): void {
        this._nombre = nombre;
    }

    entidades(): [Entidad, Entidad] {
        return [this._entidadOrigen, this._entidadDestino];
    }

    getCardinalidad(rol: Rol): Participacion {
        return this._cardinalidades.get(rol) ?? [Minima.CERO, Maxima.UNO];
    }

    setCardinalidad(rol: Rol, cardinalidad: Participacion): void {
        this._cardinalidades.set(rol, cardinalidad);
    }
}
