import csv
import requests
import json

API = "http://127.0.0.1:8000/api/v1/detect"
LAYERS = ["rule_based", "bert", "llm_guardrail", "all"]

def evaluate(layer):
    results = []
    with open("data/dataset.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            prompt = row["prompt"]
            true_label = row["label"]
            try:
                r = requests.post(API, json={"prompt": prompt, "layer": layer})
                d = r.json()
                predicted = "injection" if d["is_injection"] else "safe"
                correct = predicted == true_label
                results.append({"prompt": prompt, "true": true_label, "predicted": predicted, "correct": correct, "confidence": d["confidence"]})
            except Exception as e:
                print(f"Error: {e}")

    total = len(results)
    correct = sum(1 for r in results if r["correct"])
    tp = sum(1 for r in results if r["true"] == "injection" and r["predicted"] == "injection")
    fp = sum(1 for r in results if r["true"] == "safe" and r["predicted"] == "injection")
    fn = sum(1 for r in results if r["true"] == "injection" and r["predicted"] == "safe")
    tn = sum(1 for r in results if r["true"] == "safe" and r["predicted"] == "safe")

    accuracy = correct / total * 100
    precision = tp / (tp + fp) * 100 if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) * 100 if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    fpr = fp / (fp + tn) * 100 if (fp + tn) > 0 else 0

    print(f"\n{'='*50}")
    print(f"Layer: {layer.upper()}")
    print(f"{'='*50}")
    print(f"Accuracy:          {accuracy:.1f}%")
    print(f"Precision:         {precision:.1f}%")
    print(f"Recall:            {recall:.1f}%")
    print(f"F1 Score:          {f1:.1f}%")
    print(f"False Positive:    {fpr:.1f}%")
    print(f"Correct:           {correct}/{total}")

print("Starting evaluation...")
for layer in LAYERS:
    evaluate(layer)
print("\nEvaluation complete!")
