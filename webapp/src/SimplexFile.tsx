import { useState } from "react";
import { SAMPLE_LP, SAMPLE_MPS } from "./samples";

type Format = "lp" | "mps";

interface SimplexFileProps {
    format: Format,
    onCalculateRequest: (data: string) => void
}

export default function SimplexFile({ format, onCalculateRequest }: SimplexFileProps) {
    const [data, setData] = useState("");

    const loadSampleFile = () => {
        if (format === "lp") {
            setData(SAMPLE_LP);
        } else if (format === "mps") {
            setData(SAMPLE_MPS);
        }
    };

    const handleCalculateClick = () => {
        onCalculateRequest(data);
    };

    return (
        <>
            <div>
                <textarea className="file-input" value={data} onChange={(evt) => setData(evt.target.value)}></textarea>
            </div>
            <button onClick={loadSampleFile}>Load sample</button>
            <button style={{ backgroundColor: "lightgreen" }} onClick={handleCalculateClick}>Calculate</button>
        </>
    )
}