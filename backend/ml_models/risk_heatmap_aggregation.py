import json
import sys
import os
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

def aggregate_risk_heatmap(risk_data):
    """
    Aggregates risk levels by strand for the latest year.
    risk_data: list of dicts with keys including 'Year', 'Strand', 'Risk Level'
    Returns dict mapping strand to highest risk level for latest year.
    """
    if not risk_data:
        return {}

    # Defensive: filter out items without 'Year' or with empty 'Year'
    filtered_data = [item for item in risk_data if 'Year' in item and item['Year'] not in (None, '', 'null')]

    if not filtered_data:
        return {}

    # Find latest year
    years = []
    for item in filtered_data:
        try:
            years.append(int(item['Year']))
        except (ValueError, TypeError):
            continue

    if not years:
        return {}

    latest_year = max(years)

    # Filter data for latest year
    latest_year_data = [item for item in filtered_data if int(item.get('Year', 0)) == latest_year]

    # Define risk priority and colors
    risk_priority = {
        'Extreme': 4,
        'High': 3,
        'Medium': 2,
        'Low': 1,
        'Unknown': 0
    }
    risk_colors = {
        'Extreme': '#FF2D00',  # Dark Red
        'High': '#FF4E42',     # Red
        'Medium': '#FFEB3B',   # Yellow
        'Low': '#81C784',      # Green
        'Unknown': '#B0BEC5'   # Grey
    }

    # Aggregate highest risk per strand
    strand_risk = {}
    for item in latest_year_data:
        strand = item.get('Strand', '').strip()
        risk_level = item.get('Risk Level', 'Unknown').strip()
        if strand not in strand_risk:
            strand_risk[strand] = risk_level
        else:
            current_priority = risk_priority.get(strand_risk[strand], 0)
            new_priority = risk_priority.get(risk_level, 0)
            if new_priority > current_priority:
                strand_risk[strand] = risk_level

    # Generate heatmap image
    strands = list(strand_risk.keys())
    risks = [risk_priority.get(strand_risk[s], 0) for s in strands]
    colors = [risk_colors.get(strand_risk[s], '#B0BEC5') for s in strands]

    # Create a heatmap matrix (1 row, n columns)
    data = np.array([risks])

    plt.figure(figsize=(len(strands), 1.5))
    ax = sns.heatmap(data, annot=[strand_risk[s] for s in strands], fmt='', cmap=sns.color_palette(colors), cbar=False, linewidths=0.5, linecolor='black')

    # Set x-axis labels as strands
    ax.set_xticklabels(strands, rotation=45, ha='right', fontsize=12)
    ax.set_yticklabels([])  # Hide y-axis labels

    plt.title(f'Risk Heatmap for Year {latest_year}', fontsize=14)
    plt.tight_layout()

    # Save heatmap image to a public directory
    output_dir = os.path.join(os.path.dirname(__file__), '../api/uploads')
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'risk_heatmap.png')
    plt.savefig(output_path)
    plt.close()

    return {
        'year': latest_year,
        'strand_risk': strand_risk,
        'heatmap_image_url': '/api/uploads/risk_heatmap.png'
    }

def main():
    # Read JSON input from stdin
    input_json = sys.stdin.read()
    try:
        risk_data = json.loads(input_json)
    except json.JSONDecodeError:
        print(json.dumps({'error': 'Invalid JSON input'}))
        sys.exit(1)

    result = aggregate_risk_heatmap(risk_data)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
