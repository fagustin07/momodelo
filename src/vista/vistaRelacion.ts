import {Entidad} from "../modelo/entidad";

export class VistaRelacion {
    private _entidad1: Entidad;
    private _entidad2: Entidad;
    private _rombo: SVGPolygonElement;
    private _linea1: SVGLineElement;
    private _linea2: SVGLineElement;
    private _input: HTMLInputElement;
    private _nombre: string;

    constructor(entidad1: Entidad, entidad2: Entidad, nombreInicial: string = "RELACION") {
        this._entidad1 = entidad1;
        this._entidad2 = entidad2;
        this._nombre = nombreInicial;

        // Crear elementos
        this._linea1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        this._linea2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        this._rombo = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        this._input = document.createElement("input");

        // Estilo del rombo
        this._rombo.setAttribute("fill", "white");
        this._rombo.setAttribute("stroke", "black");
        this._rombo.setAttribute("stroke-width", "2");

        [this._linea1, this._linea2].forEach(linea => {
            linea.setAttribute("stroke", "black");
            linea.setAttribute("stroke-width", "2");
        });

        // Estilo del input
        this._input.value = nombreInicial;
        this._input.title = "Nombre de la relación";
        this._input.style.position = "absolute";
        this._input.style.width = "100px";
        this._input.style.textAlign = "center";
        this._input.style.fontSize = "14px";
        this._input.style.zIndex = "10";

        this._input.addEventListener("input", () => {
            this._nombre = this._input.value.trim() || "RELACION";
        });
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
