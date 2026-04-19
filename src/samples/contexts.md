```javascript --run
runmd.importMap = { foobar: './foo.ts' }; // `runmd.*` (setup block) should reset context
```

```javascript --run
import { bar as foo } from 'foobar'; // 'import' should reset context
typeof foo; // RESULT
```

```javascript --run
// no import or export? continue from previous script
typeof foo; // RESULT
```

```javascript --run
import { bar } from 'foobar'; // 'import' should reset context

// should be undefined
typeof foo; // RESULT
typeof bar; // RESULT
```

```javascript --hide
runmd.importMap = { foobar: './foo.ts' }; // `runmd.*` (setup block) should reset context
```

```javascript --run
// should be undefined
typeof foo; // RESULT
typeof bar; // RESULT
```
