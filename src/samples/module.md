```javascript --hide
runmd.importMap = { foobar: './foo.ts' };
```

```javascript --run
import { bar } from 'foobar';
const res = bar; // RESULT
```
