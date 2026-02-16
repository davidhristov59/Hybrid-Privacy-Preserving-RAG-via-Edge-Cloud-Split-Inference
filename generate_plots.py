import matplotlib.pyplot as plt
import numpy as np

# Data based on Table I and the PE-RAG paper findings
datasets = ['ICPR (Industrial)', 'RSEP (Education)']
methods = ['Original (No Privacy)', 'PE-RAG (Ours)', 'De-identification', 'Pure Synthetic Data']

# Utility (ROUGE-L) scores
utility_scores = {
    'ICPR (Industrial)': [0.7648, 0.7447, 0.7212, 0.5668],
    'RSEP (Education)': [0.7200, 0.6532, 0.5166, 0.4888]
}

# Privacy scores (PPS)
privacy_scores = [0.0, 0.9, 0.9, 1.0]

# Plotting
plt.figure(figsize=(10, 6))
plt.style.use('seaborn-v0_8-whitegrid')

markers = ['o', 's', '^', 'D']
colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']

for i, dataset in enumerate(datasets):
    x = privacy_scores
    y = utility_scores[dataset]
    
    # Plot points
    for j in range(len(methods)):
        plt.scatter(x[j], y[j], color=colors[j], marker=markers[j], s=100, 
                    label=methods[j] if i == 0 else "", zorder=5)
    
    # Draw trend line
    plt.plot(x, y, label=f'Trade-off ({dataset})', linestyle='--', alpha=0.6)

plt.xlabel('Privacy Preservation Score (PPS)', fontsize=12, fontweight='bold')
plt.ylabel('Utility (ROUGE-L)', fontsize=12, fontweight='bold')
plt.title('Privacy-Utility Trade-off across Datasets', fontsize=14, fontweight='bold')
plt.xlim(-0.05, 1.05)
plt.ylim(0.4, 0.85)
plt.legend(frameon=True, loc='lower left', fontsize=10)
plt.grid(True, linestyle=':', alpha=0.7)

# Highlight PE-RAG success
plt.annotate('High Utility & High Privacy', xy=(0.9, 0.74), xytext=(0.5, 0.8),
             arrowprops=dict(facecolor='black', shrink=0.05, width=1, headwidth=8),
             fontsize=10, bbox=dict(boxstyle="round,pad=0.3", fc="yellow", ec="black", alpha=0.2))

plt.tight_layout()
plt.savefig('privacy_vs_utility.png', dpi=300)
print("Graph generated successfully as privacy_vs_utility.png")
