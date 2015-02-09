# git-stats
A GitHub-like contributions calendar, but locally, with all your git commits.

## Installation

```sh
$ npm install -g git-stats
```

### Catching the `git commit` command
Would you like to catch store automatically the commits when you do `git commit`?

If so, put the following lines in your `~/.bashrc` (or `~/.bash_profile` on OS X) file:

```sh
# Override the Git command
git() {
  cmd=$1
  shift
  extra=""

  quoted_args=""
  whitespace="[[:space:]]"
  for i in "$@"
  do
      quoted_args="$quoted_args \"$i\""
  done

  cmdToRun="`which git` "$cmd" $quoted_args"
  cmdToRun=`echo $cmdToRun | sed -e 's/^ *//' -e 's/ *$//'`
  bash -c "$cmdToRun"
  if [ $? -eq 0 ]; then
    # Commit stats
    if [ "$cmd" == "commit" ]; then
      commit_hash=`git rev-parse HEAD`
      repo_url=`git config --get remote.origin.url`
      commit_date=`git log -1 --format=%cd`
      commit_data="\"{ \"date\": \"$commit_date\", \"url\": \"$repo_url\", \"hash\": \"$commit_hash\" }\""
      git-stats --record "$commit_data"
    fi
  fi
}
```

## Usage

## Documentation
If you want to use this as module, this is possible. See the content below.

### `record(data, callback)`
Records a new commit.

#### Params
- **Object** `data`: The commit data containing:
 - `date` (String|Date): The date object or a string in this format: `DDD MMM dd HH:mm:ss YYYY`
 - `url` (String): The repository remote url.
 - `hash` (String): The commit hash.

- **Function** `callback`: The callback function.

### `get(data, callback)`
Gets the git stats.

#### Params
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
