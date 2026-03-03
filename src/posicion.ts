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

    round(): Posicion {
        return this.map(Math.round);
    }

    map(f: (componente: number) => number) {
        return coordenada(
            f(this.x), f(this.y)
        );
    }
}

export function coordenada(x: number, y: number) {
    return new Posicion(x, y);
}

export function coordenadaInicial() {
    return new Posicion(0,0);
}

export function puntoMedio(p0: Posicion, p1: Posicion): Posicion {
    return coordenada((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
}