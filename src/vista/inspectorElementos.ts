import {ElementoMER} from "../modelo/elementoMER";
import {Entidad} from "../modelo/entidad";
import {Atributo} from "../modelo/atributo";
import {Relacion} from "../modelo/relacion";
import {VistaEditorMER} from "./vistaEditorMER.ts";
import {createElement} from "./dom/createElement.ts";
import {Cardinalidad, CardinalidadMinima, CardinalidadMáxima} from "../tipos/tipos";

export class InspectorElementos {

    private readonly _contenedor: HTMLElement;
    private _inputNombre: HTMLInputElement | null = null;

    constructor(elementoRaiz: HTMLElement, private vistaEditor: VistaEditorMER) {

        this._contenedor = createElement("div", {
            id: "panel-inspector",
        });

        elementoRaiz.appendChild(this._contenedor);
    }

    ocultar() {
        this._contenedor.style.display = "none";
        this._contenedor.innerHTML = "";
        this._inputNombre = null;
    }

    mostrar(elemento: ElementoMER | null) {
        this._contenedor.innerHTML = "";
        if (!elemento) {
            this.ocultar();
            return;
        }

        this._contenedor.style.display = "block";

        if (elemento instanceof Entidad) this._renderEntidad(elemento);
        else if (elemento instanceof Atributo) this._renderAtributo(elemento);
        else if (elemento instanceof Relacion) this._renderRelacion(elemento);
    }

    actualizarInput(nuevoNombre: string) {
        if (this._inputNombre) {
            this._inputNombre.value = nuevoNombre;
        }
    }

    private _titulo(texto: string) {
        return createElement("h3", {
            textContent: texto,
            title: "Tipo Elemento Inspeccionado",
            style: {
                fontSize: "1rem",
                marginBottom: "1rem",
                color: "#443939",
            }
        });
    }

    private _label(texto: string) {
        return createElement("label", {
            textContent: texto,
            style: {
                fontSize: "1rem",
                color: "#6b768a",
                marginBottom: "0.5rem",
                display: "block",
            }
        });
    }

    private _inputCon(valor: string) {
        this._inputNombre = createElement("input", {
            value: valor,
            title: "Nombre Elemento Inspeccionado",
            type: "text",
            className: "inspector-input-nombre",
            style: {
                width: "100%",
                padding: "0.5rem",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                outline: "none",
                fontSize: "1rem",
                boxSizing: "border-box",
                background: "#fff",
            }
        });
    }

    private _renderEntidad(entidad: Entidad) {
        const titulo = this._titulo("Entidad");
        const label = this._label("Nombre");
        this._inputCon(entidad.nombre());

        this._inputNombre!.oninput = () => this.vistaEditor.renombrarEntidad(this._inputNombre!.value, entidad);

        this._contenedor.append(titulo, label, this._inputNombre!);
    }

    private _renderAtributo(atributo: Atributo) {
        const titulo = this._titulo("Atributo");
        const label = this._label("Nombre");
        this._inputCon(atributo.nombre());

        this._inputNombre!.oninput = () => this.vistaEditor.renombrarAtributo(this._inputNombre!.value, atributo);

        const botonPK = createElement("button", {
            textContent: "PK",
            title: "Marcar como clave primaria",
            className: this._claseDel(atributo),
            onclick: () => {
                if (atributo.esPK()) {
                    this.vistaEditor.desmarcarAtributoComoClavePrimaria(atributo);
                } else {
                    this.vistaEditor.marcarAtributoComoClavePrimaria(atributo);
                }
            }
        });

        atributo.alCambiarLaPK(() => botonPK.className = this._claseDel(atributo));

        this._contenedor.append(titulo, label, this._inputNombre!, botonPK);
    }

    private _claseDel(atributo: Atributo) {
        return "boton-pk " + (atributo.esPK() ? "pk-activo" : "pk-inactivo");
    }

    private _renderRelacion(relacion: Relacion) {
        const titulo = this._titulo("Relación");
        const label = this._label("Nombre");
        this._inputCon(relacion.nombre());

        this._inputNombre!.oninput = () => this.vistaEditor.renombrarRelacion(this._inputNombre!.value, relacion);

        const origen = relacion.entidades()[0].nombre();
        const destino = relacion.entidades()[1].nombre();

        const formularioCardinalidadOrigen = this._crearFormularioCardinalidad(
            "Participación de " + origen + ":",
            () => relacion.cardinalidadOrigen(),
            (nuevaCardinalidad: Cardinalidad) => relacion.cambiarCardinalidadOrigenA(nuevaCardinalidad),
            "Cardinalidad origen"
        );
        const formularioCardinalidadDestino = this._crearFormularioCardinalidad(
            "Participación de " + destino + ":",
            () => relacion.cardinalidadDestino(),
            (nuevaCardinalidad: Cardinalidad) => relacion.cambiarCardinalidadDestinoA(nuevaCardinalidad),
            "Cardinalidad destino"
        );

        this._contenedor.append(titulo, label, this._inputNombre!, formularioCardinalidadOrigen, formularioCardinalidadDestino);
    }

    private _crearFormularioCardinalidad(
        titulo: string,
        obtenerCardinalidad: () => Cardinalidad,
        cambiarCardinalidad: (nuevaCardinalidad: Cardinalidad) => void,
        testId: string,
    ) {
        const formulario = createElement("form", {
            innerHTML: `<fieldset data-testid="${testId}">
                <legend title="Cardinalidad minima">${titulo}</legend>
                <label>Puede <input type="radio" name="cardinalidad-minima" value="0" /></label>
                <label>Debe <input type="radio" name="cardinalidad-minima" value="1" /></label>
                <br>
                <label>Una vez <input type="radio" name="cardinalidad-maxima" value="1" /></label>
                <label>Muchas <input type="radio" name="cardinalidad-maxima" value="N" /></label>
            </fieldset>`
        });

        const itemCardinalidadMinima = formulario.elements.namedItem("cardinalidad-minima") as RadioNodeList;
        itemCardinalidadMinima.value = obtenerCardinalidad()[0];
        itemCardinalidadMinima.forEach((radioButton) => {
            radioButton.onchange = () => {
                const nuevaCardinalidad: Cardinalidad = [radioButton.value as CardinalidadMinima, obtenerCardinalidad()[1]];
                cambiarCardinalidad(nuevaCardinalidad);
            };
        })

        const itemCardinalidadMaxima = formulario.elements.namedItem("cardinalidad-maxima") as RadioNodeList;
        itemCardinalidadMaxima.value = obtenerCardinalidad()[1];
        itemCardinalidadMaxima.forEach((radioButton) => {
            radioButton.onchange = () => {
                const nuevaCardinalidad: Cardinalidad = [obtenerCardinalidad()[0], radioButton.value as CardinalidadMáxima];
                cambiarCardinalidad(nuevaCardinalidad);
            };
        })

        return formulario;
    }
}
