```javascript --hide
runmd.onRequire = path => path == 'bar' ? './foo' : path;
```

```javascript --run
const aModule = require('bar');
const res = aModule.foo; // RESULT
```
