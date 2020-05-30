/** A Storage value converter (parser and stringifier) for TypedStorage */
export interface Converter<Value> {
    parse: (value: string) => null | Value;
    stringify: (value: Value) => string;
}
/** A record of Converter for TypedStorage */
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
/**
 * A Storage API wrapper that allows storing any type of value in type-safe way and with simple key prefixing.
 *
 * Throws a "key is already taken" Error when some key is already taken from previously defined TypedStorage instance.
 */
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
    /** Returns the current value associated with the given key, or null if the given key does not exist in the list associated with the object or if the value is not parseable by a Converter. */
    getItem<Key extends string & keyof Body>(key: Key): null | Body[Key] {
        const item = this.storage.getItem(this.prefix + key);
        if (item == null) return null;
        return this.converters[key].parse(item);
    }
    /** Returns a boolean indicating whether the given key have associated value and the value is parseable by the Converter. This is similar to `this.getItem(key) != null` */
    hasItem(key: string & keyof Body): boolean {
        return this.getItem(key) != null;
    }
    /**
     * Sets the value of the pair identified by key to value, creating a new key/value pair if none existed for key previously.
     *
     * Throws a "QuotaExceededError" DOMException exception if the new value couldn't be set. (Setting could fail if, e.g., the user has disabled storage for the site, or if the quota has been exceeded.)
     */
    setItem<Key extends string & keyof Body>(key: Key, value: Body[Key]): void {
        this.storage.setItem(
            this.prefix + key,
            this.converters[key].stringify(value),
        );
    }
    /** Removes the key/value pair with the given key from the list associated with the object, if a key/value pair with the given key exists. */
    removeItem(key: string & keyof Body): void {
        this.storage.removeItem(this.prefix + key);
    }
    /** Sets every unset value to a value given by the parameter */
    setDefaults(body: Body): void {
        for (const key of Object.keys(body) as (string & keyof Body)[]) {
            if (!this.hasItem(key)) this.setItem(key, body[key]);
        }
    }
}
/** A boolean Converter for TypedStorage. Stored as "0" or "1". */
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
/** A string Converter for TypedStorage. */
export const stringConverter: Converter<string> = {
    parse: value => value,
    stringify: value => value,
};
/**
 * A union of string Converter factory for TypedStorage.
 *
 * Usage Note: The parameter should exhaust all string from type parameter Enum. Letting TypeScript infer for Enum is recommended.
 */
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
/** An integer Converter for TypedStorage. */
export const intConverter: Converter<number> = {
    parse: value => {
        const num = Number.parseInt(value, 10);
        if (Number.isNaN(num)) return null;
        return num;
    },
    stringify: value => value.toString(),
};
/** A float (regular JS number) Converter for TypedStorage. */
export const floatConverter: Converter<number> = {
    parse: value => {
        const num = Number.parseFloat(value);
        if (Number.isNaN(num)) return null;
        return num;
    },
    stringify: value => value.toString(),
};
/** A Date Converter for TypedStorage, stored as ISO string. */
export const isoDateConverter: Converter<Date> = {
    parse: value => {
        const date = new Date(value);
        if (Number.isNaN(+date)) return null;
        return date;
    },
    stringify: value => value.toISOString(),
};
