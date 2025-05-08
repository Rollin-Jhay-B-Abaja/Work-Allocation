import pprint
import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from teacher_retention import predict_teacher_retention

def main():
    # Full dataset converted from user provided table
    sample_data = [
        {'year': '2016', 'strand_id': 2, 'teachers_count': 7, 'students_count': 280, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.02, 'professional_dev_hours': 18, 'historical_resignations': 4, 'historical_retentions': 12, 'workload_per_teacher': 33},
        {'year': '2016', 'strand_id': 3, 'teachers_count': 4, 'students_count': 160, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.02, 'professional_dev_hours': 18, 'historical_resignations': 4, 'historical_retentions': 12, 'workload_per_teacher': 33},
        {'year': '2016', 'strand_id': 4, 'teachers_count': 6, 'students_count': 240, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.02, 'professional_dev_hours': 18, 'historical_resignations': 4, 'historical_retentions': 12, 'workload_per_teacher': 33},
        {'year': '2016', 'strand_id': 5, 'teachers_count': 5, 'students_count': 200, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.02, 'professional_dev_hours': 18, 'historical_resignations': 4, 'historical_retentions': 12, 'workload_per_teacher': 33},
        {'year': '2016', 'strand_id': 1, 'teachers_count': 8, 'students_count': 320, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.02, 'professional_dev_hours': 18, 'historical_resignations': 4, 'historical_retentions': 12, 'workload_per_teacher': 33},
        {'year': '2017', 'strand_id': 2, 'teachers_count': 8, 'students_count': 320, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.03, 'professional_dev_hours': 19, 'historical_resignations': 3, 'historical_retentions': 13, 'workload_per_teacher': 34},
        {'year': '2017', 'strand_id': 3, 'teachers_count': 5, 'students_count': 200, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.03, 'professional_dev_hours': 19, 'historical_resignations': 3, 'historical_retentions': 13, 'workload_per_teacher': 34},
        {'year': '2017', 'strand_id': 4, 'teachers_count': 7, 'students_count': 280, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.03, 'professional_dev_hours': 19, 'historical_resignations': 3, 'historical_retentions': 13, 'workload_per_teacher': 34},
        {'year': '2017', 'strand_id': 5, 'teachers_count': 6, 'students_count': 240, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.03, 'professional_dev_hours': 19, 'historical_resignations': 3, 'historical_retentions': 13, 'workload_per_teacher': 34},
        {'year': '2017', 'strand_id': 1, 'teachers_count': 9, 'students_count': 360, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.03, 'professional_dev_hours': 19, 'historical_resignations': 3, 'historical_retentions': 13, 'workload_per_teacher': 34},
        {'year': '2018', 'strand_id': 2, 'teachers_count': 9, 'students_count': 360, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.04, 'professional_dev_hours': 20, 'historical_resignations': 2, 'historical_retentions': 14, 'workload_per_teacher': 35},
        {'year': '2018', 'strand_id': 3, 'teachers_count': 6, 'students_count': 240, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.04, 'professional_dev_hours': 20, 'historical_resignations': 2, 'historical_retentions': 14, 'workload_per_teacher': 35},
        {'year': '2018', 'strand_id': 4, 'teachers_count': 8, 'students_count': 320, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.04, 'professional_dev_hours': 20, 'historical_resignations': 2, 'historical_retentions': 14, 'workload_per_teacher': 35},
        {'year': '2018', 'strand_id': 5, 'teachers_count': 7, 'students_count': 280, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.04, 'professional_dev_hours': 20, 'historical_resignations': 2, 'historical_retentions': 14, 'workload_per_teacher': 35},
        {'year': '2018', 'strand_id': 1, 'teachers_count': 10, 'students_count': 400, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.04, 'professional_dev_hours': 20, 'historical_resignations': 2, 'historical_retentions': 14, 'workload_per_teacher': 35},
        {'year': '2019', 'strand_id': 2, 'teachers_count': 10, 'students_count': 400, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.05, 'professional_dev_hours': 21, 'historical_resignations': 3, 'historical_retentions': 15, 'workload_per_teacher': 36},
        {'year': '2019', 'strand_id': 3, 'teachers_count': 7, 'students_count': 280, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.05, 'professional_dev_hours': 21, 'historical_resignations': 3, 'historical_retentions': 15, 'workload_per_teacher': 36},
        {'year': '2019', 'strand_id': 4, 'teachers_count': 9, 'students_count': 360, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.05, 'professional_dev_hours': 21, 'historical_resignations': 3, 'historical_retentions': 15, 'workload_per_teacher': 36},
        {'year': '2019', 'strand_id': 5, 'teachers_count': 8, 'students_count': 320, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.05, 'professional_dev_hours': 21, 'historical_resignations': 3, 'historical_retentions': 15, 'workload_per_teacher': 36},
        {'year': '2019', 'strand_id': 1, 'teachers_count': 11, 'students_count': 440, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.05, 'professional_dev_hours': 21, 'historical_resignations': 3, 'historical_retentions': 15, 'workload_per_teacher': 36},
        {'year': '2020', 'strand_id': 2, 'teachers_count': 11, 'students_count': 440, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.06, 'professional_dev_hours': 22, 'historical_resignations': 4, 'historical_retentions': 16, 'workload_per_teacher': 37},
        {'year': '2020', 'strand_id': 3, 'teachers_count': 8, 'students_count': 320, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.06, 'professional_dev_hours': 22, 'historical_resignations': 4, 'historical_retentions': 16, 'workload_per_teacher': 37},
        {'year': '2020', 'strand_id': 4, 'teachers_count': 10, 'students_count': 400, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.06, 'professional_dev_hours': 22, 'historical_resignations': 4, 'historical_retentions': 16, 'workload_per_teacher': 37},
        {'year': '2020', 'strand_id': 5, 'teachers_count': 9, 'students_count': 360, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.06, 'professional_dev_hours': 22, 'historical_resignations': 4, 'historical_retentions': 16, 'workload_per_teacher': 37},
        {'year': '2020', 'strand_id': 1, 'teachers_count': 12, 'students_count': 480, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.06, 'professional_dev_hours': 22, 'historical_resignations': 4, 'historical_retentions': 16, 'workload_per_teacher': 37},
        {'year': '2021', 'strand_id': 2, 'teachers_count': 12, 'students_count': 480, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.07, 'professional_dev_hours': 23, 'historical_resignations': 3, 'historical_retentions': 17, 'workload_per_teacher': 38},
        {'year': '2021', 'strand_id': 3, 'teachers_count': 9, 'students_count': 360, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.07, 'professional_dev_hours': 23, 'historical_resignations': 3, 'historical_retentions': 17, 'workload_per_teacher': 38},
        {'year': '2021', 'strand_id': 4, 'teachers_count': 11, 'students_count': 440, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.07, 'professional_dev_hours': 23, 'historical_resignations': 3, 'historical_retentions': 17, 'workload_per_teacher': 38},
        {'year': '2021', 'strand_id': 5, 'teachers_count': 10, 'students_count': 400, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.07, 'professional_dev_hours': 23, 'historical_resignations': 3, 'historical_retentions': 17, 'workload_per_teacher': 38},
        {'year': '2021', 'strand_id': 1, 'teachers_count': 13, 'students_count': 520, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.07, 'professional_dev_hours': 23, 'historical_resignations': 3, 'historical_retentions': 17, 'workload_per_teacher': 38},
        {'year': '2022', 'strand_id': 2, 'teachers_count': 13, 'students_count': 520, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.08, 'professional_dev_hours': 24, 'historical_resignations': 2, 'historical_retentions': 18, 'workload_per_teacher': 39},
        {'year': '2022', 'strand_id': 3, 'teachers_count': 10, 'students_count': 400, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.08, 'professional_dev_hours': 24, 'historical_resignations': 2, 'historical_retentions': 18, 'workload_per_teacher': 39},
        {'year': '2022', 'strand_id': 4, 'teachers_count': 12, 'students_count': 480, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.08, 'professional_dev_hours': 24, 'historical_resignations': 2, 'historical_retentions': 18, 'workload_per_teacher': 39},
        {'year': '2022', 'strand_id': 5, 'teachers_count': 11, 'students_count': 440, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.08, 'professional_dev_hours': 24, 'historical_resignations': 2, 'historical_retentions': 18, 'workload_per_teacher': 39},
        {'year': '2022', 'strand_id': 1, 'teachers_count': 14, 'students_count': 560, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.08, 'professional_dev_hours': 24, 'historical_resignations': 2, 'historical_retentions': 18, 'workload_per_teacher': 39},
        {'year': '2023', 'strand_id': 2, 'teachers_count': 14, 'students_count': 560, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.09, 'professional_dev_hours': 25, 'historical_resignations': 3, 'historical_retentions': 19, 'workload_per_teacher': 40},
        {'year': '2023', 'strand_id': 3, 'teachers_count': 11, 'students_count': 440, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.09, 'professional_dev_hours': 25, 'historical_resignations': 3, 'historical_retentions': 19, 'workload_per_teacher': 40},
        {'year': '2023', 'strand_id': 4, 'teachers_count': 13, 'students_count': 520, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.09, 'professional_dev_hours': 25, 'historical_resignations': 3, 'historical_retentions': 19, 'workload_per_teacher': 40},
        {'year': '2023', 'strand_id': 5, 'teachers_count': 12, 'students_count': 480, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.09, 'professional_dev_hours': 25, 'historical_resignations': 3, 'historical_retentions': 19, 'workload_per_teacher': 40},
        {'year': '2023', 'strand_id': 1, 'teachers_count': 15, 'students_count': 600, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.09, 'professional_dev_hours': 25, 'historical_resignations': 3, 'historical_retentions': 19, 'workload_per_teacher': 40},
        {'year': '2024', 'strand_id': 2, 'teachers_count': 15, 'students_count': 600, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.10, 'professional_dev_hours': 26, 'historical_resignations': 4, 'historical_retentions': 20, 'workload_per_teacher': 41},
        {'year': '2024', 'strand_id': 3, 'teachers_count': 12, 'students_count': 480, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.10, 'professional_dev_hours': 26, 'historical_resignations': 4, 'historical_retentions': 20, 'workload_per_teacher': 41},
        {'year': '2024', 'strand_id': 4, 'teachers_count': 14, 'students_count': 560, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.10, 'professional_dev_hours': 26, 'historical_resignations': 4, 'historical_retentions': 20, 'workload_per_teacher': 41},
        {'year': '2024', 'strand_id': 5, 'teachers_count': 13, 'students_count': 520, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.10, 'professional_dev_hours': 26, 'historical_resignations': 4, 'historical_retentions': 20, 'workload_per_teacher': 41},
        {'year': '2024', 'strand_id': 1, 'teachers_count': 16, 'students_count': 640, 'target_ratio': 25, 'max_class_size': 40, 'salary_ratio': 1.10, 'professional_dev_hours': 26, 'historical_resignations': 4, 'historical_retentions': 20, 'workload_per_teacher': 41}
    ]

    results = predict_teacher_retention(sample_data)
    pprint.pprint(results)

if __name__ == "__main__":
    main()
