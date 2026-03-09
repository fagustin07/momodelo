import {ElementoMER} from "../../modelo/elementoMER";
import {Relacion} from "../../modelo/relacion";
import {VistaEditorMER} from "../vistaEditorMER.ts";
import {createElement} from "../dom/createElement.ts";
import {Cardinalidad, CardinalidadMinima, CardinalidadMáxima} from "../../tipos/tipos";
import {handlearError} from "../../servicios/handlearError.ts";
import {TemplateInspector} from "./templateInspector.ts";

export class TemplateRelacion extends TemplateInspector {

    static puedeManejar(elemento: ElementoMER): boolean {
        return elemento.representaUnaRelación();
    }

    private readonly relacion: Relacion;

    constructor(
        vistaEditor: VistaEditorMER,
        onRerenderizar: (elemento: ElementoMER) => void,
        elemento: ElementoMER,
    ) {
        super(vistaEditor, onRerenderizar);
        this.relacion = elemento as Relacion;
    }

    representarseEn(contenedor: HTMLElement): TemplateRelacion {
        this._inputCon(this.relacion.nombre());
        this._inputNombre!.oninput = () =>
            this.vistaEditor.renombrarRelacion(this._inputNombre!.value, this.relacion);

        const [origen, destino] = this.relacion.entidades().map(e => e.nombre());

        contenedor.append(
            this._titulo("Relaciones"),
            this._separador(),
            this._subtitulo("NOMBRE"),
            this._inputNombre!,
            this._separador(),
            ...this._seccionTipo(),
            this._separador(),
            ...this._seccionCardinalidades(origen, destino),
        );

        return this;
    }

    private _seccionTipo(): HTMLElement[] {
        const teclaFuerte = this._tecla("Fuerte", "Cambiar a relación fuerte", this.relacion.esFuerte(), () => {
            const relacionFinal = this.vistaEditor.cambiarTipoDeRelacion(this.relacion, 'fuerte');
            this.onRerenderizar(relacionFinal);
        });

        const teclaDebil = this._tecla("Débil", "Cambiar a relación débil", this.relacion.esDebil(), () => {
            const relacionFinal = this.vistaEditor.cambiarTipoDeRelacion(this.relacion, 'débil');
            this.onRerenderizar(relacionFinal);
        });

        const grupoTeclas = createElement("div", {className: "tecla-grupo-segmentado"});
        grupoTeclas.append(teclaFuerte, teclaDebil);

        const contenedor = createElement("div", {className: "inspector-grupo-teclas-tipo"});
        contenedor.append(grupoTeclas);

        return [this._subtitulo("TIPO"), contenedor];
    }

    private _seccionCardinalidades(origen: string, destino: string): HTMLElement[] {
        const titulo = this._subtitulo("CARDINALIDADES");

        if (this.relacion.esDebil()) {
            return [
                titulo,
                this._formularioCardinalidad(
                    `Para las instancias de ${destino}`,
                    () => this.relacion.cardinalidadDestino(),
                    (c) => this.relacion.cambiarCardinalidadDestinoA(c),
                    "Cardinalidad destino",
                ),
                createElement("p", {textContent: "Mientras que...", className: "inspector-mientras-que"}),
                this._cardinalidadOrigenFija(origen),
                this._separador(),
                this._botonInvertirDependencia(),
            ];
        }

        return [
            titulo,
            this._formularioCardinalidad(
                `Para las instancias de ${destino}`,
                () => this.relacion.cardinalidadDestino(),
                (c) => this.relacion.cambiarCardinalidadDestinoA(c),
                "Cardinalidad destino",
            ),
            createElement("p", {textContent: "Mientras que...", className: "inspector-mientras-que"}),
            this._formularioCardinalidad(
                `Para las instancias de ${origen}`,
                () => this.relacion.cardinalidadOrigen(),
                (c) => this.relacion.cambiarCardinalidadOrigenA(c),
                "Cardinalidad origen",
            ),
        ];
    }

    private _cardinalidadOrigenFija(origen: string): HTMLElement {
        const etiqueta = createElement("p", {
            className: "inspector-cardinalidad-label",
            innerHTML: `Para las instancias de ${origen}, su participación es <strong>TOTAL</strong> y pueden hacerlo como máximo <strong>UNA VEZ</strong> para su identificación en el modelo.`,
        });
        const contenedor = createElement("div", {className: "inspector-cardinalidad"});
        contenedor.append(etiqueta);
        return contenedor;
    }

    private _botonInvertirDependencia(): HTMLButtonElement {
        const svgFlechas = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;
        return createElement("button", {
            className: "boton-invertir-debil",
            title: "Invertir dependencia",
            innerHTML: `${svgFlechas} Invertir dependencia`,
            onclick: () => {
                try {
                    const nuevaRelacion = this.vistaEditor.invertirRelacionDebil(this.relacion);
                    this.onRerenderizar(nuevaRelacion);
                } catch (error) {
                    handlearError(error, this.vistaEditor);
                }
            },
        });
    }

    private _formularioCardinalidad(
        etiqueta: string,
        obtener: () => Cardinalidad,
        cambiar: (c: Cardinalidad) => void,
        testId: string,
    ): HTMLElement {
        const label = createElement("p", {
            textContent: etiqueta,
            className: "inspector-cardinalidad-label",
        });

        const filaMinima = this._filaTeclas(
            "Su participación es",
            [
                {labelText: "Parcial", valor: "0"},
                {labelText: "Total", valor: "1"},
            ],
            `cardinalidad-minima-${testId}`,
            obtener()[0],
            (v) => cambiar([v as CardinalidadMinima, obtener()[1]]),
        );

        const filaMaxima = this._filaTeclas(
            "Y pueden hacerlo como máximo",
            [
                {labelText: "Una vez", valor: "1"},
                {labelText: "Muchas veces", valor: "N"},
            ],
            `cardinalidad-maxima-${testId}`,
            obtener()[1],
            (v) => cambiar([obtener()[0], v as CardinalidadMáxima]),
        );

        const formulario = createElement("div", {className: "inspector-cardinalidad"});
        formulario.setAttribute("data-testid", testId);
        formulario.append(label, filaMinima, filaMaxima);
        return formulario;
    }

    private _filaTeclas(
        textoLabel: string,
        opciones: { labelText: string; valor: string }[],
        name: string,
        valorActual: string,
        onChange: (valor: string) => void,
    ): HTMLElement {
        const fila = createElement("div", {className: "inspector-teclas-fila"});

        const marca = createElement("span", {textContent: "–", className: "inspector-marcador-fila"});
        const label = createElement("span", {textContent: textoLabel, className: "inspector-teclas-label"});
        fila.append(marca, label);

        const grupo = createElement("div", {className: "inspector-grupo-teclas tecla-grupo-segmentado"});

        for (const opcion of opciones) {
            const radio = createElement("input", {
                type: "radio",
                name,
                value: opcion.valor,
                className: "tecla-radio-oculto",
            });
            if (opcion.valor === valorActual) radio.checked = true;

            const etiqueta = createElement("label", {
                textContent: opcion.labelText,
                className: radio.checked ? "tecla tecla-activa" : "tecla tecla-inactiva",
            });
            etiqueta.appendChild(radio);

            radio.onchange = () => {
                grupo.querySelectorAll<HTMLLabelElement>("label.tecla").forEach(l => {
                    l.classList.replace("tecla-activa", "tecla-inactiva");
                });
                etiqueta.classList.replace("tecla-inactiva", "tecla-activa");
                onChange(opcion.valor);
            };

            grupo.append(etiqueta);
        }

        fila.append(grupo);
        return fila;
    }
}

TemplateInspector.registrar(TemplateRelacion);