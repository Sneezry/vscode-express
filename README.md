# vscode-express

Use webview in VS Code for user interface of VS Code extension.

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
    // 'view' is the ABSOLUTE root path of the web view in the extension
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
const callbackStack = [];
const vscode = acquireVsCodeApi();

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
  args.shift();
  const messageId = new Date().getTime() + Math.random();
  
  callbackStack.push({
    messageId,
    callback
  });

  vscode.postMessage({
    messageId,
    command: cmd,
    parameter: args
  });
}

window.addEventListener('message', event => {
  const message = event.data;

  for (let index = 0; index < callbackStack.length; index++) {
    const callbackItem = callbackStack[index];
    if (callbackItem.messageId === message.messageId) {
      if (callbackItem.callback) {
        callbackItem.callback(message.payload);
      }
      callbackStack.splice(index, 1);
      break;
    }
  }
});
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

### `location` Object Access for Web

Generally, you can pass some initial data with `location.search` or `location.hash` to JavaScript in web. The VS Code webview doesn't support `search` or `hash` as it uses file system to open the file you request. As a workaround, you can use a built-in variable of VSCExpress, `_location` to accesee `location.search`, `location.hash` and `location.href`.

Thus, you need to change your origin code a bit:

```javascript
const href = _location ? _location.href : location.href;
```

> Note: Different from `location`, `_location` has only `search`, `hash` and `href` property.

### CORS and Open Links in Browser

Unfortunately, VS Code webview doesn't support CORS. However, it's not hard to make a workaround by using message passing. You can register the action to fetch remote content (with `request` module or something else) as a VS Code command, and call the action with `command` function mentioned above in the web.

```typescript
vscode.commands.registerCommand('myExtension.httpRequest', async (uri: string) => {
  return await request(uri);
});
```

Open links in browser is similar:

```typescript
vscode.commands.registerCommand('myExtension.openUri', (uri: string) => {
  vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(uri));
});
```

## Example

<https://github.com/Sneezry/vscode-express-example>

## Build from Source

```
git clone https://github.com/Sneezry/vscode-express.git
cd vscode express
```

And you need add `prepare` script in `package.json` for `npm install`:

```
  ...
  "fix": "gts fix",
  "prepare": "node ./node_modules/vscode/bin/install"
}
```

Then run `npm install`

```
npm install
npm run compile
```

To run the example, compile the code first, then open the example folder with VS Code:

```
code example
```

In VS Code, press `F5` to start debug.

## License

MIT License
