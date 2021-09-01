# TypedStorage

A simple and lightweight Storage API wrapper for providing it meaningful types. Customizable and battery-packed.

## Installation

```shell
npm install @never-rare/typed-storage
```

TypedStorage is an npm package, use of module bundler such as [rollup.js] or [webpack] is recommended.

[rollup.js]: https://rollupjs.org/
[webpack]: https://webpack.js.org

## Initialization

When initializing `TypedStorage`, it needs a record of converters. The library provides few predefined converters, which have rather detailed name.

TypedStorage is generic, you can define the structure of the storage, but it is optional, TypeScript seems really good at inferring these.

```ts
import {
    TypedStorage,
    stringConverter,
    enumConverterFactory,
    isoDateConverter,
    intConverter,
} from "@never-rare/typed-storage";

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

## Storage access

TypedStorage is pretty similar to Storage, it have `setItem`, `getItem`, and `removeItem` methods. One key difference is that TypedStorage allows you to use any kind of values with these methods in type-safe way.

TypedStorage have `hasItem` which checks whether that field exist and if it is parseable. It also have `setDefaults`, which is a shortcut for `hasItem` and `setItem`. It sets every unset field to a default value.

```ts
// continuing from previous snippet

storage.setDefaults({
    username: "player",
    theme: "dark",
    last_played: new Date(),
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

With converters, TypedStorage allows you to control how values are parsed and stringified. Other than predefined converters, you can use your own converter. For example, we could create a converter for boolean, but stored as `"0"` or `"1"` to save some storage quota.

This is what `booleanConverter` actually does, we will make it again just for this example.

```ts
import { TypedStorage, Converter } from "@never-rare/typed-storage";

const booleanConverter: Converter<boolean> = {
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
const storage = new TypedStorage(localStorage, {
    music: booleanConverter,
    // ...
});
```

## Multiple instances

Making multiple instances for each categories is recommended. With this setup, using prefix is also recommended. This prefix the key when values are stored, you can still use methods as if there's no prefix at all.

```ts
import {
    TypedStorage,
    enumConverterFactory,
    booleanConverter,
    intConverter,
} from "@never-rare/typed-storage";

const preferencesStorage = new TypedStorage(
    localStorage,
    "preferences_",
    {
        theme: enumConverterFactory(["light", "dark", "black"]),
        sfx: booleanConverter,
        music: booleanConverter,
    },
);
const highscoreStorage = new TypedStorage(
    localStorage,
    "highscore_",
    {
        easy: intConverter,
        medium: intConverter,
        hard: intConverter,
    },
);
```

Notice we wrote `preferences_` instead of `preferences`. TypedStorage doesn't automatically add separator to prefixes.
