import {Entidad} from "../modelo/entidad.ts";
import {Relacion} from "../modelo/relacion.ts";
import {RelacionMR} from "./modeloSintacticoMR.ts";
import {ModeloER} from "../servicios/modeloER.ts";

type ReglaRegistrable = {
    new(): ReglaCardinalidad;
    puedeHacerseCargoDe(relacion: Relacion): boolean;
};

export abstract class ReglaCardinalidad {
    private static readonly _registradas: ReglaRegistrable[] = [];

    static registrar(clase: ReglaRegistrable): void {
        ReglaCardinalidad._registradas.push(clase);
    }

    static instanciarPara(relacion: Relacion): ReglaCardinalidad | null {
        const reglaClase = ReglaCardinalidad._registradas.find(r => r.puedeHacerseCargoDe(relacion));
        return reglaClase ? new reglaClase() : null;
    }

    abstract validar(relacion: Relacion, relacionesMR: RelacionMR[], modeloER: ModeloER): string[];

    protected pksCompletasDe(entidad: Entidad, modeloER: ModeloER): string[] {
        const pksPropias = entidad.atributos()
            .filter(a => a.esPK())
            .map(a => a.nombre());

        const relacionFuerte = modeloER.relaciones.find(
            r => r.esDebil() && r.entidadOrigen() === entidad,
        );

        if (!relacionFuerte)
            return pksPropias;

        return [
            ...this.pksCompletasDe(relacionFuerte.entidadDestino(), modeloER),
            ...pksPropias,
        ];
    }

    protected fkMatcheaPK(nombreFK: string, nombrePK: string, nombreEntidad: string): boolean {
        const fk = nombreFK.toLowerCase();
        const pk = nombrePK.toLowerCase();
        const ent = nombreEntidad.toLowerCase();
        return fk === pk || fk === `${pk}_${ent}`;
    }

export class ReglaMuchosAMuchos extends ReglaCardinalidad {
    static puedeHacerseCargoDe(relacion: Relacion): boolean {
        return relacion.cardinalidadOrigen()[1] === 'N' && relacion.cardinalidadDestino()[1] === 'N';
    }

    validar(relacion: Relacion, relacionesMR: RelacionMR[], modeloER: ModeloER): string[] {
        const errores: string[] = [];
        const entidadOrigen = relacion.entidadOrigen();
        const entidadDestino = relacion.entidadDestino();
        const [minO] = relacion.cardinalidadOrigen();
        const [minD] = relacion.cardinalidadDestino();

        const tablaIntermedia = relacionesMR.find(
            r => r.nombre.toLowerCase() === relacion.nombre().toLowerCase(),
        );

        if (!tablaIntermedia) {
            errores.push(
                `Cardinalidad (${minO},N) a (${minD},N): Se debe crear la tabla intermedia ` +
                `'${relacion.nombre()}' con la clave completa de ` +
                `'${entidadOrigen.nombre()}' y '${entidadDestino.nombre()}' como PK y FK.`,
            );
            return errores;
        }

        const faltaPKFKOrigen = this.pksCompletasDe(entidadOrigen, modeloER).some(
            pk => !tablaIntermedia.atributos.some(atr =>
                atr.esClavePrimaria() && atr.esForánea() &&
                this.fkMatcheaPK(atr.nombre, pk, entidadOrigen.nombre()),
            ),
        );
        if (faltaPKFKOrigen) {
            errores.push(
                `Cardinalidad (${minO},N) a (${minD},N): La tabla '${tablaIntermedia.nombre}' ` +
                `debe tener la clave completa de '${entidadOrigen.nombre()}' como PK y FK.`,
            );
        }

        const faltaPKFKDestino = this.pksCompletasDe(entidadDestino, modeloER).some(
            pk => !tablaIntermedia.atributos.some(atr =>
                atr.esClavePrimaria() && atr.esForánea() &&
                this.fkMatcheaPK(atr.nombre, pk, entidadDestino.nombre()),
            ),
        );
        if (faltaPKFKDestino) {
            errores.push(
                `Cardinalidad (${minO},N) a (${minD},N): La tabla '${tablaIntermedia.nombre}' ` +
                `debe tener la clave completa de '${entidadDestino.nombre()}' como PK y FK.`,
            );
        }

        return errores;
    }
}

export class ReglaEntidadDebil extends ReglaCardinalidad {
    static puedeHacerseCargoDe(relacion: Relacion): boolean {
        return relacion.esDebil();
    }

    validar(relacion: Relacion, relacionesMR: RelacionMR[], modeloER: ModeloER): string[] {
        const errores: string[] = [];
        const entidadDebil = relacion.entidadOrigen();
        const entidadFuerte = relacion.entidadDestino();

        const tablaIntermedia = relacionesMR.find(
            r => r.nombre.toLowerCase() === relacion.nombre().toLowerCase(),
        );

        if (!tablaIntermedia) {
        const relaciónDébilMR = this._relacionMRParaEntidad(entidadDebil, relacionesMR);
        if (!relaciónDébilMR) {
            errores.push(
                `Falta la relación '${entidadDebil.nombre()}' en el MR para la entidad débil.`,
            );
            return errores;
        }

        const pksCompletasFuerte = this.pksCompletasDe(entidadFuerte, modeloER);

        const faltaAbsorberFK = pksCompletasFuerte.some(
            pk => !relaciónDébilMR.clavesForáneas().some(fk =>
                fk.esClavePrimaria() &&
                this.fkMatcheaPK(fk.nombre, pk, entidadFuerte.nombre()),
            ),
        );
        if (faltaAbsorberFK) {
            errores.push(
                `Entidad Débil: Se debe absorber la clave completa de ` +
                `'${entidadFuerte.nombre()}' en '${entidadDebil.nombre()}' como PK y FK.`,
            );
        }

        return errores;
    }

    private _validarPKsComoFKEnRelacion(tablaMR: RelacionMR, entidad: Entidad, modeloER: ModeloER): string[] {
        const errores: string[] = [];
        const pksCompletas = this.pksCompletasDe(entidad, modeloER);
    private _relacionMRParaEntidad(entidad: Entidad, relacionesMR: RelacionMR[]): RelacionMR | undefined {
        return relacionesMR.find(r => r.nombre.toLowerCase() === entidad.nombre().toLowerCase());
    }
}

        pksCompletas.forEach((nombrePK) => {
            const tienePKFK = tablaMR.atributos.some(atr =>
                atr.esClavePrimaria() &&
                atr.esForánea() &&
                this.fkMatcheaPK(atr.nombre, nombrePK, entidad.nombre()),
            );

            if (!tienePKFK) {
                errores.push(
                    `La tabla '${tablaMR.nombre}' no tiene la clave '${nombrePK}' ` +
                    `de '${entidad.nombre()}' como PK y FK.`,
                );
            }
        });

        return errores;
    }
}

export class ReglaEntidadDebil extends ReglaCardinalidad {
    static puedeHacerseCargoDe(relacion: Relacion): boolean {
        return relacion.esDebil();
    }

    validar(relacion: Relacion, relacionesMR: RelacionMR[], modeloER: ModeloER): string[] {
        const errores: string[] = [];
        const entidadDebil = relacion.entidadOrigen();
        const entidadFuerte = relacion.entidadDestino();

        const relaciónDébilMR = this._relacionMRParaEntidad(entidadDebil, relacionesMR);
        if (!relaciónDébilMR) {
            errores.push(
                `Falta la relación '${entidadDebil.nombre()}' en el MR para la entidad débil.`,
            );
            return errores;
        }

        const pksCompletasFuerte = this.pksCompletasDe(entidadFuerte, modeloER);
        const pksPropiasDébil = entidadDebil.atributos()
            .filter(a => a.esPK())
            .map(a => a.nombre());

        const atributosPKDébil = relaciónDébilMR.clavesPrimarias().map(a => a.nombre);

        pksPropiasDébil
            .filter(pk => !atributosPKDébil.some(a => a.toLowerCase() === pk.toLowerCase()))
            .forEach(pk => errores.push(
                `La entidad débil '${entidadDebil.nombre()}' no tiene su clave parcial ` +
                `'${pk}' como PK.`,
            ));

        pksCompletasFuerte
            .filter(pk =>
                !relaciónDébilMR.clavesForáneas().some(fk =>
                    fk.esClavePrimaria() &&
                    this.fkMatcheaPK(fk.nombre, pk, entidadFuerte.nombre()),
                ),
            )
            .forEach(pk => errores.push(
                `La entidad débil '${entidadDebil.nombre()}' no absorbe el atributo ` +
                `'${pk}' de '${entidadFuerte.nombre()}' como PK y FK.`,
            ));

        return errores;
    }

    private _relacionMRParaEntidad(entidad: Entidad, relacionesMR: RelacionMR[]): RelacionMR | undefined {
        return relacionesMR.find(r => r.nombre.toLowerCase() === entidad.nombre().toLowerCase());
    }
}

ReglaCardinalidad.registrar(ReglaEntidadDebil);
ReglaCardinalidad.registrar(ReglaMuchosAMuchos);