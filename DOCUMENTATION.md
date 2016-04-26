## Documentation

You can see below the API reference of this module.

### `GitStats(dataPath)`

#### Params
- **String** `dataPath`: Path to the data file.

#### Return
- **GitStats** The `GitStats` instance.

### `getConfig(callback)`
Fetches the configuration object from file (`~/.git-stats-config.js`).

#### Params
- **Function** `callback`: The callback function.

#### Return
- **Object|Undefined** If no callback is provided, the configuration object will be returned.

### `initConfig(input, callback)`
Inits the configuration field (`this.config`).

#### Params
- **Object|String** `input`: The path to a custom git-stats configuration file or the configuration object.
- **Function** `callback`: The callback function.

### `record(data, callback)`
Records a new commit.

#### Params
- **Object** `data`: The commit data containing:
 - `date` (String|Date): The date object or a string in a format that can be parsed.
 - `url` (String): The repository remote url.
 - `hash` (String): The commit hash.
 - `_data` (Object): If this field is provided, it should be the content of the git-stats data file as object. It will be modified in-memory and then returned.
 - `save` (Boolean): If `false`, the result will *not* be saved in the file.
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` instance.

### `record(data, callback)`
removeCommit
Deletes a specifc commit from the history.

#### Params
- **Object** `data`: The commit data containing:
 - `date` (String|Date): The date object or a string in a format that can be parsed. If not provided, the hash object will be searched in all dates.
 - `hash` (String): The commit hash.
 - `_data` (Object): If this field is provided, it should be the content of the git-stats data file as object. It will be modified in-memory and then returned.
 - `save` (Boolean): If `false`, the result will *not* be saved in the file.
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` instance.

### `get(callback)`
Gets the git stats.

#### Params
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` instance.

### `save(stats, callback)`
Saves the provided stats.

#### Params
- **Object** `stats`: The stats to be saved.
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` instance.

### `iterateDays(data, callback)`
Iterate through the days, calling the callback function on each day.

#### Params
- **Object** `data`: An object containing the following fields:
 - `start` (Moment): A `Moment` date object representing the start date (default: *an year ago*).
 - `end` (Moment): A `Moment` date object representing the end date (default: *now*).
 - `format` (String): The format of the date (default: `"MMM D, YYYY"`).
- **Function** `callback`: The callback function called with the current day formatted (type: string) and the `Moment` date object.

#### Return
- **GitStats** The `GitStats` instance.

### `graph(data, callback)`
Creates an object with the stats on the provided period (default: *last year*).

#### Params
- **Object** `data`: The object passed to the `iterateDays` method.
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` instance.

### `calendar(data, callback)`
Creates the calendar data for the provided period (default: *last year*).

#### Params
- **Object** `data`: The object passed to the `graph` method.
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` instance.

### `ansiCalendar(options, callback)`
Creates the ANSI contributions calendar.

#### Params
- **Object** `options`: The object passed to the `calendar` method.
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` instance.

### `authors(options, callback)`
Creates an array with the authors of a git repository.

#### Params
- **String|Object** `options`: The repo path or an object containing the following fields:
 - `repo` (String): The repository path.
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` instance.

### `authorsPie(options, callback)`
Creates the authors pie.

#### Params
- **String|Object** `options`: The repo path or an object containing the following fields:
 - `repo` (String): The repository path.
 - `radius` (Number): The pie radius.
 - `no_ansi` (Boolean): If `true`, the pie will not contain ansi characters.
 - `raw` (Boolean): If `true`, the raw JSON will be displayed.
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` instance.

### `globalActivity(options, callback)`
Creates the global contributions calendar (all commits made by all committers).

#### Params
- **String|Object** `options`: The repo path or an object containing the following fields:
 - `repo` (String): The repository path.
 - `start` (String): The start date.
 - `end` (String): The end date.
 - `theme` (String|Object): The calendar theme.
 - `raw` (Boolean): If `true`, the raw JSON will be displayed.
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` instance.

