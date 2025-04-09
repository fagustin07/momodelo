import {Entidad} from "../modelo/entidad";
import {Modelador} from "../servicios/modelador";
import {Relacion} from "../modelo/relacion";
import {coordenada} from "../posicion";

export class VistaRelacion {
    private readonly _entidadOrigen: Entidad;
    private readonly _entidadDestino: Entidad;
    private readonly _modelador: Modelador;
    private _relacion: Relacion;

    private _rombo!: SVGPolygonElement;
    private _lineaOrigen!: SVGLineElement;
    private _lineaDestino!: SVGLineElement;
    private _input!: HTMLInputElement;

    constructor(entidad1: Entidad, entidad2: Entidad, modelador: Modelador) {
        this._entidadOrigen = entidad1;
        this._entidadDestino = entidad2;
        this._modelador = modelador;

        const centro = this._calcularCentro();
        this._relacion = new Relacion("RELACION", entidad1, entidad2, coordenada(centro.x, centro.y));
        this._modelador.relaciones.push(this._relacion);

        this._crearElementoDom();
        this.reposicionarRelacion();
    }

    private _crearElementoDom() {
        const svg = document.querySelector("svg")!;

        this._rombo = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        this._rombo.setAttribute("fill", "white");
        this._rombo.setAttribute("stroke", "black");
        this._rombo.setAttribute("stroke-width", "2");

        this._lineaOrigen = document.createElementNS("http://www.w3.org/2000/svg", "line");
        this._lineaOrigen.setAttribute("stroke", "black");
        this._lineaOrigen.setAttribute("stroke-width", "2");

        this._lineaDestino = document.createElementNS("http://www.w3.org/2000/svg", "line");
        this._lineaDestino.setAttribute("stroke", "black");
        this._lineaDestino.setAttribute("stroke-width", "2");

        this._input = document.createElement("input");
        this._input.value = this._relacion.nombre();
        this._input.title = "Nombre de la relación";
        this._input.style.position = "absolute";
        this._input.style.width = "80px";
        this._input.style.border = "none";
        this._input.style.textAlign = "center";
        this._input.style.background = "transparent";
        this._input.style.transform = "translate(-50%, -50%)";

        this._input.addEventListener("input", () => {
            const nombre = this._input.value.trim() || "RELACION";
            this._relacion = this._modelador.renombrarRelacion(nombre, this._relacion);
        });
    }

    representarse() {
        const svg = document.querySelector("svg")!;
        svg.appendChild(this._lineaOrigen);
        svg.appendChild(this._lineaDestino);
        svg.appendChild(this._rombo);
        document.body.appendChild(this._input);

        this._input.focus();
        this._input.select();
    }

    reposicionarRelacion() {
        const c1 = this._centroDeEntidad(this._entidadOrigen);
        const c2 = this._centroDeEntidad(this._entidadDestino);
        const medio = this._calcularCentro();

        this._relacion.moverseHacia(coordenada(medio.x, medio.y));

        this._lineaOrigen.setAttribute("x1", `${c1.x}`);
        this._lineaOrigen.setAttribute("y1", `${c1.y}`);
        this._lineaOrigen.setAttribute("x2", `${medio.x}`);
        this._lineaOrigen.setAttribute("y2", `${medio.y}`);

        this._lineaDestino.setAttribute("x1", `${c2.x}`);
        this._lineaDestino.setAttribute("y1", `${c2.y}`);
        this._lineaDestino.setAttribute("x2", `${medio.x}`);
        this._lineaDestino.setAttribute("y2", `${medio.y}`);

        const ancho = 200, alto = 100;
        const puntos = [
            `${medio.x},${medio.y - alto / 2}`,
            `${medio.x + ancho / 2},${medio.y}`,
            `${medio.x},${medio.y + alto / 2}`,
            `${medio.x - ancho / 2},${medio.y}`
        ].join(" ");
        this._rombo.setAttribute("points", puntos);

        this._input.style.left = `${medio.x}px`;
        this._input.style.top = `${medio.y}px`;
    }

    private _centroDeEntidad(entidad: Entidad) {
        return entidad.posicion().plus(coordenada(75, 25));
    }

    private _calcularCentro() {
        const c1 = this._centroDeEntidad(this._entidadOrigen);
        const c2 = this._centroDeEntidad(this._entidadDestino);
        return {
            x: (c1.x + c2.x) / 2,
            y: (c1.y + c2.y) / 2
        };
    }
}
