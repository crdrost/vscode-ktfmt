# ktfmt

This is a VS Code extension for running [ktfmt] as a Kotlin formatter.

It does not contain `ktfmt`. You should [download a recent version of
ktfmt][ktfmt-dl] to some path in your home directory, then tell this extension
where to look via the `ktfmt.path-to-jar` setting. Once that is done you need to
set it as your default formatter for kotlin files by adding to your
`settings.json` file,

```json
{
  "ktfmt.path-to-jar": "/Users/crdrost/.local/lib/ktfmt-0.25-jar-with-dependencies.jar",
  "[kotlin]": {
    "editor.defaultFormatter": "crdrost.ktfmt"
  }
}
```

Note that `vscode-ktfmt` also needs to know about your Java configuration
because `ktfmt` wants to run as `java -jar /path/to/ktfmt-all-dependencies.jar`,
and this extension assumes that you have installed the [Java Language
Support][redhat] extension, which configures an array of these runtimes at
`java.configuration.runtimes`. If you have not done that yet you may need to add
that to your `settings.json`, something like say

```json
{
  "java.configuration.runtimes": [
    {
      "name": "AdoptOpenJDK-15",
      "path": "/Library/Java/JavaVirtualMachines/adoptopenjdk-15.jdk/Contents/Home",
      "default": true
    }
  ]
}
```

If you do not want to use the `default` one to run `ktfmt` for whatever reason,
copy the `name` property into `ktfmt.java-runtime` and this extension will use
that `path` instead.

## Configuration

You can pass additional options array to kfmt by setting `ktfmt.options`.

For example, to use Official kotlin style:

```json
{
  "ktfmt.options": ["--kotlinlang-style"]
}
```

## Known Issues

Nothing right now.

## Release Notes

### 1.0.1

Better readme/setup docs.

### 1.0.0

Initial release

[ktfmt-dl]: https://search.maven.org/search?q=g:com.facebook%20AND%20a:ktfmt
[ktfmt]: https://github.com/facebookincubator/ktfmt
[redhat]: https://marketplace.visualstudio.com/items?itemName=redhat.java
