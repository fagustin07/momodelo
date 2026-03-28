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
        onRerenderizar: (elemento: ElementoMER) => void,
        elemento: ElementoMER,
    ) {
        super(vistaEditor, onRerenderizar);
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
            ...this._seccionCardinalidades(),
        );

        return this;
    }

    private _seccionTipo(): HTMLElement[] {
        const grupoTeclas = createElement(
            "div",
            {className: "tecla-grupo-segmentado"},
            [
                this._botónParaCambiarA('fuerte', this.relacion.esFuerte(), this._cambiarTipo),
                this._botónParaCambiarA('débil', this.relacion.esDebil(), this._cambiarTipo)
            ]);

        const contenedor = createElement("div", {className: "inspector-grupo-teclas-tipo"});
        contenedor.append(grupoTeclas);

        return [this._subtitulo("TIPO"), contenedor];
    }

    private _seccionCardinalidades(): HTMLElement[] {
        return [
            this._subtitulo("CARDINALIDADES"),
            this._renderCardinalidadDestino(),
            createElement("p", {textContent: "Mientras que...", className: "inspector-mientras-que"}),
            this._renderCardinalidadOrigen(),
            ...(this.relacion.esDebil() ? [this._separador(), this._botonInvertirDependencia()] : [])
        ];
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
        getCardinalidad: () => Cardinalidad,
        alCambiarCardinalidad: (c: Cardinalidad) => void,
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
                (nuevaMínima) => alCambiarCardinalidad([nuevaMínima as CardinalidadMinima, max])),

            this._filaOpciones("Y pueden hacerlo como máximo", [
                    {etiqueta: "Una vez", valor: "1"},
                    {etiqueta: "Muchas veces", valor: "N"}
                ], `max-${rolEnLaRelación}`,
                max,
                (nuevaMáxima) => alCambiarCardinalidad([min, nuevaMáxima as CardinalidadMáxima]))
        ]);
    }

    private _botónParaCambiarA(tipoRelación: TipoRelacion, activo: boolean, onClick: (tipo: TipoRelacion) => void): HTMLButtonElement {
        return createElement("button", {
            textContent: this._primerLetraMayúscula(tipoRelación),
            title: `Cambiar a relación ${tipoRelación.toUpperCase()}`,
            className: activo ? "tecla tecla-activa" : "tecla tecla-inactiva",
            onclick: () => onClick(tipoRelación),
        });
    }

    private _cambiarTipo = (tipo: TipoRelacion): void => {
        const relacionFinal = this.vistaEditor.cambiarTipoDeRelacion(this.relacion, tipo);
        if (relacionFinal)
            this.onRerenderizar(relacionFinal);
    }

    private _secciónIdentidad(): HTMLElement[] {
        return [this._subtitulo("NOMBRE"), this._inputNombre!];
    }

    private _renderCardinalidadDestino() {
        return this._formularioCardinalidad(
            `Para las instancias de ${this.relacion.entidadDestino().nombre()}`,
            () => this.relacion.cardinalidadDestino(),
            (nuevaCardinalidad) => {
                this.vistaEditor.cambiarCardinalidadDestinoA(this.relacion, nuevaCardinalidad);
                this.onRerenderizar(this.relacion);
            },
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
                (nuevaCardinalidad) => {
                    this.vistaEditor.cambiarCardinalidadOrigenA(this.relacion, nuevaCardinalidad);
                    this.onRerenderizar(this.relacion);
                },
                "origen"
            );
        }
    }

    private _filaOpciones(
        titulo: string,
        opciones: { etiqueta: string; valor: string }[],
        nombre: string,
        valorActual: string,
        onChange: (valor: string) => void
    ): HTMLElement {
        return createElement("div", {className: "inspector-teclas-fila"}, [
            createElement("span", {textContent: "–", className: "inspector-marcador-fila"}),
            createElement("span", {textContent: titulo, className: "inspector-teclas-label"}),
            createElement("div", {className: "inspector-grupo-teclas tecla-grupo-segmentado"},
                opciones.map(opción =>
                    this._crearRadioSegmentado(opción, nombre, valorActual === opción.valor, onChange))
            )
        ]);
    }

    private _crearRadioSegmentado(
        {etiqueta, valor}: { etiqueta: string, valor: string },
        name: string,
        estaActivo: boolean,
        onChange: (v: string) => void
    ): HTMLElement {
        const radio = createElement("input", {
            type: "radio",
            name,
            value: valor,
            checked: estaActivo,
            className: "tecla-radio-oculto",
            onchange: (e) => onChange((e.currentTarget as HTMLInputElement).value)
        });

        return createElement("label", {
            textContent: etiqueta,
            className: "tecla tecla-inactiva"
        }, [radio]);
    }

    private _primerLetraMayúscula(texto: string) {
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }
}

TemplateInspector.registrar(TemplateRelacion);