import { ChangeEvent, useState } from "react";

export enum Direction {
    Min = 0,
    Max = 1
}

export interface SimplexTableCalculationRequestEvent {
    direction: Direction,
    rows: (number | null)[][],
    varCosts: (number | null)[]
}

export default function SimplexTable({onCalculateRequest}: {onCalculateRequest: (evt: SimplexTableCalculationRequestEvent) => void}) {
    const [varCount, setvarCount] = useState(1);
    const [rows, setRows] = useState<(number | null)[][]>([[null, null, null]]);
    const [varCosts, setVarCosts] = useState<(number | null)[]>([null]);
    const [direction, setDirection] = useState(Direction.Min);

    const handleAddVarClick = () => {
        setvarCount(current => current + 1);
        // resize rows
        const newRows = [
            ...rows.map(row => [row[0], ...row.slice(1, row.length - 1), null, row[row.length - 1]])
        ];
        setRows(newRows);
        setVarCosts([...varCosts, null]);
    };

    const handleDeleteVarClick = () => {
        setvarCount(current => current - 1);
        // resize rows
        const newRows = [
            ...rows.map(row => [...row.slice(0, row.length - 2), row[row.length - 1]])
        ];
        setRows(newRows);
        setVarCosts(varCosts.slice(0, varCosts.length - 1));
    };

    const handleAddRowClick = () => {
        const newRows = [
            ...rows, Array(varCount + 2).fill(null)
        ];
        setRows(newRows);
    };

    const handleDeleteRowClick = () => {
        const newRows = rows.slice(0, rows.length - 1);
        setRows(newRows);
    };

    const handleInputChange = (rowIndex: number, colIndex: number, event: ChangeEvent<HTMLInputElement>) => {
        const newRows = [
            ...rows.map(row => row.slice())
        ];
        newRows[rowIndex][colIndex] = !event.target.value ? null : parseFloat(event.target.value);
        setRows(newRows);
    };

    const handleObjectiveInputChange = (varIndex: number, event: ChangeEvent<HTMLInputElement>) => {
        const newVarCosts = varCosts.slice();
        newVarCosts[varIndex] = !event.target.value ? null : parseFloat(event.target.value);
        setVarCosts(newVarCosts);
    };

    const handleCalculateClick = () => {
        const event = {
            direction,
            rows,
            varCosts
        };
        onCalculateRequest(event);
    };

    const emptyIfNull = (value: any) => {
        return value === null ? "" : value;
    }

    return (
        <>
            <table>
                <thead>
                    <tr>
                        <th>Lower bound {`<=`}</th>
                        {
                            [...Array(varCount)].map((_x, i) => 
                                <td key={i}>
                                    x{i}
                                    {
                                        i === varCount - 1 
                                            ? <>
                                                <button onClick={handleAddVarClick}>+</button>
                                                { varCount > 1 ? <button onClick={handleDeleteVarClick}>-</button> : null }
                                            </>
                                            : null
                                    }
                                </td>
                            )
                        }
                        <th>{`<=`} Upper bound</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        rows.map((row, rowIndex) => 
                            <tr key={rowIndex}>
                                {
                                    row.map((_col, colIndex) => 
                                        <td key={colIndex}><input onChange={event => handleInputChange(rowIndex, colIndex, event)} value={`${emptyIfNull(rows[rowIndex][colIndex])}`}></input></td>
                                    )
                                }
                            </tr>
                        )
                    }
                    <tr style={{outline: "1pt dashed green", outlineOffset: "-1pt"}}>
                        <td>
                            Objective:
                            <select onChange={event => setDirection(parseInt(event.target.value))}>
                                <option value={Direction.Min}>Min</option>
                                <option value={Direction.Max}>Max</option>
                            </select>
                        </td>
                        {
                            varCosts.map((varCost, i) => 
                                <td key={i}>
                                    <input onChange={event => handleObjectiveInputChange(i, event)} value={`${emptyIfNull(varCost)}`}></input>
                                </td>
                            )
                        }
                        <td></td>
                    </tr>
                </tbody>
            </table>
            <div>
                <button onClick={handleAddRowClick}>Add row +</button>
                {
                    rows.length > 1 ? <button onClick={handleDeleteRowClick}>Delete row -</button> : null
                }
            </div>
            <button style={{backgroundColor: "lightgreen"}} onClick={handleCalculateClick}>Calculate</button>
        </>
    );
}