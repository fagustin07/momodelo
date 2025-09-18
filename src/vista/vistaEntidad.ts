import {Entidad} from "../modelo/entidad";
import {Modelador} from "../servicios/modelador";
import {hacerArrastrable} from "../arrastrable";
import {createElement} from "./dom/createElement";
import {coordenada} from "../posicion.ts";

export class VistaEntidad {
    // ToDo: Tener solo el id de la entidad por el futuro observer para que la vista reaccione sobre acciones específicas a la entidad.
    private readonly _entidad: Entidad;
    private readonly _modelador: Modelador;
    private readonly _elementoDom: HTMLElement;
    private _campoNombre!: HTMLInputElement;
    private _contenedorDeAtributos!: HTMLElement;

    constructor(entidad: Entidad, modelador: Modelador) {
        this._entidad = entidad;
        this._modelador = modelador;
        this._elementoDom = this._crearElementoDom();
    }

    representarseEn(contenedor: HTMLElement) {
        contenedor.append(this._elementoDom);
        this._campoNombre.focus();
        this._campoNombre.select();
    }

    private _crearElementoDom() {
        this._contenedorDeAtributos = createElement("div");
        this._campoNombre = this._crearInputCampoNombre();

        const elementoDOMEntidad = this._crearElementoDOMEntidad();

        this.posicionarElemento(elementoDOMEntidad, this._entidad);
        this._crearAtributosExistentesDeEntidad();
        this._hacerArrastrableA(elementoDOMEntidad);

        return elementoDOMEntidad;
    }

    private _crearInputCampoNombre() {
        return createElement("input", {
            title: "Nombre Entidad",
            value: this._entidad.nombre(),
            oninput: () => {
                this._modelador.renombrarEntidad(this._campoNombre.value, this._entidad);
            },
        }, []);
    }

    private _crearElementoDOMEntidad() {
        return createElement("div", {
            className: "entidad",
            onclick: () => {
                // ToDo:Esto es simplemente un paso intermedio, después deberíamos suscribirnos con un observer a
                //  al modelador para saber qué acción se realizó finalmente y reflejarla en la vista.
                //  haciendo this._modelador.emitirSeleccion(this._entidad); y en el contructor
                //  modelador.onDelete(idEntidad, () => this._eliminarEntidad()
                this._modelador.emitirSeleccionDeEntidad(this._entidad, this._eliminarEntidad.bind(this));
            }
        }, [
            this._campoNombre,
            createElement("button", {
                textContent: "+",
                title: "Agregar atributo",
                onclick: () => {
                    this._modelador.emitirCreacionDeAtributoEn(this._contenedorDeAtributos, this._entidad);
                }
            }, []),
            this._contenedorDeAtributos
        ]);
    }

    private _eliminarEntidad() {
        this._elementoDom.remove();
    }

    private _hacerArrastrableA(elementoDOMEntidad: HTMLElement) {
        hacerArrastrable(elementoDOMEntidad, {
            alAgarrar: () => {
                elementoDOMEntidad.classList.add("moviendose");
                elementoDOMEntidad.parentElement?.append(elementoDOMEntidad);
            },
            alArrastrar: (_, delta) => {
                this._entidad.moverseHacia(delta);
                this.posicionarElemento(elementoDOMEntidad, this._entidad);
                this._modelador.actualizarRelacionesVisuales();
            },
            alSoltar: () => elementoDOMEntidad.classList.remove("moviendose"),
        });
    }

    private _crearAtributosExistentesDeEntidad() {
        this._entidad.atributos().forEach((atributo) => {
            this._modelador.emitirCreacionDeAtributoEn(this._contenedorDeAtributos, this._entidad, atributo.nombre());
        });
    }

    private posicionarElemento(elementoDOMEntidad: HTMLElement, entidad: Entidad) {
        elementoDOMEntidad.style.translate = `${entidad.posicion().x}px ${entidad.posicion().y}px`;
    }

    entidad() {
        return this._entidad;
    }

    centro() {
        const boundingBox = this._elementoDom.getBoundingClientRect();
        return this._entidad.posicion().plus(coordenada(boundingBox.width / 2, boundingBox.height / 2));
    }
}