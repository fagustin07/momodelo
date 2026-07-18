import {ElementoMER} from "../../modelo/elementoMER";
import {Entidad} from "../../modelo/entidad";
import {Relacion} from "../../modelo/relacion";
import {VistaEditorMER} from "../vistaEditorMER.ts";
import {createElement} from "../dom/createElement.ts";
import {TemplateInspector} from "./templateInspector.ts";

export class TemplateEntidad extends TemplateInspector {

    static puedeManejar(elemento: ElementoMER): boolean {
        return elemento.representaUnaEntidad();
    }

    constructor(
        vistaEditor: VistaEditorMER,
        elemento: ElementoMER,
    ) {
        super(vistaEditor, elemento);
    }

    representarseEn(contenedor: HTMLElement): TemplateEntidad {
        this._inputCon(this.entidad.nombre());
        this._inputNombre!.oninput = () =>
            this.vistaEditor.renombrarEntidad(this._inputNombre!.value, this.entidad);

        contenedor.append(
            this._titulo("Entidad"),
            this._separador(),
            this._subtitulo("NOMBRE"),
            this._inputNombre!,
            this._separador(),
            ...this._seccionDependencia(),
        );

        return this;
    }

    private get entidad(): Entidad {
        return this.elemento as Entidad;
    }

    private _seccionDependencia(): HTMLElement[] {
        const relaciones = this.vistaEditor.modeloER.relacionesAsociadasA(this.entidad);
        const identificadoraActual = this.vistaEditor.modeloER.relacionDebilDe(this.entidad);
        let relacionSeleccionada: Relacion | null = identificadoraActual ?? relaciones[0] ?? null;
        const selector = this._selectorDeRelacion(relaciones, relacionSeleccionada);

        selector.onchange = () => {
            relacionSeleccionada = relaciones.find(
                relacion => relacion.id().toString() === selector.value
            ) ?? null;
            if (this.entidad.esDebil()) {
                this._aplicarDependencia(relacionSeleccionada);
            }
        };

        return [
            this._subtitulo("TIPO"),
            this._opcionesDeTipo(() => relacionSeleccionada),
            ...(this.entidad.esDebil() ? [
                createElement("label", {
                    textContent: "Esta entidad se identifica a través de la relación...",
                    className: "inspector-texto-fijo",
                    htmlFor: "relacion-identificadora-entidad",
                }),
                selector,
            ] : []),
        ];
    }

    private _opcionesDeTipo(
        relacionSeleccionada: () => Relacion | null
    ): HTMLElement {
        return this._elementoGrupoDividido([
            this._crearElementoRadioDividido(
                {etiqueta: "Fuerte", valor: "fuerte"},
                "tipo-entidad",
                !this.entidad.esDebil(),
                () => this._aplicarDependencia(null)
            ),
            this._crearElementoRadioDividido(
                {etiqueta: "Débil", valor: "debil"},
                "tipo-entidad",
                this.entidad.esDebil(),
                () => this._aplicarEntidadDebil(relacionSeleccionada())
            ),
        ], "inspector-grupo-teclas-tipo");
    }

    private _selectorDeRelacion(
        relaciones: Relacion[],
        seleccionada: Relacion | null
    ): HTMLSelectElement {
        return createElement("select", {
            id: "relacion-identificadora-entidad",
            title: "Relación identificadora",
            disabled: relaciones.length === 0,
            className: "inspector-selector-relacion",
        }, relaciones.map(relacion =>
            createElement("option", {
                value: relacion.id().toString(),
                textContent: this._descripcionDe(relacion),
                selected: relacion === seleccionada,
            })
        ));
    }

    private _descripcionDe(relacion: Relacion): string {
        const otraEntidad = relacion.entidadOrigen() === this.entidad
            ? relacion.entidadDestino()
            : relacion.entidadOrigen();
        return `${relacion.nombre()}, con ${otraEntidad.nombre()}`;
    }

    private _aplicarDependencia(relacion: Relacion | null): void {
        this.vistaEditor.configurarDependenciaDeEntidad(this.entidad, relacion);
        this.vistaEditor.seleccionarA(this.entidad);
    }

    private _aplicarEntidadDebil(relacion: Relacion | null): void {
        this.vistaEditor.configurarEntidadComoDebil(this.entidad, relacion);
        this.vistaEditor.seleccionarA(this.entidad);
    }
}

TemplateInspector.registrar(TemplateEntidad);