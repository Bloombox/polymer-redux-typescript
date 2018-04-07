

## polymer-redux-typescript

- step 1: install dependency
> npm install --save polymer-redux-typescript

or

> yarn add polymer-redux-typescript

- step 2: use node module resolution in tsconfig.json
```json
{
    "compilerOptions":{
        "moduleResolution": "node"
    }
}
```


- step 3: import where you need
```typescript
import {element, polymer} from 'polymer-redux-typescript'

// ... later (after setting up ReduxMixin)...

@element("sample-element")
class SampleElement extends ReduxMixin(Polymer.Element) {
  // .. your element ..
  @property({statePath: 'some.state.path'})
  prop?: string
}
```

