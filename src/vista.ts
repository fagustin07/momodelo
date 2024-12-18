import {Entidad} from "./entidad.ts";
import {hacerArrastrable} from "./arrastrable.ts";
import {coordenada} from "./posicion.ts";

function posicionarElemento(elementoDOMEntidad: HTMLDivElement, entidad: Entidad) {
    elementoDOMEntidad.style.translate = `${entidad.posicion().x}px ${entidad.posicion().y}px`;
}

function agrearAtributoEn(contenedorAtributos: HTMLDivElement, entidad: Entidad, idAtributo: number) {
    const atributoNuevo = document.createElement("div");
    atributoNuevo.className = "atributo";
    const campoNombre = document.createElement("input");
    campoNombre.value = entidad.nombreAtributo(idAtributo);
    campoNombre.title = "Nombre de atributo";
    campoNombre.addEventListener("input", () => {
        entidad.renombrarAtributo(idAtributo, campoNombre.value);
    });
    atributoNuevo.append(campoNombre);

    atributoNuevo.addEventListener("click", (evento) => {
        if (evento.ctrlKey && evento.shiftKey) {
            evento.stopPropagation();
            atributoNuevo.remove();
            entidad.atributos().splice(idAtributo, 1);
            console.log(`Atributo eliminado`);
        }
    });
    contenedorAtributos.append(atributoNuevo);
    campoNombre.focus();
}

function vistaRepresentandoEntidad(entidad: Entidad, entidadesEnModelo: Entidad[]) {

    const elementoDOMEntidad = document.createElement("div");
    elementoDOMEntidad.className = "entidad";
    posicionarElemento(elementoDOMEntidad, entidad);
    const campoNombre = document.createElement("input");
    campoNombre.title = "nombre Entidad";
    campoNombre.value = entidad.nombre();
    campoNombre.addEventListener("input", () => {
        entidad.cambiarNombre(campoNombre.value);
    });
    const contenedorAtributos = document.createElement("div");
    const botonAgregarAtributo = document.createElement("button");
    botonAgregarAtributo.textContent = "+";
    botonAgregarAtributo.title = "Agregar atributo";
    botonAgregarAtributo.addEventListener("click", () => {
        const idAtributo = entidad.agregarAtributo("");
        agrearAtributoEn(contenedorAtributos, entidad, idAtributo);
    });

    entidad.atributos().forEach((_, indice) => {
        agrearAtributoEn(contenedorAtributos, entidad, indice);
    })
    elementoDOMEntidad.append(campoNombre, botonAgregarAtributo, contenedorAtributos);

    hacerArrastrable(elementoDOMEntidad, {
        alAgarrar: () => {
            elementoDOMEntidad.classList.add("moviendose");
            elementoDOMEntidad.parentElement?.append(elementoDOMEntidad);
        },
        alArrastrar: (_, delta) => {
            entidad.moverseHacia(delta);
            posicionarElemento(elementoDOMEntidad, entidad);

        },
        alSoltar: () => elementoDOMEntidad.classList.remove("moviendose"),
    });
    requestAnimationFrame(() => campoNombre.focus());

    elementoDOMEntidad.addEventListener("click", (evento) => {
        if (evento.ctrlKey && evento.shiftKey) {
            elementoDOMEntidad.remove(); // Eliminar del DOM
            entidadesEnModelo.splice(entidadesEnModelo.indexOf(entidad));
            console.log(`Entidad eliminada: ${entidad.nombre()}`);
        }
    });

    return elementoDOMEntidad;
}

export function init(elementoRaiz: HTMLElement, entidadesEnModelo: Entidad[]) {
    elementoRaiz.addEventListener("dblclick", evento => {
        if (evento.target !== elementoRaiz) return;

        const posicion = coordenada(evento.offsetX, evento.offsetY);
        const entidad = new Entidad("", [], posicion);
        entidadesEnModelo.push(entidad);

        elementoRaiz.append(vistaRepresentandoEntidad(entidad, entidadesEnModelo));

        console.log(entidad);
    });

    entidadesEnModelo.forEach(entidad => {
        elementoRaiz.append(vistaRepresentandoEntidad(entidad, entidadesEnModelo));
    });
}