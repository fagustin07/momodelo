export {};

declare global {
    interface Array<T> {
        isEmpty(): boolean;
    }

    interface MapConstructor {
        groupBy<T, K>(items: Iterable<T>, keySelector: (item: T, index: number) => K): Map<K, T[]>;
    }
}

if (!Array.prototype.isEmpty) {
    Array.prototype.isEmpty = function <T>(this: T[]): boolean {
        return this.length === 0;
    };
}

if (!(Map as any).groupBy) {
    (Map as any).groupBy = function <T, K>(items: Iterable<T>, keySelector: (item: T) => K): Map<K, T[]> {
        const grupos = new Map<K, T[]>();
        for (const item of items) {
            const k = keySelector(item);
            if (!grupos.has(k)) grupos.set(k, []);
            grupos.get(k)!.push(item);
        }
        return grupos;
    };
}