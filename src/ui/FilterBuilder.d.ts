import type { FieldDef, FilterJSON } from "../domain";
import { type OperatorSupport } from "../domain";
type Props = {
    fields: ReadonlyArray<FieldDef>;
    operatorSupport: OperatorSupport;
    initial: FilterJSON;
    onChange?: (json: FilterJSON, qs: string) => void;
    useSymbolOpsInOutput?: boolean;
    queryKey?: string;
    endpoint?: string;
};
export default function FilterBuilder({ fields, operatorSupport, initial, onChange, useSymbolOpsInOutput, queryKey, endpoint, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=FilterBuilder.d.ts.map