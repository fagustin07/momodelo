import "./style.css";
import {Entidad} from "./entidad.ts";
import {hacerArrastrable} from "./arrastrable.ts";
import {point} from "./posicion.ts";

function vistaRepresentandoAtributo(entidad: Entidad, idAtributo: number) {
    const atributoNuevo = document.createElement("div");
    atributoNuevo.className = "atributo";
    const campoNombre = document.createElement("input");
    campoNombre.value = entidad.nombreAtributo(idAtributo);
    campoNombre.addEventListener("input", () => {
        entidad.renombrarAtributo(idAtributo, campoNombre.value);
    });
    atributoNuevo.append(campoNombre);
    return atributoNuevo;
}

function posicionarElemento(elementoDOMEntidad: HTMLDivElement, entidad: Entidad) {
    elementoDOMEntidad.style.translate = `${entidad.posicion().x}px ${entidad.posicion().y}px`;
}

function vistaRepresentandoEntidad(entidad: Entidad) {

    const elementoDOMEntidad = document.createElement("div");
    elementoDOMEntidad.className = "entidad";
    posicionarElemento(elementoDOMEntidad, entidad);
    const campoNombre = document.createElement("input");
    campoNombre.value = entidad.nombre();
    campoNombre.addEventListener("input", () => {
        entidad.cambiarNombre(campoNombre.value);
    });
    const contenedorAtributos = document.createElement("div");
    const botonAgregarPropiedad = document.createElement("button");
    botonAgregarPropiedad.textContent = "+";
    botonAgregarPropiedad.addEventListener("click", () => {
        const idAtributo = entidad.agregarAtributo("");
        contenedorAtributos.append(vistaRepresentandoAtributo(entidad, idAtributo));
    });

    entidad.atributos().forEach((_, indice) => {
        contenedorAtributos.append(vistaRepresentandoAtributo(entidad, indice));
    })
    elementoDOMEntidad.append(campoNombre, botonAgregarPropiedad, contenedorAtributos);

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

    return elementoDOMEntidad;
}

document.body.addEventListener("dblclick", evento => {
    if (evento.target !== document.body) return;

    const posicion = point(evento.offsetX, evento.offsetY);
    const entidad = new Entidad("", [], posicion);

    document.body.append(vistaRepresentandoEntidad(entidad));

    console.log(entidad);
});

const entidad = new Entidad("Mi Entidad", ["a", "b"], point(10,10));

document.body.append(vistaRepresentandoEntidad(entidad));
