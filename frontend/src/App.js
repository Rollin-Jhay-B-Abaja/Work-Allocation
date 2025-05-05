import React, { useState } from "react";
import './styles/unifiedStyles.css';
import AppRoutes from "./routes";
import PredictionChart from "./pages/TeachersRetentionPrediction/PredictionChart";

function App() {
    const [predictionData, setPredictionData] = useState(null);

    const handlePredict = (data) => {
        setPredictionData(data);
    };

    return (
        <div className="App">
            <AppRoutes onPredict={handlePredict} />
            {predictionData && <PredictionChart data={predictionData} />}
        </div>
    );
}

export default App;
