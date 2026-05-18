export {};

declare global {
    interface Array<T> {
        isEmpty(): boolean;
    }
}

if (!Array.prototype.isEmpty) {
    Array.prototype.isEmpty = function <T>(this: T[]): boolean {
        return this.length === 0;
    };
}