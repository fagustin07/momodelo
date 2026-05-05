import {ModeloER} from "../servicios/modeloER.ts";
import {ProgramaMR, RelacionMR} from "./modeloSintacticoMR.ts";
import {Entidad} from "../modelo/entidad.ts";
import {ErroresValidaciónMR} from "../servicios/errores.ts";

export class ComparadorMR {
    esConsistente(modeloER: ModeloER, modeloMR: ProgramaMR): void {
        const errores = modeloER.entidades.flatMap(entidad => {
            const error = this._obtenerErrorDeEntidad(entidad, modeloMR);
            return error ? [error] : [];
        });

        if (errores.length > 0)
            throw new ErroresValidaciónMR(errores);
    }

    private _obtenerErrorDeEntidad(entidad: Entidad, modeloMR: ProgramaMR): string | null {
        const nombreEntidad = entidad.nombre().toLowerCase();
        const relacionAsociada = modeloMR.relaciones().find(rel => rel.nombre.toLowerCase() === nombreEntidad);

        if (!relacionAsociada) {
            return `Falta la relación '${entidad.nombre()}' en el modelo relacional.`;
        }

        if (!this._tienenMismasClavesPrimarias(entidad, relacionAsociada)) {
            return `La relación '${entidad.nombre()}' tiene una clave primaria incorrecta.`;
        }

        if (!this._tienenMismosAtributosSimples(entidad, relacionAsociada)) {
            return `La relación '${entidad.nombre()}' no contiene los mismos atributos simples que la entidad.`;
        }

        return null;
    }


    private _tienenMismasClavesPrimarias(entidad: Entidad, relacion: RelacionMR): boolean {
        const pksEncontradas = relacion.clavesPrimarias().map(pk => pk.nombre.toLowerCase());
        const pksEsperadas = entidad.atributos()
            .filter(atr => atr.esPK())
            .map(atr => atr.nombre().toLowerCase());

        return pksEsperadas.length === pksEncontradas.length &&
               pksEsperadas.every(pk => pksEncontradas.includes(pk));
    }

    private _tienenMismosAtributosSimples(entidad: Entidad, relacion: RelacionMR): boolean {
        const simplesEncontrados = relacion.atributosSimples().map(atr => atr.nombre.toLowerCase());
        const simplesEsperados = entidad.atributos()
            .filter(atr => atr.tipo() === 'simple')
            .map(atr => atr.nombre().toLowerCase());

        return simplesEsperados.length === simplesEncontrados.length &&
               simplesEsperados.every(nombre => simplesEncontrados.includes(nombre));
    }
}



