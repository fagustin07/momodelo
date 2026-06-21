import {Entidad} from "../modelo/entidad.ts";
import {Relacion} from "../modelo/relacion.ts";
import {RelacionMR} from "./modeloSintacticoMR.ts";
import {ModeloER} from "../servicios/modeloER.ts";
import {Cardinalidad} from "../tipos/tipos.ts";

type LadoNormalizado = {
    entidad: Entidad;
    cardinalidad: Cardinalidad;
};

type ReglaRegistrable = { new (): ReglaCardinalidad } & typeof ReglaCardinalidad;

export abstract class ReglaCardinalidad {
    private static readonly _registradas: ReglaRegistrable[] = [];

    static puedeHacerseCargoDe(_relacion: Relacion): boolean {
        throw new Error("subclass responsibility");
    }

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

    protected normalizar(relacion: Relacion): { ladoUno: LadoNormalizado; ladoMuchos: LadoNormalizado } {
        const [, maxO] = relacion.cardinalidadOrigen();
        const [, maxD] = relacion.cardinalidadDestino();

        const origen: LadoNormalizado = { entidad: relacion.entidadOrigen(), cardinalidad: relacion.cardinalidadOrigen() };
        const destino: LadoNormalizado = { entidad: relacion.entidadDestino(), cardinalidad: relacion.cardinalidadDestino() };

        if (maxO === 'N' && maxD !== 'N')
            return { ladoUno: destino, ladoMuchos: origen };

        return { ladoUno: origen, ladoMuchos: destino };
    }
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

    private _relacionMRParaEntidad(entidad: Entidad, relacionesMR: RelacionMR[]): RelacionMR | undefined {
        return relacionesMR.find(r => r.nombre.toLowerCase() === entidad.nombre().toLowerCase());
    }
}

export class ReglaUnoAMuchosObligatorio extends ReglaCardinalidad {
    static puedeHacerseCargoDe(relacion: Relacion): boolean {
        const [minO, maxO] = relacion.cardinalidadOrigen();
        const [minD, maxD] = relacion.cardinalidadDestino();
        return (maxO === 'N' && minD === '1' && maxD === '1')
            || (minO === '1' && maxO === '1' && maxD === 'N');
    }

    validar(relacion: Relacion, relacionesMR: RelacionMR[], modeloER: ModeloER): string[] {
        const {ladoUno, ladoMuchos} = this.normalizar(relacion);

        const relacionUnoMR = relacionesMR.find(
            r => r.nombre.toLowerCase() === ladoUno.entidad.nombre().toLowerCase(),
        );

        const faltaAbsorberFK = this.pksCompletasDe(ladoMuchos.entidad, modeloER).some(
            pk => !relacionUnoMR?.clavesForáneas().some(fk =>
                this.fkMatcheaPK(fk.nombre, pk, ladoMuchos.entidad.nombre()),
            ),
        );

        if (faltaAbsorberFK) {
            return [[
                `Cardinalidad (1,1) a (${ladoMuchos.cardinalidad[0]},N): `,
                `Se debe absorber en '${ladoUno.entidad.nombre()}' la clave completa de `,
                `'${ladoMuchos.entidad.nombre()}' como FK.`,
            ].join('')];
        }

        return [];
    }
}

export class ReglaUnoAMuchosOpcional extends ReglaCardinalidad {
    static puedeHacerseCargoDe(relacion: Relacion): boolean {
        const [minO, maxO] = relacion.cardinalidadOrigen();
        const [minD, maxD] = relacion.cardinalidadDestino();
        return (maxO === 'N' && minD === '0' && maxD === '1')
            || (minO === '0' && maxO === '1' && maxD === 'N');
    }

    validar(relacion: Relacion, relacionesMR: RelacionMR[], modeloER: ModeloER): string[] {
        const {ladoUno, ladoMuchos} = this.normalizar(relacion);

        const tablaIntermedia = relacionesMR.find(
            r => r.nombre.toLowerCase() === relacion.nombre().toLowerCase(),
        );

        if (!tablaIntermedia) {
            return [[
                `Cardinalidad (0,1) a (${ladoMuchos.cardinalidad[0]},N): `,
                `Se debe crear la tabla intermedia '${relacion.nombre()}' `,
                `con la clave completa de '${ladoUno.entidad.nombre()}' como PK y FK `,
                `y la de '${ladoMuchos.entidad.nombre()}' como FK.`,
            ].join('')];
        }

        const errores: string[] = [];

        const faltaPKFK = this.pksCompletasDe(ladoUno.entidad, modeloER).some(
            pk => !tablaIntermedia.atributos.some(atr =>
                atr.esClavePrimaria() && atr.esForánea() &&
                this.fkMatcheaPK(atr.nombre, pk, ladoUno.entidad.nombre()),
            ),
        );
        if (faltaPKFK) {
            errores.push(
                `Cardinalidad (0,1) a (${ladoMuchos.cardinalidad[0]},N): ` +
                `La tabla '${tablaIntermedia.nombre}' debe tener la clave completa de ` +
                `'${ladoUno.entidad.nombre()}' como PK y FK.`,
            );
        }

        const faltaFK = this.pksCompletasDe(ladoMuchos.entidad, modeloER).some(
            pk => !tablaIntermedia.atributos.some(atr =>
                atr.esForánea() && !atr.esClavePrimaria() &&
                this.fkMatcheaPK(atr.nombre, pk, ladoMuchos.entidad.nombre()),
            ),
        );
        if (faltaFK) {
            errores.push(
                `Cardinalidad (0,1) a (${ladoMuchos.cardinalidad[0]},N): ` +
                `La tabla '${tablaIntermedia.nombre}' debe tener la clave completa de ` +
                `'${ladoMuchos.entidad.nombre()}' como FK.`,
            );
        }

        return errores;
    }
}

export class ReglaUnoAUnoAmbosObligatorios extends ReglaCardinalidad {
    static puedeHacerseCargoDe(relacion: Relacion): boolean {
        const [minO, maxO] = relacion.cardinalidadOrigen();
        const [minD, maxD] = relacion.cardinalidadDestino();
        return minO === '1' && maxO === '1' && minD === '1' && maxD === '1';
    }

    validar(relacion: Relacion, relacionesMR: RelacionMR[], modeloER: ModeloER): string[] {
        const entidadOrigen = relacion.entidadOrigen();
        const entidadDestino = relacion.entidadDestino();

        const relacionOrigenMR = relacionesMR.find(
            r => r.nombre.toLowerCase() === entidadOrigen.nombre().toLowerCase(),
        );
        const relacionDestinoMR = relacionesMR.find(
            r => r.nombre.toLowerCase() === entidadDestino.nombre().toLowerCase(),
        );
        if (!relacionOrigenMR || !relacionDestinoMR)
            return [];

        const pksOrigen = this.pksCompletasDe(entidadOrigen, modeloER);
        const pksDestino = this.pksCompletasDe(entidadDestino, modeloER);

        const origenAbsorbeDestino = pksDestino.every(
            pk => relacionOrigenMR.clavesForáneas().some(fk =>
                this.fkMatcheaPK(fk.nombre, pk, entidadDestino.nombre()),
            ),
        );

        const destinoAbsorbeOrigen = pksOrigen.every(
            pk => relacionDestinoMR.clavesForáneas().some(fk =>
                this.fkMatcheaPK(fk.nombre, pk, entidadOrigen.nombre()),
            ),
        );

        if (origenAbsorbeDestino || destinoAbsorbeOrigen)
            return [];

        return [`Cardinalidad (1,1) a (1,1): Se debe absorber en ` +
        `'${entidadOrigen.nombre()}' o '${entidadDestino.nombre()}' la clave completa de la otra como FK.`]
    }
}

export class ReglaUnoAUnoUnOpcional extends ReglaCardinalidad {
    static puedeHacerseCargoDe(relacion: Relacion): boolean {
        const [minO, maxO] = relacion.cardinalidadOrigen();
        const [minD, maxD] = relacion.cardinalidadDestino();
        return maxO === '1' && maxD === '1' && ((minO === '0' && minD === '1') || (minO === '1' && minD === '0'));
    }

    validar(relacion: Relacion, relacionesMR: RelacionMR[], modeloER: ModeloER): string[] {
        const entidadOrigen = relacion.entidadOrigen();
        const entidadDestino = relacion.entidadDestino();
        const [minO] = relacion.cardinalidadOrigen();

        const entidadObligatoria = minO === '1' ? entidadOrigen : entidadDestino;
        const entidadOpcional = minO === '0' ? entidadOrigen : entidadDestino;

        const relacionObligatoriaMR = relacionesMR.find(
            r => r.nombre.toLowerCase() === entidadObligatoria.nombre().toLowerCase(),
        );
        if (!relacionObligatoriaMR)
            return [];

        const pksOpcional = this.pksCompletasDe(entidadOpcional, modeloER);
        const faltaAbsorber = pksOpcional.some(
            pk => !relacionObligatoriaMR.clavesForáneas().some(fk =>
                this.fkMatcheaPK(fk.nombre, pk, entidadOpcional.nombre()),
            ),
        );

        if (faltaAbsorber) {
            return [`Cardinalidad (0,1) a (1,1): Se debe absorber en ` +
            `'${entidadObligatoria.nombre()}' la clave completa de ` +
            `'${entidadOpcional.nombre()}' como FK.`];
        }

        return [];
    }
}

export class ReglaUnoAUnoAmbosOpcionales extends ReglaCardinalidad {
    static puedeHacerseCargoDe(relacion: Relacion): boolean {
        const [minO, maxO] = relacion.cardinalidadOrigen();
        const [minD, maxD] = relacion.cardinalidadDestino();
        return minO === '0' && maxO === '1' && minD === '0' && maxD === '1';
    }

    validar(relacion: Relacion, relacionesMR: RelacionMR[], modeloER: ModeloER): string[] {
        const entidadOrigen = relacion.entidadOrigen();
        const entidadDestino = relacion.entidadDestino();

        const tablaIntermedia = relacionesMR.find(
            r => r.nombre.toLowerCase() === relacion.nombre().toLowerCase(),
        );

        if (!tablaIntermedia) {
            return [`Cardinalidad (0,1) a (0,1): Se debe crear la tabla intermedia ` +
            `'${relacion.nombre()}' con la clave completa de una entidad como PK y FK ` +
            `y la de la otra como FK.`];
        }

        const pksOrigen = this.pksCompletasDe(entidadOrigen, modeloER);
        const pksDestino = this.pksCompletasDe(entidadDestino, modeloER);

        const tienePKFKOrigen = pksOrigen.every(
            pk => tablaIntermedia.atributos.some(atr =>
                atr.esClavePrimaria() && atr.esForánea() &&
                this.fkMatcheaPK(atr.nombre, pk, entidadOrigen.nombre()),
            ),
        );
        const tienePKFKDestino = pksDestino.every(
            pk => tablaIntermedia.atributos.some(atr =>
                atr.esClavePrimaria() && atr.esForánea() &&
                this.fkMatcheaPK(atr.nombre, pk, entidadDestino.nombre()),
            ),
        );

        if ((tienePKFKOrigen && !tienePKFKDestino) || (!tienePKFKOrigen && tienePKFKDestino))
            return [];

        return [`Cardinalidad (0,1) a (0,1): La tabla ` +
        `'${tablaIntermedia.nombre}' debe tener la clave completa de una entidad ` +
        `como PK y FK y la de la otra como FK.`];
    }
}

ReglaCardinalidad.registrar(ReglaEntidadDebil);
ReglaCardinalidad.registrar(ReglaMuchosAMuchos);
ReglaCardinalidad.registrar(ReglaUnoAMuchosObligatorio);
ReglaCardinalidad.registrar(ReglaUnoAMuchosOpcional);
ReglaCardinalidad.registrar(ReglaUnoAUnoAmbosObligatorios);
ReglaCardinalidad.registrar(ReglaUnoAUnoUnOpcional);
ReglaCardinalidad.registrar(ReglaUnoAUnoAmbosOpcionales);