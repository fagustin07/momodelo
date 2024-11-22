import "./style.css";

type Posicion = readonly [number, number];

class Entidad {
    private _nombre: string;
    private _atributos: string[];
    private _posicion: Posicion;

    constructor(nombre: string, atributos: string[], posicion: Posicion) {
        this._nombre = nombre;
        this._posicion = posicion;
        this._atributos = atributos;
    }

    cambiarNombre(nuevoNombre: string) {
        this._nombre = nuevoNombre;
    }

    agregarAtributo(nuevoAtributo: string) {
        this._atributos.push(nuevoAtributo);
        return this._atributos.length - 1;
    }

    renombrarAtributo(idAtributo: number, nuevoNombre: string) {
        this._atributos[idAtributo] = nuevoNombre;
    }

    atributos() {
        return this._atributos;
    }

    nombre() {
        return this._nombre;
    }

    posicion() {
        return this._posicion;
    }

    nombreAtributo(idAtributo: number) {
        return this._atributos[idAtributo];
    }
}

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

function vistaRepresentandoEntidad(entidad: Entidad) {
    const nuevaEntidad = document.createElement("div");
    nuevaEntidad.className = "entidad";
    nuevaEntidad.style.left = `${entidad.posicion()[0]}px`;
    nuevaEntidad.style.top = `${entidad.posicion()[1]}px`;
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
    nuevaEntidad.append(campoNombre, botonAgregarPropiedad, contenedorAtributos);
    return nuevaEntidad;
}

document.body.addEventListener("dblclick", evento => {
    if (evento.target !== document.body) return;

    const posicion = [evento.offsetX, evento.offsetY] as const;
    const entidad = new Entidad("", [], posicion);

    document.body.append(vistaRepresentandoEntidad(entidad));

    console.log(entidad);
});

const entidad = new Entidad("Mi Entidad", ["a", "b"], [10, 10]);

document.body.append(vistaRepresentandoEntidad(entidad));
