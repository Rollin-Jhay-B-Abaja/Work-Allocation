import React, { useState } from "react";
import AppRoutes from "./routes";
import PredictionChart from "./pages/StudentEnrollmentPrediction/PredictionChart";

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
