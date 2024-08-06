import { useState } from "react";

export interface SimplexMPSCalculationRequestEvent {
    data: string
}

export default function SimplexMPS({ onCalculateRequest }: { onCalculateRequest: (evt: SimplexMPSCalculationRequestEvent) => void }) {
    const [data, setData] = useState("");

    const handleCalculateClick = () => {
        const event = {
            data
        };
        onCalculateRequest(event);
    };

    return (
        <>
            <div>
                <textarea value={data} onChange={(evt) => setData(evt.target.value)}></textarea>
            </div>
            <button style={{ backgroundColor: "lightgreen" }} onClick={handleCalculateClick}>Calculate</button>
        </>
    )
}