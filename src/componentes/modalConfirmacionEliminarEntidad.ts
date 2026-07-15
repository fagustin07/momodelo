import {Entidad} from "../modelo/entidad.ts";
import {Relacion} from "../modelo/relacion.ts";
import {createElement} from "../vista/dom/createElement.ts";
import {mostrarModalConfirmacion} from "./modalConfirmacion.ts";

export function mostrarConfirmaciónParaEliminarEntidad(
    entidad: Entidad,
    relaciones: Relacion[],
    alConfirmar: () => void,
    alCancelar: () => void,
): void {
    const relacionesAsociadas = relaciones.filter(relacion => relacion.contieneA(entidad));
    const debilesDependientes = relacionesAsociadas
        .filter(relacion => relacion.esDebil() && relacion.entidadDestino() === entidad)
        .map(relacion => relacion.entidadOrigen());

    mostrarModalConfirmacion({
        mensajeInformativo: construirMensaje(entidad, relacionesAsociadas, debilesDependientes),
        alConfirmar,
        alCancelar,
    });
}

function construirMensaje(entidad: Entidad, relaciones: Relacion[], debilesDependientes: Entidad[]): HTMLParagraphElement {
    const atributos = entidad.atributos().map(atributo => atributo.nombre());
    const mensaje = createElement("p", {className: "modal-confirmacion-mensaje"});
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
        agregarNombres(mensaje, debilesDependientes.map(debil => debil.nombre()));
        mensaje.append(` ${debilesDependientes.length === 1 ? "pasará" : "pasarán"} a ser ${debilesDependientes.length === 1 ? "fuerte" : "fuertes"} al perder la entidad de la cual ${debilesDependientes.length === 1 ? "depende" : "dependen"} para identificarse en el modelo.`);
    }

    return mensaje;
}

function agregarNombres(contenedor: HTMLElement, nombres: string[]): void {
    nombres.forEach((nombre, indice) => {
        if (indice > 0) contenedor.append(indice === nombres.length - 1 ? " y " : ", ");
        contenedor.append(createElement("strong", {
            textContent: nombre,
        }));
    });
}