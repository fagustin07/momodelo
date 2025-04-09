import {Entidad} from "../modelo/entidad";
import {Modelador} from "../servicios/modelador.ts";

export class VistaRelacion {
    private _entidad1: Entidad;
    private _entidad2: Entidad;
    private _rombo: SVGPolygonElement;
    private _linea1: SVGLineElement;
    private _linea2: SVGLineElement;
    private _input: HTMLInputElement;
    private _nombre: string;

    constructor(entidad1: Entidad, entidad2: Entidad, modelador: Modelador) {
        this._entidad1 = entidad1;
        this._entidad2 = entidad2;
        this._nombre = "RELACION";


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

        input.addEventListener("blur", () => {
            const nombre = input.value.trim() || "RELACION";
            modelador.relaciones.push({nombre, entidad1, entidad2});
            console.log("Relación guardada:", nombre);
        });

        document.body.appendChild(input);

        input.focus();
        input.select();
        this._input = input;

        this._linea1 = linea1;
        this._linea2 = linea2;
        this._rombo = rombo;
    }

    representarse(svg: SVGSVGElement, htmlContainer: HTMLElement) {
        svg.appendChild(this._linea1);
        svg.appendChild(this._linea2);
        svg.appendChild(this._rombo);
        htmlContainer.appendChild(this._input);
        this.actualizarPosicion();
        this._input.focus();
        this._input.select();
    }

    actualizarPosicion() {
        const centro = (e: Entidad) => ({
            x: e.posicion().x + 75,
            y: e.posicion().y + 25
        });

        const c1 = centro(this._entidad1);
        const c2 = centro(this._entidad2);
        const medio = {
            x: (c1.x + c2.x) / 2,
            y: (c1.y + c2.y) / 2
        };

        const ancho = 200, alto = 100;

        // actualizar rombo
        const puntos = [
            `${medio.x},${medio.y - alto / 2}`,
            `${medio.x + ancho / 2},${medio.y}`,
            `${medio.x},${medio.y + alto / 2}`,
            `${medio.x - ancho / 2},${medio.y}`
        ].join(" ");
        this._rombo.setAttribute("points", puntos);

        // actualizar líneas
        this._linea1.setAttribute("x1", `${c1.x}`);
        this._linea1.setAttribute("y1", `${c1.y}`);
        this._linea1.setAttribute("x2", `${medio.x}`);
        this._linea1.setAttribute("y2", `${medio.y}`);

        this._linea2.setAttribute("x1", `${c2.x}`);
        this._linea2.setAttribute("y1", `${c2.y}`);
        this._linea2.setAttribute("x2", `${medio.x}`);
        this._linea2.setAttribute("y2", `${medio.y}`);

        // actualizar input
        this._input.style.left = `${medio.x}px`;
        this._input.style.top = `${medio.y}px`;
        this._input.style.transform = "translate(-50%, -50%)";
    }

    nombre() {
        return this._nombre;
    }

    entidades() {
        return [this._entidad1, this._entidad2];
    }
}
