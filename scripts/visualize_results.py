import json
import matplotlib.pyplot as plt
import numpy as np
from collections import defaultdict

RESULTS_PATH = "data/test_results.json"
OUTPUT_PLOT = "evaluation_metrics_grouped.png"

def visualize():
    try:
        with open(RESULTS_PATH, 'r') as f:
            results = json.load(f)
    except FileNotFoundError:
        print(f"❌ Results file not found: {RESULTS_PATH}")
        return

    # Aggregate data by type
    grouped_data = defaultdict(lambda: {"rouge": [], "bleu": [], "bert": []})
    
    for r in results:
        q_type = r.get("type", "unknown")
        metrics = r.get("metrics", {})
        
        # Default to 0.0 if metric missing (e.g. failed test)
        grouped_data[q_type]["rouge"].append(metrics.get("ROUGE-1", 0.0))
        grouped_data[q_type]["bleu"].append(metrics.get("BLEU-4", 0.0))
        grouped_data[q_type]["bert"].append(metrics.get("BERTScore", 0.0))

    # Calculate averages
    categories = sorted(grouped_data.keys())
    avg_rouge = []
    avg_bleu = []
    avg_bert = []

    print(f"{'Category':<25} | {'ROUGE':<8} | {'BLEU':<8} | {'BERT':<8}")
    print("-" * 60)

    for cat in categories:
        r_mean = np.mean(grouped_data[cat]["rouge"])
        b_mean = np.mean(grouped_data[cat]["bleu"])
        bt_mean = np.mean(grouped_data[cat]["bert"])
        
        avg_rouge.append(r_mean)
        avg_bleu.append(b_mean)
        avg_bert.append(bt_mean)
        
        print(f"{cat:<25} | {r_mean:.4f}   | {b_mean:.4f}   | {bt_mean:.4f}")

    # Plotting
    x = np.arange(len(categories))
    width = 0.25

    fig, ax = plt.subplots(figsize=(14, 7))
    rects1 = ax.bar(x - width, avg_rouge, width, label='ROUGE-1 (Avg)', color='#1f77b4', alpha=0.85)
    rects2 = ax.bar(x, avg_bleu, width, label='BLEU-4 (Avg)', color='#ff7f0e', alpha=0.85)
    rects3 = ax.bar(x + width, avg_bert, width, label='BERTScore (Avg)', color='#2ca02c', alpha=0.85)

    ax.set_ylabel('Average Score')
    ax.set_title('Chatbot Performance by Question Type')
    ax.set_xticks(x)
    ax.set_xticklabels(categories, rotation=45, ha='right')
    ax.legend(loc='upper right')
    ax.grid(axis='y', linestyle='--', alpha=0.3)
    ax.set_ylim(0, 1.1)

    # Add value labels for BERTScore (the most important one)
    for rect in rects3:
        height = rect.get_height()
        ax.annotate(f'{height:.2f}',
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=9, fontweight='bold', color='#2ca02c')

    plt.tight_layout()
    plt.savefig(OUTPUT_PLOT)
    print(f"\n✅ Grouped Plot saved to {OUTPUT_PLOT}")

if __name__ == "__main__":
    visualize()
