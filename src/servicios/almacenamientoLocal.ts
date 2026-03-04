import {JsonModelo} from "./exportador.ts";

export const UMBRAL_ADVERTENCIA = 5;

const NOMBRE_AREA_DE_TRABAJO = "momodelo_area_de_trabajo";

export type ModeloGuardado = {
    id: string;
    nombre: string;
    datos: JsonModelo;
    últimaActualización: string;
};

type AreaDeTrabajo = {
    modelos: ModeloGuardado[];
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

    listarModelos(): ModeloGuardado[] {
        return this._leerAreaDeTrabajo().modelos;
    }

    cantidadModelos(): number {
        return this.listarModelos().length;
    }

    guardarModelo(nombre: string, datos: JsonModelo): ModeloGuardado {
        const area = this._leerAreaDeTrabajo();
        const nuevo: ModeloGuardado = {
            id: crypto.randomUUID(),
            nombre: nombre.trim() || "Sin nombre",
            datos,
            últimaActualización: new Date().toISOString(),
        };
        area.modelos.unshift(nuevo);
        this._escribirAreaDeTrabajo(area);
        return nuevo;
    }

    cargarModelo(id: string): JsonModelo | null {
        const modelo = this.listarModelos().find(m => m.id === id);
        return modelo?.datos ?? null;
    }

    eliminarModelo(id: string): void {
        const area = this._leerAreaDeTrabajo();
        area.modelos = area.modelos.filter(m => m.id !== id);
        this._escribirAreaDeTrabajo(area);
    }

    renombrarModelo(id: string, nuevoNombre: string): void {
        const area = this._leerAreaDeTrabajo();
        const modelo = area.modelos.find(m => m.id === id);
        if (!modelo) return;
        modelo.nombre = nuevoNombre.trim() || modelo.nombre;
        modelo.últimaActualización = new Date().toISOString();
        this._escribirAreaDeTrabajo(area);
    }

    private _leerAreaDeTrabajo(): AreaDeTrabajo {
        const modeloJson = this._almacenamiento.getItem(NOMBRE_AREA_DE_TRABAJO);
        if (!modeloJson)
            return {modelos: []};
        try {
            const area = JSON.parse(modeloJson) as AreaDeTrabajo;
            // Migración: campo renombrado de actualizadoEn a últimaActualización
            area.modelos = area.modelos.map(m => {
                if (!m.últimaActualización) {
                    const legacy = (m as unknown as Record<string, string>)["actualizadoEn"];
                    m.últimaActualización = legacy ?? new Date().toISOString();
                }
                return m;
            });
            return area;
        } catch {
            return {modelos: []};
        }
    }

    private _escribirAreaDeTrabajo(area: AreaDeTrabajo): void {
        this._almacenamiento.setItem(NOMBRE_AREA_DE_TRABAJO, JSON.stringify(area));
    }
}
