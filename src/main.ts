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
        case localStorage:
            return "localStorage";
        case sessionStorage:
            return "sessionStorage";
        default:
            return "<unknown Storage>";
    }
}
export class TypedStorage<Body extends object> {
    private prefix: string;
    private converters: Converters<Body>;

    constructor(storage: Storage, converters: Converters<Body>);
    constructor(storage: Storage, prefix: string, converters: Converters<Body>);
    constructor(
        private storage: Storage,
        prefix: string | Converters<Body>,
        converters?: Converters<Body>,
    ) {
        if (typeof prefix !== "string") {
            [prefix, converters] = ["", prefix];
        }
        if (!converters) {
            throw new TypeError(
                "converters not defined (this should be unreachable)",
            );
        }
        this.prefix = prefix;
        this.converters = converters;
        const takenField = getTakenKey(storage);
        for (const key of Object.keys(converters)) {
            const storeKey = this.prefix + key;
            if (takenField.has(storeKey))
                throw new Error(
                    `the key "${storeKey}" from ${getStorageName(
                        storage,
                    )} is already taken.`,
                );
            takenField.add(storeKey);
        }
    }
    getItem<Key extends string & keyof Body>(key: Key): null | Body[Key] {
        const item = this.storage.getItem(this.prefix + key);
        if (item == null) return null;
        return this.converters[key].parse(item);
    }
    hasItem(key: string & keyof Body): boolean {
        return this.getItem(key) != null;
    }
    setItem<Key extends string & keyof Body>(key: Key, value: Body[Key]): void {
        this.storage.setItem(
            this.prefix + key,
            this.converters[key].stringify(value),
        );
    }
    removeItem(key: string & keyof Body): void {
        this.storage.removeItem(this.prefix + key);
    }
    setDefaults(body: Body): void {
        for (const key of Object.keys(body) as (string & keyof Body)[]) {
            if (!this.hasItem(key)) this.setItem(key, body[key]);
        }
    }
}
export const booleanConverter: Converter<boolean> = {
    parse: value => {
        switch (value) {
            case "0":
                return false;
            case "1":
                return true;
            default:
                return null;
        }
    },
    stringify: value => {
        switch (value) {
            case false:
                return "0";
            case true:
                return "1";
        }
    },
};
export const stringConverter: Converter<string> = {
    parse: value => value,
    stringify: value => value,
};
export function enumConverterFactory<Enum extends string>(
    enumTuple: Enum[],
): Converter<Enum> {
    return {
        parse: value => {
            if ((enumTuple as string[]).includes(value)) return value as Enum;
            return null;
        },
        stringify: value => value,
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
        if (Number.isNaN(+date)) return null;
        return date;
    },
    stringify: value => value.toISOString(),
};
