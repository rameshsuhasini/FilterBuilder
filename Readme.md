**# Filter Builder (Frontend Take-Home)**



A reusable, \*\*dataset-agnostic\*\* React + TypeScript Filter Builder that lets users construct nested \*\*AND/OR\*\* conditions and serialize them to the exact target JSON format.



\## Target JSON Format



```json

{

&nbsp; "and": \[

&nbsp;   { "field": "age", "operator": "gt", "value": 30 },

&nbsp;   {

&nbsp;     "or": \[

&nbsp;       { "field": "role", "operator": "eq", "value": "admin" },

&nbsp;       { "field": "isActive", "operator": "=", "value": true }

&nbsp;     ]

&nbsp;   }

&nbsp; ]

}



Symbol operators like "=" are supported on input and optional on output.



**Features**



1- Add/Edit/Remove conditions and nested groups (unlimited depth).



2\. Type-aware inputs: string, number, boolean, date.



3\. Validation rules:



&nbsp;	 between → exactly two values \[a, b]



&nbsp;  	in / not\_in → array of values



&nbsp;  	is\_null / is\_not\_null → no value



4\. Configurable schema and operator support per type.



5\. Serialization to/from the exact JSON format.



6- API integration:



&nbsp;  	 GET: URL-safe query string (filter=<encoded>).

&nbsp;	

&nbsp;	POST: JSON body (optional wrapper key).



7.Import/Export: paste/load JSON in the demo; copy current JSON.



8\. Accessible, keyboard-navigable UI.



**Getting Started**



npm install

npm run dev



Open the printed local URL (usually http://localhost:5173).



**Project Structure (minimum)**





src/

&nbsp; App.tsx

&nbsp; main.tsx

&nbsp; domain.ts

&nbsp; validation.ts

&nbsp; serializer.ts

&nbsp; transport.ts

&nbsp; actions.ts

&nbsp; ui/

&nbsp;   FilterBuilder.tsx

&nbsp; styles.css

index.html

tsconfig.json

vite.config.mts





**Library API (core types)**



**// src/domain.ts**

**export type FieldType = 'string' | 'number' | 'boolean' | 'date';**



**export interface FieldDef {**

  **name: string;  // dataset key**

  **label: string; // UI label**

  **type: FieldType;**

**}**



**export type OperatorKey =**

  **| 'eq' | 'neq'**

  **| 'gt' | 'lt'**

  **| 'between'**

  **| 'before' | 'after'**

  **| 'contains' | 'starts\_with' | 'ends\_with'**

  **| 'in' | 'not\_in'**

  **| 'is\_null' | 'is\_not\_null';**



**export type OperatorSupport = Readonly<Record<FieldType, ReadonlyArray<OperatorKey>>>;**



**export const DEFAULT\_OPERATOR\_SUPPORT: OperatorSupport = {**

  **string:  \['eq','neq','contains','starts\_with','ends\_with'],**

  **number:  \['eq','neq','gt','lt','between'],**

  **boolean: \['eq','neq'],**

  **date:    \['eq','neq','before','after','between'],**

**};**





**React Component**





// src/ui/FilterBuilder.tsx

<FilterBuilder

&nbsp; fields={fields}

&nbsp; operatorSupport={DEFAULT\_OPERATOR\_SUPPORT}

&nbsp; initial={{ and: \[] }}

&nbsp; onChange={(json, qs) => { /\* receive exact JSON + ?filter=... \*/ }}

&nbsp; useSymbolOpsInOutput={false}

&nbsp; queryKey="filter"

&nbsp; endpoint="/search"

/>





**Props**



* fields: FieldDef\[] — schema.
* operatorSupport: map of allowed operators per type.
* initial: FilterJSON — { and:\[…] } or { or:\[…] }.
* onChange(json, qs): emits the required JSON and key=value query string on each change.
* useSymbolOpsInOutput: if true, emits "=","!="," >", "<" where applicable.
* queryKey: GET parameter name (default filter).
* endpoint: used only for the GET preview text.



**Serialization and Validation**



**// src/serializer.ts**

**fromJSON(raw, fields)  // normalize: symbols → keys, ISO → Date**

**toJSON(tree, fields, { useSymbolOps }) // exact shape; omit value for null-arity**



**// src/validation.ts**

**validateFilter(filter, fields, operatorSupport) // { ok, issues\[] }**







**Transport (POST/GET)**



**// src/transport.ts**

**buildGetRequest(endpoint, filter, { fields, queryKey })**

**buildPostRequest(endpoint, filter, { fields, bodyKey })**

**toQueryString(filter, { key, fields })**





**Testing** 



**npm run test**



Included tests for:



* Validation arity/type rules
* Serializer date/alias handling
* Transport GET/POST building
* Actions (add/remove/toggle/update) on the exact JSON model





**Example Datasets**



Two example schemas are provided in App.tsx:



Users: name, age, isActive, joined



Products: title, price, inStock, released



Use the dataset switcher to try both















