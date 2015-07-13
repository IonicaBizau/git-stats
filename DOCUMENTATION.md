## Documentation
You can see below the API reference of this module.

### `GitStats(dataPath)`

#### Params
- **String** `dataPath`: Path to the data file.

#### Return
- **GitStats** The `GitStats` instance.

### `record(data, callback)`
Records a new commit.

#### Params
- **Object** `data`: The commit data containing:
 - `date` (String|Date): The date object or a string in a format that can be parsed.
 - `url` (String): The repository remote url.
 - `hash` (String): The commit hash.
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

### `ansiCalendar(data, callback)`
Creates the ANSI contributions calendar.

#### Params
- **Object** `data`: The object passed to the `calendar` method.
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
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` instance.

