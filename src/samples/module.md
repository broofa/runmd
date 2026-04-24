```javascript --hide
runmd.importMap = { imports: { foobar: './foo.ts' } };
```

```javascript --run
import { bar } from 'foobar';
const res = bar; // RESULT
```
