import numpy as np
from pomegranate import BayesianNetwork as PomegranateBayesianNetwork, DiscreteDistribution, ConditionalProbabilityTable, State

class RiskAssessmentBayesianNetwork:
    def __init__(self):
        # Define distributions for variables
        # Example variables: STEM enrollment increase, teacher availability, workload, satisfaction, risk level

        # STEM enrollment increase: Yes or No
        self.stem_enrollment = DiscreteDistribution({'Yes': 0.3, 'No': 0.7})

        # Teacher availability depends on STEM enrollment
        self.teacher_availability = ConditionalProbabilityTable(
            [
                ['Yes', 'High', 0.4],
                ['Yes', 'Low', 0.6],
                ['No', 'High', 0.8],
                ['No', 'Low', 0.2],
            ],
            [self.stem_enrollment]
        )

        # Workload depends on teacher availability
        self.workload = ConditionalProbabilityTable(
            [
                ['High', 'High', 0.7],
                ['High', 'Medium', 0.2],
                ['High', 'Low', 0.1],
                ['Low', 'High', 0.1],
                ['Low', 'Medium', 0.3],
                ['Low', 'Low', 0.6],
            ],
            [self.teacher_availability]
        )

        # Satisfaction depends on workload
        self.satisfaction = ConditionalProbabilityTable(
            [
                ['High', 'High', 0.1],
                ['High', 'Medium', 0.3],
                ['High', 'Low', 0.6],
                ['Medium', 'High', 0.3],
                ['Medium', 'Medium', 0.5],
                ['Medium', 'Low', 0.2],
                ['Low', 'High', 0.7],
                ['Low', 'Medium', 0.2],
                ['Low', 'Low', 0.1],
            ],
            [self.workload]
        )

        # Risk level depends on workload and satisfaction
        self.risk_level = ConditionalProbabilityTable(
            [
                ['High', 'High', 'High', 0.8],
                ['High', 'High', 'Medium', 0.15],
                ['High', 'High', 'Low', 0.05],
                ['High', 'Medium', 'High', 0.6],
                ['High', 'Medium', 'Medium', 0.3],
                ['High', 'Medium', 'Low', 0.1],
                ['High', 'Low', 'High', 0.4],
                ['High', 'Low', 'Medium', 0.4],
                ['High', 'Low', 'Low', 0.2],
                ['Medium', 'High', 'High', 0.5],
                ['Medium', 'High', 'Medium', 0.4],
                ['Medium', 'High', 'Low', 0.1],
                ['Medium', 'Medium', 'High', 0.3],
                ['Medium', 'Medium', 'Medium', 0.5],
                ['Medium', 'Medium', 'Low', 0.2],
                ['Medium', 'Low', 'High', 0.2],
                ['Medium', 'Low', 'Medium', 0.5],
                ['Medium', 'Low', 'Low', 0.3],
                ['Low', 'High', 'High', 0.1],
                ['Low', 'High', 'Medium', 0.3],
                ['Low', 'High', 'Low', 0.6],
                ['Low', 'Medium', 'High', 0.05],
                ['Low', 'Medium', 'Medium', 0.25],
                ['Low', 'Medium', 'Low', 0.7],
                ['Low', 'Low', 'High', 0.01],
                ['Low', 'Low', 'Medium', 0.09],
                ['Low', 'Low', 'Low', 0.9],
            ],
            [self.workload, self.satisfaction]
        )

        # Create states
        s_stem_enrollment = State(self.stem_enrollment, name="STEM Enrollment Increase")
        s_teacher_availability = State(self.teacher_availability, name="Teacher Availability")
        s_workload = State(self.workload, name="Workload")
        s_satisfaction = State(self.satisfaction, name="Satisfaction")
        s_risk_level = State(self.risk_level, name="Risk Level")

        # Build Bayesian Network
        self.model = PomegranateBayesianNetwork("Risk Assessment Network")
        self.model.add_states(s_stem_enrollment, s_teacher_availability, s_workload, s_satisfaction, s_risk_level)

        # Add edges
        self.model.add_edge(s_stem_enrollment, s_teacher_availability)
        self.model.add_edge(s_teacher_availability, s_workload)
        self.model.add_edge(s_workload, s_satisfaction)
        self.model.add_edge(s_workload, s_risk_level)
        self.model.add_edge(s_satisfaction, s_risk_level)

        self.model.bake()

    def predict_risk(self, evidence):
        """
        Predict risk level given evidence.
        Evidence is a dict with keys: 'STEM Enrollment Increase', 'Teacher Availability', 'Workload', 'Satisfaction'
        Values should be states like 'Yes'/'No', 'High'/'Low', etc.
        """
        beliefs = self.model.predict_proba(evidence)
        risk_dist = beliefs[-1]  # Risk Level distribution
        if isinstance(risk_dist, DiscreteDistribution):
            return risk_dist.parameters[0]
        else:
            return {}

if __name__ == "__main__":
    # Example usage
    network = RiskAssessmentBayesianNetwork()
    evidence = {
        "STEM Enrollment Increase": "Yes",
        "Teacher Availability": "Low",
        "Workload": "High",
        "Satisfaction": "Low",
    }
    risk = network.predict_risk(evidence)
    print("Predicted Risk Level Distribution:", risk)
