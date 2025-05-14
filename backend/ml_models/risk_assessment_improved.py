import mysql.connector
from mysql.connector import Error
from pgmpy.models import DiscreteBayesianNetwork
from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination
import json

class ImprovedRiskAssessmentBayesianNetwork:
    def __init__(self):
        # Define a more comprehensive Bayesian Network structure including more variables
        self.model = DiscreteBayesianNetwork([
            ('Performance', 'Risk Level'),
            ('Hours per Week', 'Risk Level'),
            ('Teacher Satisfaction', 'Risk Level'),
            ('Student Satisfaction', 'Risk Level'),
            ('Teachers Count', 'Risk Level'),
            ('Students Count', 'Risk Level'),
            ('Salary Ratio', 'Risk Level'),
            ('Professional Dev Hours', 'Risk Level'),
            ('Historical Resignations', 'Risk Level'),
            ('Historical Retentions', 'Risk Level'),
            ('Workload Per Teacher', 'Risk Level')
        ])

        # Define CPDs for each variable (simplified example, should be refined with real data)
        cpd_performance = TabularCPD(variable='Performance', variable_card=3,
                                    values=[[0.7], [0.2], [0.1]],
                                    state_names={'Performance': ['High', 'Medium', 'Low']})

        cpd_hours = TabularCPD(variable='Hours per Week', variable_card=3,
                               values=[[0.6], [0.3], [0.1]],
                               state_names={'Hours per Week': ['Low', 'Medium', 'High']})

        cpd_teacher_satisfaction = TabularCPD(variable='Teacher Satisfaction', variable_card=3,
                                              values=[[0.7], [0.2], [0.1]],
                                              state_names={'Teacher Satisfaction': ['High', 'Medium', 'Low']})

        cpd_student_satisfaction = TabularCPD(variable='Student Satisfaction', variable_card=3,
                                              values=[[0.7], [0.2], [0.1]],
                                              state_names={'Student Satisfaction': ['High', 'Medium', 'Low']})

        cpd_teachers_count = TabularCPD(variable='Teachers Count', variable_card=3,
                                       values=[[0.6], [0.3], [0.1]],
                                       state_names={'Teachers Count': ['Low', 'Medium', 'High']})

        cpd_students_count = TabularCPD(variable='Students Count', variable_card=3,
                                       values=[[0.6], [0.3], [0.1]],
                                       state_names={'Students Count': ['Low', 'Medium', 'High']})

        cpd_salary_ratio = TabularCPD(variable='Salary Ratio', variable_card=3,
                                     values=[[0.7], [0.2], [0.1]],
                                     state_names={'Salary Ratio': ['High', 'Medium', 'Low']})

        cpd_prof_dev_hours = TabularCPD(variable='Professional Dev Hours', variable_card=3,
                                       values=[[0.7], [0.2], [0.1]],
                                       state_names={'Professional Dev Hours': ['High', 'Medium', 'Low']})

        cpd_hist_resignations = TabularCPD(variable='Historical Resignations', variable_card=3,
                                          values=[[0.1], [0.3], [0.6]],
                                          state_names={'Historical Resignations': ['Low', 'Medium', 'High']})

        cpd_hist_retentions = TabularCPD(variable='Historical Retentions', variable_card=3,
                                        values=[[0.6], [0.3], [0.1]],
                                        state_names={'Historical Retentions': ['High', 'Medium', 'Low']})

        cpd_workload_per_teacher = TabularCPD(variable='Workload Per Teacher', variable_card=3,
                                             values=[[0.6], [0.3], [0.1]],
                                             state_names={'Workload Per Teacher': ['Low', 'Medium', 'High']})

        # CPD for Risk Level with all parent variables (simplified uniform distribution for example)
        cpd_risk_level = TabularCPD(variable='Risk Level', variable_card=3,
                                    values=[[0.33]*177147, [0.33]*177147, [0.34]*177147],
                                    evidence=['Performance', 'Hours per Week', 'Teacher Satisfaction', 'Student Satisfaction',
                                              'Teachers Count', 'Students Count', 'Salary Ratio', 'Professional Dev Hours',
                                              'Historical Resignations', 'Historical Retentions', 'Workload Per Teacher'],
                                    evidence_card=[3]*11,
                                    state_names={'Risk Level': ['High', 'Medium', 'Low'],
                                                 'Performance': ['High', 'Medium', 'Low'],
                                                 'Hours per Week': ['Low', 'Medium', 'High'],
                                                 'Teacher Satisfaction': ['High', 'Medium', 'Low'],
                                                 'Student Satisfaction': ['High', 'Medium', 'Low'],
                                                 'Teachers Count': ['Low', 'Medium', 'High'],
                                                 'Students Count': ['Low', 'Medium', 'High'],
                                                 'Salary Ratio': ['High', 'Medium', 'Low'],
                                                 'Professional Dev Hours': ['High', 'Medium', 'Low'],
                                                 'Historical Resignations': ['Low', 'Medium', 'High'],
                                                 'Historical Retentions': ['High', 'Medium', 'Low'],
                                                 'Workload Per Teacher': ['Low', 'Medium', 'High']})

        self.model.add_cpds(cpd_performance, cpd_hours, cpd_teacher_satisfaction, cpd_student_satisfaction,
                            cpd_teachers_count, cpd_students_count, cpd_salary_ratio, cpd_prof_dev_hours,
                            cpd_hist_resignations, cpd_hist_retentions, cpd_workload_per_teacher, cpd_risk_level)

        self.model.check_model()
        self.infer = VariableElimination(self.model)

    def predict_risk(self, evidence):
        query_result = self.infer.query(variables=['Risk Level'], evidence=evidence)
        return query_result.values

def map_to_evidence(row):
    def categorize(value, thresholds, labels):
        for i, threshold in enumerate(thresholds):
            if value <= threshold:
                return labels[i]
        return labels[-1]

    evidence = {}
    evidence['Performance'] = categorize(row.get('performance', 0), [70, 85], ['Low', 'Medium', 'High'])
    evidence['Hours per Week'] = categorize(row.get('hours_per_week', 0), [1.5, 3], ['Low', 'Medium', 'High'])
    evidence['Teacher Satisfaction'] = categorize(row.get('teacher_satisfaction', 0), [0.6, 0.8], ['Low', 'Medium', 'High'])
    evidence['Student Satisfaction'] = categorize(row.get('student_satisfaction', 0), [0.6, 0.8], ['Low', 'Medium', 'High'])
    evidence['Teachers Count'] = categorize(row.get('teachers_count', 0), [1, 2], ['Low', 'Medium', 'High'])
    evidence['Students Count'] = categorize(row.get('students_count', 0), [300, 600], ['Low', 'Medium', 'High'])
    evidence['Salary Ratio'] = categorize(row.get('salary_ratio', 0), [1.0, 1.05], ['Low', 'Medium', 'High'])
    evidence['Professional Dev Hours'] = categorize(row.get('professional_dev_hours', 0), [10, 20], ['Low', 'Medium', 'High'])
    evidence['Historical Resignations'] = categorize(row.get('historical_resignations', 0), [3, 6], ['Low', 'Medium', 'High'])
    evidence['Historical Retentions'] = categorize(row.get('historical_retentions', 0), [3, 6], ['High', 'Medium', 'Low'])
    evidence['Workload Per Teacher'] = categorize(row.get('workload_per_teacher', 0), [10, 20], ['Low', 'Medium', 'High'])
    return evidence

def main():
    config = {
        'host': 'localhost',
        'database': 'workforce',
        'user': 'root',
        'password': 'Omamam@010101'
    }
    try:
        connection = mysql.connector.connect(**config)
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT * FROM risk_assessment")
            rows = cursor.fetchall()
            network = ImprovedRiskAssessmentBayesianNetwork()
            strand_risk_predictions = {}
            strand_counts = {}
            for row in rows:
                evidence = map_to_evidence(row)
                risk_dist = network.predict_risk(evidence)
                risk_list = risk_dist.tolist() if hasattr(risk_dist, 'tolist') else list(risk_dist)
                strand = row['strand']
                if strand not in strand_risk_predictions:
                    strand_risk_predictions[strand] = [0.0, 0.0, 0.0]
                    strand_counts[strand] = 0
                strand_risk_predictions[strand] = [
                    strand_risk_predictions[strand][i] + risk_list[i] for i in range(3)
                ]
                strand_counts[strand] += 1
            for strand in strand_risk_predictions:
                count = strand_counts[strand]
                strand_risk_predictions[strand] = [
                    val / count for val in strand_risk_predictions[strand]
                ]
            for strand in strand_risk_predictions:
                if hasattr(strand_risk_predictions[strand], 'tolist'):
                    strand_risk_predictions[strand] = strand_risk_predictions[strand].tolist()
                else:
                    strand_risk_predictions[strand] = list(strand_risk_predictions[strand])
            print(json.dumps(strand_risk_predictions, separators=(',', ':')))
    except Error as e:
        print(f"Error connecting to database: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    main()
