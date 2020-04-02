# TypedStorage

A simple and lightweight Storage API wrapper for providing it meaningful types by converting strings from original Storage to usuable JavaScript values and vice versa in type-safe way. It works with both LocalStorage and SessionStorage.

## Installation

```shell
npm install @never-rare/typed-storage
```

TypedStorage is an npm package, use of module bundler such as Rollup.JS or WebPack is recommended.

## Initialization

TypedStorage is a generic class. You need to define a type or interface to define the structure of the storage. The type parameter is optional but it should be filled, although, TypeScript seems really good at inferring these.

Due to type deletion, explicitly defining converters is required, but luckily for us, the library also provides few predefined converters.

```ts
import {TypedStorage, stringConverter, enumConverterFactory, isoDateConverter, intConverter} from "@never-rare/typed-storage";

interface StorageBody {
    username: string;
    theme: "dark" | "light";
    last_played: Date;
    highscore: number;
}
const storage = new TypedStorage<StorageBody>(localStorage, {
    username: stringConverter,
    theme: enumConverterFactory(["dark", "light"]),
    last_played: isoDateConverter,
    highscore: intConverter,
});

// continuing to next snippet
```

## Accessing

TypedStorage is pretty similar to Storage, it have `setItem`, `getItem`, and `removeItem` methods. One key difference is that TypedStorage allows you to use any kind of values with these methods in type-safe way.

TypedStorage have `hasItem` which checks whether that field exist and if it is parseable. It also have `setDefaults`, which is a shortcut for `hasItem` and `setItem`. It sets every unset field to a default value.

```ts
// continuing from previous snippet

storage.setDefaults({
    username: "player",
    theme: "dark",
    last_played: new Date,
    highscore: 0,
});
export function setName(newName: string): void {
    storage.setItem("username", newName);
}
export function toggleTheme(): void {
    const currentTheme = storage.getItem("theme") ?? "light";
    if (currentTheme === "light") {
        storage.setItem("theme", "dark");
    } else {
        storage.setItem("theme", "light");
    }
}
```

## Custom Converters

With converters, TypedStorage allows you to have fine grain control on how values are parsed and stringified. Other than predefined converters, you can set your own converter. For example, we could create a converter for boolean value, but stored as `"0"` or `"1"` to save some storage quota.

```ts
import {TypedStorage} from "./main";

interface StorageBody {
    is_dark: boolean;
}
const storage = new TypedStorage<StorageBody>(localStorage, {
    is_dark: {
        parse: value => {
            switch (value) {
                case "0": return false;
                case "1": return true;
                default: return null;
            }
        },
        stringify: value => {
            switch (value) {
                case false: return "0";
                case true: return "1";
            }
        }
    },
});
```

These converter should never throw any error. The `parse` function can return `null` instead. In `stringify` function, there's really no way to invalidate value, since it is already handled via type checking. However, there's some cases where runtime check is needed, for example, `last_played` should never be set to earlier date, but that can be handled before calling `setItem`.

```ts
import {TypedStorage, isoDateConverter} from "@never-rare/typed-storage";

interface StorageBody {
    last_played: Date;
    // ...
}
const storage = new TypedStorage<StorageBody>(localStorage, {
    last_played: isoDateConverter,
    // ...
});
function setLastPlayed(date: Date): void {
    if (+date > +storage.getItem("last_played")) {
        storage.setItem("last_played", date);
    } else {
        throw new Error(/* ... */);
    }
}
```

## Multiple Instance

Upon making multiple instances of TypedStorage, overlapping fields can happen, these are handled and manifested as runtime errors.
