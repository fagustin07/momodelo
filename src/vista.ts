import {Entidad} from "./modelo/entidad.ts";
import {hacerArrastrable} from "./arrastrable.ts";
import {coordenada} from "./posicion.ts";
import {VistaAtributo} from "./vista/vistaAtributo.ts";
import {Modelador} from "./servicios/modelador.ts";

function posicionarElemento(elementoDOMEntidad: HTMLDivElement, entidad: Entidad) {
    elementoDOMEntidad.style.translate = `${entidad.posicion().x}px ${entidad.posicion().y}px`;
}

function agregarAtributoEn(contenedorAtributos: HTMLDivElement, entidad: Entidad, idAtributo: number, modelador: Modelador) {
    const vistaAtributo = new VistaAtributo(entidad, idAtributo, modelador);
    vistaAtributo.representarseEn(contenedorAtributos);
}

function vistaRepresentandoEntidad(entidad: Entidad, entidadesEnModelo: Entidad[], modelador: Modelador) {
    const elementoDOMEntidad = document.createElement("div");
    elementoDOMEntidad.className = "entidad";
    posicionarElemento(elementoDOMEntidad, entidad);
    const campoNombre = document.createElement("input");
    campoNombre.title = "nombre Entidad";
    campoNombre.value = entidad.nombre();
    // VISTA MODELO
    campoNombre.addEventListener("input", () => {
        entidad.cambiarNombre(campoNombre.value);
    });
    const contenedorAtributos = document.createElement("div");
    const botonAgregarAtributo = document.createElement("button");
    botonAgregarAtributo.textContent = "+";
    botonAgregarAtributo.title = "Agregar atributo";
    botonAgregarAtributo.addEventListener("click", () => {
        const idAtributo = entidad.agregarAtributo("");
        agregarAtributoEn(contenedorAtributos, entidad, idAtributo, modelador);
    });

    entidad.atributos().forEach((_, indice) => {
        agregarAtributoEn(contenedorAtributos, entidad, indice, modelador);
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

    // VISTA MODELO
    elementoDOMEntidad.addEventListener("click", (evento) => {
        if (evento.ctrlKey && evento.shiftKey) {
            elementoDOMEntidad.remove(); // Eliminar del DOM
            // VISTA MODELO
            entidadesEnModelo.splice(entidadesEnModelo.indexOf(entidad));
            console.log(`Entidad eliminada: ${entidad.nombre()}`);
        }
    });

    return elementoDOMEntidad;
}

export function init(elementoRaiz: HTMLElement, entidadesEnModelo: Entidad[]) {
    const modelador = new Modelador();

    // VISTA MODELO
    elementoRaiz.addEventListener("dblclick", evento => {
        if (evento.target !== elementoRaiz) return;

        const posicion = coordenada(evento.offsetX, evento.offsetY);
        const entidad = new Entidad("", [], posicion);
        entidadesEnModelo.push(entidad);

        elementoRaiz.append(vistaRepresentandoEntidad(entidad, entidadesEnModelo, modelador));

        console.log(entidad);
    });

    entidadesEnModelo.forEach(entidad => {
        elementoRaiz.append(vistaRepresentandoEntidad(entidad, entidadesEnModelo, modelador));
    });
}