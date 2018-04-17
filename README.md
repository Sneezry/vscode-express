# vscode-express

Create an HTTP server in VS Code for user interface of VS Code extension.

## Get Started

### Install

```
npm install vscode-express --save
```

### Import and Initialize

```typescript
import * as vscode from 'vscode';
import {VSCExpress} from 'vscode-express';

export function activate(context: vscode.ExtensionContext) {
    // initial vscode express
    const vscexpress = new VSCExpress(context, 'view');
    // register command
    context.subscriptions.push(vscode.commands.registerCommand('extension.vscexpress', () => {
        vscexpress.open('index.html', 'VS Code Express Example', vscode.ViewColumn.One);
    }));

    // rest code...
}
```

### In Web

Insert script below in your web page:

```javascript
function command(cmd, callback) {
  if (!cmd) {
    return;
  }
  let args = Array.from(arguments);
  if (typeof args[args.length - 1] === 'function') {
    callback = args[args.length - 1];
    args.length = args.length - 1;
  } else {
    callback = undefined;
  }
  const data = encodeURIComponent(JSON.stringify(args));
  const url = `/command?data=${data}`;

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        if (callback) {
          callback(JSON.parse(xhr.responseText));
        }
      } else {
        if (callback) {
          callback(null);
        }
      }
    }
  }
  xhr.open('GET', url, true);
  xhr.send();
}
```

And call VS Code command with `command` function. Such as:

```javascript
command('extension.sayHello');
```

You can also do something after the command executed with callback:

```javascript
command('extension.sayHello', function(res) {
    // res.code === 0 with success,
    // res.message is error message if error occurred
    // do something
});
```

If you need pass parameter to the command, send it with `command`:

```javascript
command('extension.command', 'arg1', 'arg2', callback);
```

## Example

<https://github.com/Sneezry/vscode-express-example>

## License

MIT License