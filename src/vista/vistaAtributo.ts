import {Entidad} from "../modelo/entidad.ts";

export class VistaAtributo {
    private _entidad: Entidad;
    private _idAtributo: number;

    constructor(entidad: Entidad, idAtributo: number) {
        this._entidad = entidad;
        this._idAtributo = idAtributo;
    }

    representarse() {
        const atributoNuevo = document.createElement("div");
        atributoNuevo.className = "atributo";
        const campoNombre = document.createElement("input");
        campoNombre.value = this._entidad.nombreAtributo(this._idAtributo);
        campoNombre.title = "Nombre de atributo";
        // VISTA MODELO
        campoNombre.addEventListener("input", () => {
            this._entidad.renombrarAtributo(this._idAtributo, campoNombre.value);
        });
        atributoNuevo.append(campoNombre);

        // VISTA MODELO
        atributoNuevo.addEventListener("click", (evento) => {
            if (evento.ctrlKey && evento.shiftKey) {
                evento.stopPropagation();
                atributoNuevo.remove();
                this._entidad.atributos().splice(this._idAtributo, 1);
                console.log(`Atributo eliminado`);
            }
        });
        return atributoNuevo;
    }
}