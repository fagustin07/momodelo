import {ElementoMER} from "../../modelo/elementoMER";
import {Relacion} from "../../modelo/relacion";
import {VistaEditorMER} from "../vistaEditorMER.ts";
import {createElement} from "../dom/createElement.ts";
import {Cardinalidad, CardinalidadMinima, CardinalidadMáxima, TipoRelacion} from "../../tipos/tipos";
import {handlearError} from "../../servicios/handlearError.ts";
import {TemplateInspector} from "./templateInspector.ts";

export class TemplateRelacion extends TemplateInspector {

    static puedeManejar(elemento: ElementoMER): boolean {
        return elemento.representaUnaRelación();
    }

    private readonly relacion: Relacion;

    constructor(
        vistaEditor: VistaEditorMER,
        elemento: ElementoMER,
    ) {
        super(vistaEditor);
        this.relacion = elemento as Relacion;
    }

    representarseEn(contenedor: HTMLElement): TemplateRelacion {
        this._inputCon(this.relacion.nombre());
        this._inputNombre!.oninput = () => this.vistaEditor.renombrarRelacion(this._inputNombre!.value, this.relacion);

        contenedor.append(
            this._titulo("Relaciones"),
            this._separador(),
            ...this._secciónIdentidad(),
            this._separador(),
            ...this._seccionTipo(),
            this._separador(),
            this._contenedorCardinalidades(),
            this._contenedorInversiónDependenciaDébil()
        );

        return this;
    }

    private _seccionTipo(): HTMLElement[] {
        const opciones = [
            {etiqueta: "Fuerte", valor: "fuerte"},
            {etiqueta: "Débil", valor: "débil"}
        ];
        const valorActual = this.relacion.esFuerte() ? 'fuerte' : 'débil';

        return [
            this._subtitulo("TIPO"),
            createElement("div", {
                    className: "inspector-grupo-teclas tecla-grupo-segmentado",
                    style: {display: "flex", justifyContent: "center"}
                },
                opciones.map(op =>
                    this._crearRadioSegmentado(
                        op,
                        "tipo-relacion",
                        valorActual === op.valor,
                        (nuevoTipo) => this.vistaEditor.cambiarTipoDeRelacion(this.relacion, nuevoTipo as TipoRelacion)
                    )
                )
            )
        ];
    }

    private _contenedorCardinalidades(): HTMLElement {
        const contenedor = createElement("div");
        const actualizar = () => {
            contenedor.innerHTML = "";
            contenedor.append(
                this._subtitulo("CARDINALIDADES"),
                this._renderCardinalidadDestino(),
                createElement("p", {textContent: "Mientras que...", className: "inspector-mientras-que"}),
                this._renderCardinalidadOrigen()
            );
        };

        actualizar();
        this.relacion.alCambiarCardinalidad(actualizar);

        return contenedor;
    }

    private _contenedorInversiónDependenciaDébil(): HTMLElement {
        const contenedor = createElement("div", {
            style: {display: this.relacion.esDebil() ? "block" : "none"}
        }, [
            this._separador(),
            createElement("div", {
                className: "inspector-acciones-debil",
                style: {textAlign: "center"}
            }, [
                this._botonInvertirDependencia()
            ])
        ]);

        this.relacion.alCambiarCardinalidad(() => {
            contenedor.style.display = this.relacion.esDebil() ? "block" : "none";
        });
        return contenedor;
    }

    private _botonInvertirDependencia(): HTMLButtonElement {
        return createElement("button", {
            className: "boton-invertir-debil",
            title: "Invertir dependencia",
            innerHTML: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> Invertir dependencia`,
            onclick: () => {
                try {
                    this.vistaEditor.invertirRelacionDebil(this.relacion);
                } catch (error) {
                    handlearError(error, this.vistaEditor);
                }
            },
        });
    }

    private _formularioCardinalidad(
        etiqueta: string,
        getCardinalidad: () => Cardinalidad,
        alCambiarCardinalidad: (cardinalidad: Cardinalidad) => void,
        rolEnLaRelación: string,
    ): HTMLElement {
        const [min, max] = getCardinalidad();

        return createElement("fieldset", {className: "inspector-cardinalidad"}, [
            createElement("legend", {textContent: etiqueta, className: "inspector-cardinalidad-label"}),

            this._filaOpciones("Su participación es", [
                    {etiqueta: "Parcial", valor: "0"},
                    {etiqueta: "Total", valor: "1"}
                ], `min-${rolEnLaRelación}`,
                min,
                (nuevaMínima) => alCambiarCardinalidad([nuevaMínima as CardinalidadMinima, getCardinalidad()[1]])),

            this._filaOpciones("Y pueden hacerlo como máximo", [
                    {etiqueta: "Una vez", valor: "1"},
                    {etiqueta: "Muchas veces", valor: "N"}
                ], `max-${rolEnLaRelación}`,
                max,
                (nuevaMáxima) => alCambiarCardinalidad([getCardinalidad()[0], nuevaMáxima as CardinalidadMáxima]))
        ]);
    }

    private _secciónIdentidad(): HTMLElement[] {
        return [this._subtitulo("NOMBRE"), this._inputNombre!];
    }

    private _renderCardinalidadDestino() {
        return this._formularioCardinalidad(
            `Para las instancias de ${this.relacion.entidadDestino().nombre()}`,
            () => this.relacion.cardinalidadDestino(),
            (nuevaCardinalidad) => this.vistaEditor.cambiarCardinalidadDestinoA(this.relacion, nuevaCardinalidad),
            "destino"
        );
    }

    private _renderCardinalidadOrigen(): HTMLElement {
        const nombreEntidad = this.relacion.entidadOrigen().nombre();

        if (this.relacion.esDebil()) {
            return createElement(
                "div",
                {className: "inspector-cardinalidad"},
                [
                    createElement("p", {
                        className: "inspector-cardinalidad-label",
                        innerHTML: `Para las instancias de ${nombreEntidad}, su participación es <strong>TOTAL</strong> y pueden hacerlo como máximo <strong>UNA VEZ</strong> para su identificación en el modelo.`,
                    })
                ]);
        } else {
            return this._formularioCardinalidad(
                `Para las instancias de ${nombreEntidad}`,
                () => this.relacion.cardinalidadOrigen(),
                (nuevaCardinalidad) => this.vistaEditor.cambiarCardinalidadOrigenA(this.relacion, nuevaCardinalidad),
                "origen"
            );
        }
    }

    private _filaOpciones(
        titulo: string,
        opciones: { etiqueta: string; valor: string }[],
        nombre: string,
        valorActual: string,
        alCambiar: (valor: string) => void
    ): HTMLElement {
        return createElement("div", {className: "inspector-teclas-fila"}, [
            createElement("span", {textContent: "–", style: {color:"#9ca3af"}
            }),
            createElement("span", {
                textContent: titulo,
                className: "inspector-teclas-label",
                style: {margin: "0.25rem"}
            }),
            createElement("div", {className: "inspector-grupo-teclas tecla-grupo-segmentado"},
                opciones.map(opción =>
                    this._crearRadioSegmentado(opción, nombre, valorActual === opción.valor, alCambiar))
            )
        ]);
    }

    private _crearRadioSegmentado(
        {etiqueta, valor}: { etiqueta: string, valor: string },
        nombre: string,
        estaActivo: boolean,
        alCambiar: (valorSeleccionado: string) => void
    ): HTMLElement {
        return createElement("label", {
            textContent: etiqueta,
            className: "tecla tecla-inactiva"
        }, [createElement("input", {
            type: "radio",
            name: nombre,
            value: valor,
            checked: estaActivo,
            className: "tecla-radio-oculto",
            onchange: (evento) => alCambiar((evento.currentTarget as HTMLInputElement).value)
        })]);
    }
}

TemplateInspector.registrar(TemplateRelacion);