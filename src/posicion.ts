export class Posicion {
    constructor(
        public readonly x: number,
        public readonly y: number
    ) {}

    desplazamientoHacia(otraPosicion: Posicion) {
        return otraPosicion.minus(this);
    }

    plus(otraPosicion: Posicion) {
        return coordenada(
            otraPosicion.x + this.x,
            otraPosicion.y + this.y,
        );
    }

    minus(otraPosicion: Posicion) {
        return coordenada(
            this.x - otraPosicion.x,
            this.y - otraPosicion.y,
        );
    }
}

export function coordenada(x: number, y: number) {
    return new Posicion(x, y);
}
