export interface Converter<Value> {
    parse: (value: string) => null | Value;
    stringify: (value: Value) => string;
}
export type Converters<Body extends object> = {
    [Key in keyof Body]: Converter<Body[Key]>;
};
const takenKeys = new Map<Storage, Set<string>>();
function getTakenKey(storage: Storage): Set<string> {
    if (takenKeys.has(storage)) return takenKeys.get(storage)!;
    const set = new Set<string>();
    takenKeys.set(storage, set);
    return set;
}
function getStorageName(storage: Storage): string {
    switch (storage) {
        case localStorage: return "localStorage";
        case sessionStorage: return "sessionStorage";
        default: return "<unknown Storage>";
    }
}
export class TypedStorage<Body extends object> {
    constructor(private storage: Storage, private converters: Converters<Body>) {
        const takenField = getTakenKey(storage);
        for (const key of Object.keys(converters)) {
            if (takenField.has(key)) throw new Error(`the key "${key}" from ${getStorageName(storage)} is already taken.`);
            takenField.add(key);
        }
    }
    getItem<Key extends string & keyof Body>(key: Key): null | Body[Key] {
        const item = this.storage.getItem(key);
        if (item == null) return null;
        return this.converters[key].parse(item);
    }
    hasItem(key: string & keyof Body): boolean {
        return this.getItem(key) != null;
    }
    setItem<Key extends string & keyof Body>(key: Key, value: Body[Key]): void {
        this.storage.setItem(key, this.converters[key].stringify(value));
    }
    removeItem(key: string & keyof Body): void {
        this.storage.removeItem(key);
    }
    setDefaults(body: Body): void {
        for (const key of Object.keys(body) as (string & keyof Body)[]) {
            if (!this.hasItem(key)) {
                this.setItem(key, body[key]);
            }
        }
    }
}
export const stringConverter: Converter<string> = {
    parse: value => value,
    stringify: value => value,
};
export function enumConverterFactory<Enum extends string>(enumTuple: Enum[]): Converter<Enum> {
    return {
        parse: value => {
            if ((enumTuple as string[]).includes(value)) return value as Enum;
            return null;
        },
        stringify: value => "" + value,
    };
}
export const intConverter: Converter<number> = {
    parse: value => {
        const num = Number.parseInt(value, 10);
        if (Number.isNaN(num)) return null;
        return num;
    },
    stringify: value => value.toString(),
};
export const floatConverter: Converter<number> = {
    parse: value => {
        const num = Number.parseFloat(value);
        if (Number.isNaN(num)) return null;
        return num;
    },
    stringify: value => value.toString(),
};
export const isoDateConverter: Converter<Date> = {
    parse: value => {
        const date = new Date(value);
        if (Number.isNaN(+ date)) return null;
        return date;
    },
    stringify: value => value.toISOString(),
};