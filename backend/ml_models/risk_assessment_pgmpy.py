from pgmpy.models import DiscreteBayesianNetwork
from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination

class RiskAssessmentBayesianNetwork:
    def __init__(self):
        # Define the structure of the Bayesian Network with students_count as Student Count variable
        self.model = DiscreteBayesianNetwork([
            ('Student Count', 'Performance'),
            ('Student Count', 'Hours per Week'),
            ('Student Count', 'Teacher Satisfaction'),
            ('Student Count', 'Student Satisfaction'),
            ('Performance', 'Risk Level'),
            ('Hours per Week', 'Risk Level'),
            ('Teacher Satisfaction', 'Risk Level'),
            ('Student Satisfaction', 'Risk Level')
        ])

        # Define CPDs (Conditional Probability Distributions)

        cpd_student_count = TabularCPD(variable='Student Count', variable_card=3,
                                      values=[[0.3], [0.4], [0.3]],
                                      state_names={'Student Count': ['Low', 'Medium', 'High']})

        cpd_performance = TabularCPD(variable='Performance', variable_card=3,
                                    values=[
                                        [0.7, 0.6, 0.5],
                                        [0.2, 0.3, 0.3],
                                        [0.1, 0.1, 0.2]
                                    ],
                                    evidence=['Student Count'],
                                    evidence_card=[3],
                                    state_names={'Performance': ['High', 'Medium', 'Low'],
                                                 'Student Count': ['Low', 'Medium', 'High']})

        cpd_hours = TabularCPD(variable='Hours per Week', variable_card=3,
                               values=[
                                   [0.6, 0.5, 0.4],
                                   [0.3, 0.3, 0.4],
                                   [0.1, 0.2, 0.2]
                               ],
                               evidence=['Student Count'],
                               evidence_card=[3],
                               state_names={'Hours per Week': ['High', 'Medium', 'Low'],
                                            'Student Count': ['Low', 'Medium', 'High']})

        cpd_teacher_satisfaction = TabularCPD(variable='Teacher Satisfaction', variable_card=3,
                                              values=[
                                                  [0.7, 0.6, 0.5],
                                                  [0.2, 0.3, 0.3],
                                                  [0.1, 0.1, 0.2]
                                              ],
                                              evidence=['Student Count'],
                                              evidence_card=[3],
                                              state_names={'Teacher Satisfaction': ['High', 'Medium', 'Low'],
                                                           'Student Count': ['Low', 'Medium', 'High']})

        cpd_student_satisfaction = TabularCPD(variable='Student Satisfaction', variable_card=3,
                                              values=[
                                                  [0.7, 0.6, 0.5],
                                                  [0.2, 0.3, 0.3],
                                                  [0.1, 0.1, 0.2]
                                              ],
                                              evidence=['Student Count'],
                                              evidence_card=[3],
                                              state_names={'Student Satisfaction': ['High', 'Medium', 'Low'],
                                                           'Student Count': ['Low', 'Medium', 'High']})

        # CPD for Risk Level with shape (3, 81) = 3 states for Risk Level and 3*3*3*3=81 combinations of evidence states
        cpd_risk_level = TabularCPD(variable='Risk Level', variable_card=3,
                                    values=[
                                        [0.8]*81,
                                        [0.15]*81,
                                        [0.05]*81
                                    ],
                                    evidence=['Performance', 'Hours per Week', 'Teacher Satisfaction', 'Student Satisfaction'],
                                    evidence_card=[3, 3, 3, 3],
                                    state_names={'Risk Level': ['High', 'Medium', 'Low'],
                                                 'Performance': ['High', 'Medium', 'Low'],
                                                 'Hours per Week': ['High', 'Medium', 'Low'],
                                                 'Teacher Satisfaction': ['High', 'Medium', 'Low'],
                                                 'Student Satisfaction': ['High', 'Medium', 'Low']})

        self.model.add_cpds(cpd_student_count, cpd_performance, cpd_hours, cpd_teacher_satisfaction, cpd_student_satisfaction, cpd_risk_level)

        # Check model correctness
        self.model.check_model()

        # Prepare inference engine
        self.infer = VariableElimination(self.model)

    def predict_risk(self, evidence):
        """
        Predict risk level distribution given evidence.
        Evidence keys: 'Student Count', 'Performance', 'Hours per Week', 'Teacher Satisfaction', 'Student Satisfaction'
        Values should be states like 'Low', 'Medium', 'High' for Student Count and 'High'/'Medium'/'Low' for others.
        """
        query_result = self.infer.query(variables=['Risk Level'], evidence=evidence)
        return query_result.values

if __name__ == "__main__":
    network = RiskAssessmentBayesianNetwork()
    evidence = {
        "Student Count": "High",
        "Performance": "High",
        "Hours per Week": "Low",
        "Teacher Satisfaction": "High",
        "Student Satisfaction": "Medium",
    }
    risk_dist = network.predict_risk(evidence)
    print("Predicted Risk Level Distribution:", risk_dist)
