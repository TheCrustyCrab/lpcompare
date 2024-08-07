import { useEffect, useState } from "react";
import SimplexFile from "./SimplexFile.tsx";
import lpcompareInit, { MainModule } from "./lpcompare/lpcompare";
import lpcompareUrl from "./lpcompare/lpcompare.wasm?url";
import SimplexTable, { Direction, SimplexTableCalculationRequestEvent } from "./SimplexTable.tsx";

enum Mode {
    Table = 0,
    LP = 1,
    MPS = 2
}

enum Solver {
    Highs = "0",
    Lpsolve = "1"
}

interface CalculationResult {
    executionTimeMillis: number,
    isOptimal: boolean,
    weights: number[],
    objectiveValue: number
}

export default function LpSolver() {
    const [lpcompare, setLpcompare] = useState<MainModule | null>(null);
    const [mode, setMode] = useState(Mode.Table);
    const [solver, setSolver] = useState(Solver.Highs);
    const [logEnabled, setLogEnabled] = useState(true);
    const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

    useEffect(() => {
        const loadLpcompareLib = async () => {
            setLpcompare(await lpcompareInit({
                print: console.log,
                printErr: console.error,
                locateFile: () => lpcompareUrl
            }));
        };

        loadLpcompareLib();
    }, []);

    const handleTableCalculateRequest = async (event: SimplexTableCalculationRequestEvent) => {
        const direction = event.direction === Direction.Min ? "min" : "max";
        const objective = 
            event.varCosts.map((nullableCost, i) => {
                const cost = nullableCost || 0;
                return `${cost >= 0 ? "+" : "-"}${cost}x${i}`;
            }).join(" ");
        const rows = event.rows.map((row) => {
            const lb = row[0];
            const ub = row[row.length-1];
            const matrix = row.slice(1, -1).map((nullableValue, i) => {
                const value = nullableValue || 0;
                return `${value >= 0 ? "+" : "-"}${value}x${i}`;
            }).join(" ");
            return `${lb === null ? "" : lb + "<="}${matrix}${ub === null ? "" : "<=" + ub}`;
        });
        let lp = `${direction}: ${objective};`;
        rows.forEach((row) => lp = `${lp}\n${row};`);
        const inputFile = `input.lp`;
        lpcompare!.FS.writeFile(inputFile, lp);
        lpcompare!.callMain([solver, inputFile, logEnabled ? "1" : "0" ]);
        const resultData = lpcompare!.FS.readFile("result.json", { encoding: "utf8" });
        const result = JSON.parse(resultData) as CalculationResult;
        setCalculationResult(result);
    };

    const handleFileCalculateRequest = (fileExt: string, data: string) => {
        const inputFile = `input.${fileExt}`;
        lpcompare!.FS.writeFile(inputFile, data);
        lpcompare!.callMain([solver, inputFile, logEnabled ? "1" : "0" ]);
        const resultData = lpcompare!.FS.readFile("result.json", { encoding: "utf8" });
        const result = JSON.parse(resultData) as CalculationResult;
        setCalculationResult(result);
    };

    if (!lpcompare) {
        return null;
    }

    return (
        <>
            <div>
                <span>Solver:</span>
                <select onChange={event => setSolver(event.target.value as Solver)} value={solver}>
                    <option value={Solver.Highs}>HiGHS 1.7.2</option>
                    <option value={Solver.Lpsolve}>lpsolve 5.5.2.0</option>
                </select>
            </div>
            <div>
                <input type="radio" id="table" checked={mode === Mode.Table} onChange={() => setMode(Mode.Table)} />
                <label htmlFor="table">Table</label>
                <input type="radio" id="lp"  checked={mode === Mode.LP} onChange={() => setMode(Mode.LP)} />
                <label htmlFor="lp">LP</label>
                <input type="radio" id="mps"  checked={mode === Mode.MPS} onChange={() => setMode(Mode.MPS)} />
                <label htmlFor="mps">MPS</label>
            </div>
            <div>
                <input type="checkbox" id="log" checked={logEnabled} onChange={(evt) => setLogEnabled(evt.target.checked)} />
                <label htmlFor="log">Enable log</label>
            </div>
            {
                mode === Mode.Table
                    ? <SimplexTable onCalculateRequest={handleTableCalculateRequest}></SimplexTable>
                    : <SimplexFile format={mode === Mode.LP ? "lp" : "mps"} onCalculateRequest={(data) => handleFileCalculateRequest(mode === Mode.LP ? "lp" : "mps", data)}></SimplexFile>
            }
            {
                calculationResult !== null 
                    ? 
                    <>
                        <h2>Found {!calculationResult.isOptimal ? "non-" : ""}optimal solution in {calculationResult.executionTimeMillis}ms:</h2>
                        <span style={{outline: "3pt solid lightgreen", outlineOffset: "5pt"}}>{`${calculationResult.weights.map((weight, i) => `x${i}: ${weight}`).join(", ")}, P: ${calculationResult.objectiveValue}`}</span>
                    </>
                    : null
            }
        </>
    )
}