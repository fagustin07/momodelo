import {MóduloMomodelo} from "../tipos/tipos.ts";
import {createElement} from "./dom/createElement.ts";

export class GestorModulos {
    private readonly _elementoRaíz: HTMLElement;
    private _modulos: Map<MóduloMomodelo, HTMLElement> = new Map();
    private _modoActivo: MóduloMomodelo | null = null;
    private readonly _elementoNavegación: HTMLElement;

    constructor(
        elementoRaíz: HTMLElement,
        elementoContenedorMER: HTMLElement,
        elementoContenedorMR: HTMLElement
    ) {
        this._elementoRaíz = elementoRaíz;

        this._registrarMódulo("MER", elementoContenedorMER);
        this._registrarMódulo("MR", elementoContenedorMR);

        this._elementoNavegación = this._crearNavegación();
        this._elementoRaíz.append(this._elementoNavegación);

        this.mostrarModulo("MER");
    }

    private mostrarModulo(id: MóduloMomodelo) {
        if (this._modoActivo === id) return;

        if (id === 'MER/MR') {
            this._activarModoMERMR();
        } else {
            this._activarModoUnico(id);
        }

        this._actualizarEstadoPestañas(id);
        this._modoActivo = id;
    }

    private _registrarMódulo(id: MóduloMomodelo, elemento: HTMLElement) {
        this._modulos.set(id, elemento);
        this._elementoRaíz.append(elemento);
        elemento.classList.add("vista-oculta");
    }

    private _crearNavegación(): HTMLElement {
        const opciones: MóduloMomodelo[] = ["MER", "MR", "MER/MR"];
        return createElement("nav", {className: "tabs-modulos"},
            opciones.map(id => createElement("button", {
                className: "tab-boton",
                textContent: id,
                onclick: () => this.mostrarModulo(id)
            }))
        );
    }

    private _activarModoMERMR() {
        this._elementoRaíz.classList.add("layout-mer-mr");
        this._modulos.forEach(el => el.classList.remove("vista-oculta"));
    }

    private _activarModoUnico(id: MóduloMomodelo) {
        this._elementoRaíz.classList.remove("layout-mer-mr");
        this._modulos.forEach((elementoContenedorMódulo, key) => {
            if (key === id) {
                elementoContenedorMódulo.classList.remove("vista-oculta");
            } else {
                elementoContenedorMódulo.classList.add("vista-oculta");
            }
        });
    }

    private _actualizarEstadoPestañas(idActivo: string) {
        const botones = this._elementoNavegación.querySelectorAll(".tab-boton");
        botones.forEach(botón => {
            if (botón.textContent === idActivo) {
                botón.classList.add("activa");
            } else {
                botón.classList.remove("activa");
            }
        });
    }
}
