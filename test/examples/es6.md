```javascript --hide
runmd.onRequire = path => path == 'bar' ? './foo' : path;
```

```javascript --run
import aModule from 'bar';
import {foo} from 'bar';
import {foo as bar} from 'bar';
const fooRes = foo; // RESULT
const barRes = bar; // RESULT
```
