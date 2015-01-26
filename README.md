# git-stats
A GitHub-like contributions calendar, but locally, with all your git commits.

## Installation

```sh
$ npm install -g git-stats
```

## Documentation
## `record(data, callback)`
Records a new commit.

### Params
- **Object** `data`: The commit data containing:
 - `date` (String|Date): The date object or a string in this format: `DDD MMM dd HH:mm:ss YYYY`
 - `url` (String): The repository remote url.
 - `hash` (String): The commit hash.

- **Function** `callback`: The callback function.

## `get(data, callback)`
Gets the git stats.

### Params
- **Object** `data`: The stats filter. **Not yet implemented**.
- **Function** `callback`: The callback function.

## How to contribute

1. File an issue in the repository, using the bug tracker, describing the
   contribution you'd like to make. This will help us to get you started on the
   right foot.
2. Fork the project in your account and create a new branch:
   `your-great-feature`.
3. Commit your changes in that branch.
4. Open a pull request, and reference the initial issue in the pull request
   message.

## License
See the [LICENSE](./LICENSE) file.
