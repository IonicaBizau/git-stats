## Migration

This document contains information about how to smoothly
migrate the things from a version to another version.


### `1.x.x` to `2.x.x`

The big change is the the data schema -- which should be migrated.

The old `~/.git-stats` format was:

```json
{
   "<date>": {
      "<remote-url>": {
          "<hash>": "<date>"
      }
   }
}
```

In the new version, the remote url is not mandatory anymore. The new format is:

```json
{
    "commits": {
        "<date>": {
            "<hash>": 1
        }
    }
}
```

This is supposed to change when users install the `2.x.x` versions. However, if
the migration script fails, you can always run it manually:

```sh
./scripts/migration/2.0.0.js
```

This will modify the `~/.git-stats` file.

When using `git-stats` as library, things changed too. The old way was:

```js
var GitStats = require("git-stats");

GitStats.ansiCalendar(opts, fn);
```

In `2.x.x` GitStats is a constructor. That allows us to create as many `git-stats`
instances we want.

```js
var GitStats = require("git-stats");

// Provide a custom data path
var gs1 = new GitStats("path/to/some/data.json");

// Use the default (~/.git-stats)
var gs2 = new GitStats();
```
