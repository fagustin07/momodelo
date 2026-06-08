import {JsonModelo} from "./exportador.ts";

export const UMBRAL_ADVERTENCIA = 5;

const NOMBRE_AREA_DE_TRABAJO = "momodelo_area_de_trabajo";

export type TrabajoGuardado = {
    id: string;
    nombre: string;
    datos: JsonModelo;
    últimaActualización: string;
};

type AreaDeTrabajo = {
    trabajos: TrabajoGuardado[];
};

export interface Almacenamiento {
    getItem(clave: string): string | null;

    setItem(clave: string, valor: string): void;
}

export class AlmacenamientoLocal {
    private readonly _almacenamiento: Almacenamiento;

    constructor(almacenamiento: Almacenamiento = localStorage) {
        this._almacenamiento = almacenamiento;
    }

    listarTrabajos(): TrabajoGuardado[] {
        return this._leerAreaDeTrabajo().trabajos;
    }

    cantidadTrabajos(): number {
        return this.listarTrabajos().length;
    }

    guardarTrabajo(nombre: string, datos: JsonModelo): TrabajoGuardado {
        const area = this._leerAreaDeTrabajo();
        const nuevo: TrabajoGuardado = {
            id: crypto.randomUUID(),
            nombre: nombre.trim() || "Sin nombre",
            datos,
            últimaActualización: new Date().toISOString(),
        };
        area.trabajos.unshift(nuevo);
        this._escribirAreaDeTrabajo(area);
        return nuevo;
    }

    cargarTrabajo(id: string): JsonModelo | null {
        const trabajo = this.listarTrabajos().find(m => m.id === id);
        return trabajo?.datos ?? null;
    }

    eliminarTrabajo(id: string): void {
        const area = this._leerAreaDeTrabajo();
        area.trabajos = area.trabajos.filter(m => m.id !== id);
        this._escribirAreaDeTrabajo(area);
    }

    renombrarTrabajo(id: string, nuevoNombre: string): void {
        const area = this._leerAreaDeTrabajo();
        const trabajo = area.trabajos.find(m => m.id === id);
        if (!trabajo) return;
        trabajo.nombre = nuevoNombre.trim() || trabajo.nombre;
        trabajo.últimaActualización = new Date().toISOString();
        this._escribirAreaDeTrabajo(area);
    }

    private _leerAreaDeTrabajo(): AreaDeTrabajo {
        const modeloJson = this._almacenamiento.getItem(NOMBRE_AREA_DE_TRABAJO);
        if (!modeloJson)
            return {trabajos: []};
        try {
            return JSON.parse(modeloJson) as AreaDeTrabajo;
        } catch {
            return {trabajos: []};
        }
    }

    private _escribirAreaDeTrabajo(area: AreaDeTrabajo): void {
        this._almacenamiento.setItem(NOMBRE_AREA_DE_TRABAJO, JSON.stringify(area));
    }
}
