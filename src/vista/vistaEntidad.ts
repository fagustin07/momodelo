import {Entidad} from "../modelo/entidad";
import {Modelador} from "../servicios/modelador";
import {hacerArrastrable} from "../arrastrable";
import {agregarAtributoEn, posicionarElemento} from "../vista";
import {createElement} from "./dom/createElement";

export class VistaEntidad {
    private _entidad: Entidad;
    private _modelador: Modelador;
    private _elementoDom: HTMLElement;
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

        posicionarElemento(elementoDOMEntidad, this._entidad);
        this._crearAtributosExistentesDeEntidad();
        this._hacerArrastrableA(elementoDOMEntidad);

        return elementoDOMEntidad;
    }

    private _crearInputCampoNombre() {
        return createElement("input", {
            title: "nombre Entidad",
            value: this._entidad.nombre(),
            oninput: () => this._entidad.cambiarNombre(this._campoNombre.value),

        }, []);
    }

    private _crearElementoDOMEntidad() {
        return createElement("div", {
            className: "entidad",
            onclick: (evento) => {
                if (evento.ctrlKey && evento.shiftKey) {
                    this._eliminarEntidad();
                } else {
                    this._modelador.seleccionarEntidad(this._entidad);
                }
            }
        }, [
            this._campoNombre,
            createElement("button", {
                textContent: "+",
                title: "Agregar atributo",
                onclick: () => {
                    const atributoNuevo = this._entidad.agregarAtributo("Atributo");
                    agregarAtributoEn(this._contenedorDeAtributos, atributoNuevo, this._entidad, this._modelador);
                }
            }, []),
            this._contenedorDeAtributos
        ]);
    }

    private _eliminarEntidad() {
        this._elementoDom.remove();
        this._modelador.eliminarEntidad(this._entidad);
    }

    private _hacerArrastrableA(elementoDOMEntidad: HTMLElement) {
        hacerArrastrable(elementoDOMEntidad, {
            alAgarrar: () => {
                elementoDOMEntidad.classList.add("moviendose");
                elementoDOMEntidad.parentElement?.append(elementoDOMEntidad);
            },
            alArrastrar: (_, delta) => {
                this._entidad.moverseHacia(delta);
                posicionarElemento(elementoDOMEntidad, this._entidad);
                this._modelador.actualizarRelacionesVisuales();
            },
            alSoltar: () => elementoDOMEntidad.classList.remove("moviendose"),
        });
    }

    private _crearAtributosExistentesDeEntidad() {
        this._entidad.atributos().forEach((atributo) => {
            agregarAtributoEn(this._contenedorDeAtributos, atributo, this._entidad, this._modelador);
        });
    }
}