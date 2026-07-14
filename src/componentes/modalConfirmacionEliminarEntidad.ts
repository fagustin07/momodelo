import {Entidad} from "../modelo/entidad.ts";
import {Relacion} from "../modelo/relacion.ts";
import {createElement} from "../vista/dom/createElement.ts";

interface OpcionesDeConfirmaciónParaBorrarEntidad {
    entidad: Entidad;
    relaciones: Relacion[];
    alConfirmar: () => void;
    alCancelar: () => void;
}

export function mostrarConfirmaciónParaEliminarEntidad(opciones: OpcionesDeConfirmaciónParaBorrarEntidad): void {
    const {entidad, relaciones, alConfirmar, alCancelar} = opciones;
    const relacionesAsociadas = relaciones.filter(relacion => relacion.contieneA(entidad));
    const debilesDependientes = relacionesAsociadas
        .filter(relacion => relacion.esDebil() && relacion.entidadDestino() === entidad)
        .map(relacion => relacion.entidadOrigen());

    const cerrar = (seConfirmó: boolean) => {
        document.removeEventListener("keydown", cerrarConEscape, {capture: true});
        overlay.remove();
        seConfirmó ? alConfirmar() : alCancelar();
    };

    const cerrarConEscape = (evento: KeyboardEvent) => {
        if (evento.key !== "Escape") return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        cerrar(false);
    };

    const mensaje = construirMensaje(entidad, relacionesAsociadas, debilesDependientes);

    const botonCancelar = createElement("button", {
        className: "modal-eliminar-entidad-boton modal-eliminar-entidad-boton--cancelar",
        textContent: "Cancelar",
        onclick: () => cerrar(false),
    });
    const botonEliminar = createElement("button", {
        className: "modal-eliminar-entidad-boton modal-eliminar-entidad-boton--eliminar",
        textContent: "Confirmar",
        onclick: () => cerrar(true),
    });

    const panel = createElement("div", {
        className: "modal-eliminar-entidad-panel",
        role: "dialog",
        ariaModal: "true",
        ariaLabel: `Confirmar eliminación de ${entidad.nombre()}`,
    }, [
        mensaje,
        createElement("div", {className: "modal-eliminar-entidad-acciones"}, [botonCancelar, botonEliminar]),
    ]);

    const overlay = createElement("div", {
        className: "modal-eliminar-entidad-overlay",
        onclick: (evento: MouseEvent) => {
            if (evento.target === overlay) cerrar(false);
        },
    }, [panel]);

    document.addEventListener("keydown", cerrarConEscape, {capture: true});
    document.body.append(overlay);
    botonCancelar.focus();
}

function construirMensaje(entidad: Entidad, relaciones: Relacion[], debilesDependientes: Entidad[]): HTMLParagraphElement {
    const atributos = entidad.atributos().map(atributo => atributo.nombre());
    const mensaje = createElement("p", {className: "modal-eliminar-entidad-mensaje"});
    mensaje.append("Estás por borrar la entidad ");
    agregarNombres(mensaje, [entidad.nombre()]);

    if (atributos.length > 0) {
        mensaje.append(` y, junto con ella, ${atributos.length === 1 ? "su atributo" : "sus atributos"} `);
        agregarNombres(mensaje, atributos);
        mensaje.append(".");
    }

    if (relaciones.length > 0) {
        mensaje.append(atributos.length > 0
            ? ` También se ${relaciones.length === 1 ? "borrará su relación" : "borrarán sus relaciones"} `
            : ` y ${relaciones.length === 1 ? "su relación" : "sus relaciones"} `);
        agregarNombres(mensaje, relaciones.map(relacion => relacion.nombre()));
        mensaje.append(".");
    }

    if (debilesDependientes.length > 0) {
        mensaje.append(` Por último, ${debilesDependientes.length === 1 ? "la entidad débil" : "las entidades débiles"} `);
        agregarNombres(mensaje, debilesDependientes.map(debil => debil.nombre()), true);
        mensaje.append(` ${debilesDependientes.length === 1 ? "pasará" : "pasarán"} a ser ${debilesDependientes.length === 1 ? "fuerte" : "fuertes"} al perder la entidad de la cual ${debilesDependientes.length === 1 ? "depende" : "dependen"} para identificarse en el modelo.`);
    }

    mensaje.append(" ¿Confirmás esta acción?");
    return mensaje;
}

function agregarNombres(contenedor: HTMLElement, nombres: string[], advertencia = false): void {
    nombres.forEach((nombre, indice) => {
        if (indice > 0) contenedor.append(indice === nombres.length - 1 ? " y " : ", ");
        contenedor.append(createElement("strong", {
            textContent: nombre,
        }));
    });
}