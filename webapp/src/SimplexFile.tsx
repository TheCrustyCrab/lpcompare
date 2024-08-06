import { useState } from "react";

export default function SimplexFile({ onCalculateRequest }: { onCalculateRequest: (data: string) => void }) {
    const [data, setData] = useState("");

    const handleCalculateClick = () => {
        onCalculateRequest(data);
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