import {Entidad} from "../modelo/entidad.ts";
import {Atributo} from "../modelo/atributo.ts";
import {SolicitudCrearRelacion} from "../../types";

type RelacionVisual = {
    nombre: string;
    entidad1: Entidad;
    entidad2: Entidad;
    rombo: SVGPolygonElement;
    linea1: SVGLineElement;
    linea2: SVGLineElement;
    input: HTMLInputElement;
};

export type Relacion = {
    nombre: string;
    entidad1: Entidad;
    entidad2: Entidad;
};

export class Modelador {
    entidades: Entidad[];
    relaciones: Relacion[] = [];
    private _entidadSeleccionada: Entidad | null = null;
    private _relacionesVisuales: RelacionVisual[] = [];

    constructor(entidades: Entidad[]) {
        this.entidades = entidades;
    }
    seleccionarEntidad(entidad: Entidad) {
        if (this._entidadSeleccionada && this._entidadSeleccionada !== entidad) {
            this.crearRelacion(this._entidadSeleccionada, entidad);
            this._entidadSeleccionada = null;
        } else {
            this._entidadSeleccionada = entidad;
        }
    }

    eliminarEntidad(entidad:Entidad) {
        this.entidades.splice(this.entidades.indexOf(entidad)); // no funciona ahora
    }

    renombrarAtributo(nuevoNombre: string, atributoExistente: Atributo, entidad: Entidad): Atributo {
        return entidad.renombrarAtributo(atributoExistente, nuevoNombre);
    }

    conectarEntidades(_nombre: string, _solicitud: SolicitudCrearRelacion): Relacion {
        throw new Error("Sin implementar");
    }

    agregarAtributo(_nombreDeAtributoNuevo: string, _entidadExistente: Entidad, _esMultivaluado: boolean): Atributo {
        throw new Error("Sin implementar");
    }

    agregarAtributoARelacion(_nombreAtributo: string, _relacionExistente: Relacion, _esMultivaluado: boolean): Relacion {
        throw new Error("Sin implementar");
    }

    eliminarAtributo(atributo: Atributo, entidad: Entidad): void {
        entidad.eliminarAtributo(atributo);
    }

    eliminarRelacion(_relacion: Relacion): void {
        throw new Error("Sin implementar");
    }

    hacerAtributoCompuesto(_nombreDeAtributoNuevo: string, _atributoExistente: Atributo): Atributo {
        throw new Error("Sin implementar");
    }

    renombrarRelacion(_nuevoNombre: string, _relacion: Relacion): Relacion {
        throw new Error("Sin implementar");
    }

    crearRelacion(entidad1: Entidad, entidad2: Entidad) {
        console.log("Relación creada entre:", entidad1.nombre(), "y", entidad2.nombre());

        const svg = document.querySelector("svg")!;

        const centro = (e: Entidad) => ({
            x: e.posicion().x + 75,
            y: e.posicion().y + 25
        });

        const c1 = centro(entidad1);
        const c2 = centro(entidad2);

        const medio = {
            x: (c1.x + c2.x) / 2,
            y: (c1.y + c2.y) / 2
        };

        const ancho = 200, alto = 100;

        const rombo = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const puntos = [
            `${medio.x},${medio.y - alto / 2}`,
            `${medio.x + ancho / 2},${medio.y}`,
            `${medio.x},${medio.y + alto / 2}`,
            `${medio.x - ancho / 2},${medio.y}`
        ].join(" ");

        rombo.setAttribute("points", puntos);
        rombo.setAttribute("fill", "white");
        rombo.setAttribute("stroke", "black");
        rombo.setAttribute("stroke-width", "2");

        svg.appendChild(rombo);

        const linea1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        linea1.setAttribute("x1", `${c1.x}`);
        linea1.setAttribute("y1", `${c1.y}`);
        linea1.setAttribute("x2", `${medio.x}`);
        linea1.setAttribute("y2", `${medio.y}`);
        linea1.setAttribute("stroke", "black");
        linea1.setAttribute("stroke-width", "2");

        const linea2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        linea2.setAttribute("x1", `${c2.x}`);
        linea2.setAttribute("y1", `${c2.y}`);
        linea2.setAttribute("x2", `${medio.x}`);
        linea2.setAttribute("y2", `${medio.y}`);
        linea2.setAttribute("stroke", "black");
        linea2.setAttribute("stroke-width", "2");

        svg.appendChild(linea1);
        svg.appendChild(linea2);

        const input = document.createElement("input");
        input.value = "RELACION";
        input.title = "Nombre de la relación";
        input.style.position = "absolute";
        input.style.left = `${medio.x}px`;
        input.style.top = `${medio.y}px`;
        input.style.transform = "translate(-50%, -50%)";
        input.style.width = "60px";

        document.body.appendChild(input);

        input.focus();
        input.select();

        input.addEventListener("blur", () => {
            const nombre = input.value.trim() || "RELACION";
            this.relaciones.push({nombre, entidad1, entidad2});
            console.log("Relación guardada:", nombre);
        });

        this._relacionesVisuales.push({
            nombre: input.value,
            entidad1,
            entidad2,
            rombo,
            linea1,
            linea2,
            input
        });

    }

    actualizarRelacionesVisuales() {
        this._relacionesVisuales.forEach(rel => {
            this._actualizarRelacionVisual(rel);
        });
    }

    private _actualizarRelacionVisual(rel: RelacionVisual) {
        const centro = (e: Entidad) => ({
            x: e.posicion().x + 75,
            y: e.posicion().y + 25
        });

        const c1 = centro(rel.entidad1);
        const c2 = centro(rel.entidad2);
        const medio = {
            x: (c1.x + c2.x) / 2,
            y: (c1.y + c2.y) / 2
        };

        const ancho = 100, alto = 60;

        // actualizar puntos del rombo
        const puntos = [
            `${medio.x},${medio.y - alto / 2}`,
            `${medio.x + ancho / 2},${medio.y}`,
            `${medio.x},${medio.y + alto / 2}`,
            `${medio.x - ancho / 2},${medio.y}`
        ].join(" ");
        rel.rombo.setAttribute("points", puntos);

        // actualizar líneas
        rel.linea1.setAttribute("x1", `${c1.x}`);
        rel.linea1.setAttribute("y1", `${c1.y}`);
        rel.linea1.setAttribute("x2", `${medio.x}`);
        rel.linea1.setAttribute("y2", `${medio.y}`);

        rel.linea2.setAttribute("x1", `${c2.x}`);
        rel.linea2.setAttribute("y1", `${c2.y}`);
        rel.linea2.setAttribute("x2", `${medio.x}`);
        rel.linea2.setAttribute("y2", `${medio.y}`);

        // actualizar posición del input
        rel.input.style.left = `${medio.x}px`;
        rel.input.style.top = `${medio.y}px`;
    }
}
