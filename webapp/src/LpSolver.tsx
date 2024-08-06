import { useEffect, useState } from "react";
import SimplexMPS, { SimplexMPSCalculationRequestEvent } from "./SimplexMPS.tsx";
import lpcompareInit, { MainModule } from "./lpcompare/lpcompare";
import lpcompareUrl from "./lpcompare/lpcompare.wasm?url";

enum Mode {
    Table = 0,
    MPS = 1
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

    const handleMPSCalculateRequest = async (event: SimplexMPSCalculationRequestEvent) => {
        lpcompare!.FS.writeFile("input.mps", event.data);
        lpcompare!.callMain([solver, "input.mps"]);
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
                <input type="radio" id="mps"  checked={mode === Mode.MPS} onChange={() => setMode(Mode.MPS)} />
                <label htmlFor="mps">MPS</label>
            </div>
            {
                    <SimplexMPS onCalculateRequest={handleMPSCalculateRequest}></SimplexMPS>
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