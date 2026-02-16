import { useState } from "react";
import { apiFetch } from "../utils/api";
import { Spinner, CheckIcon, ActivityIcon } from "../components/Icons";

export const EvaluatePage = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        question: "What medical condition does Marko have?",
        generated_answer: "Marko has been diagnosed with Type 2 Diabetes.",
        reference_answer: "The patient, Marko, was diagnosed with Type 2 Diabetes.",
        masked_context: "The patient, Person_A, was diagnosed with Type 2 Diabetes."
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEvaluate = async () => {
        setLoading(true);
        setResults(null);
        setError(null);
        try {
            const data = await apiFetch("/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const MetricCard = ({ title, value, description, colorClass = "text-foreground" }) => (
        <div className="bg-secondary/30 p-4 rounded-lg border border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{title}</div>
            <div className={`text-2xl font-bold font-mono ${colorClass}`}>{value}</div>
            {description && <div className="text-[10px] text-muted-foreground mt-2 leading-tight">{description}</div>}
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-background h-screen">
            <header className="px-8 py-10 border-b border-border bg-card/30 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                            <ActivityIcon size={20} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Evaluation Metrics</h1>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                        Test the generation quality and privacy preservation of the system.
                    </p>
                </div>
            </header>

            <main className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Form */}
                    <div className="space-y-6">
                        <div className="glass-panel p-6 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                 <h3 className="font-semibold text-sm">Test Case</h3>
                                 <button
                                    onClick={() => setFormData({
                                        question: "What is Marko's condition?",
                                        generated_answer: "Marko Markovski has Type 2 Diabetes.",
                                        reference_answer: "Patient Marko Markovski diagnosed with Type 2 Diabetes.",
                                        masked_context: "Patient Person_A diagnosed with Condition_X."
                                    })}
                                    className="text-xs text-primary hover:underline"
                                 >
                                    Load Sample
                                 </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Question</label>
                                    <input
                                        name="question"
                                        value={formData.question}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Reference Answer (Ground Truth)</label>
                                    <textarea
                                        name="reference_answer"
                                        value={formData.reference_answer}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Generated Answer (System Output)</label>
                                    <textarea
                                        name="generated_answer"
                                        value={formData.generated_answer}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    />
                                </div>
                                 <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Masked Context (Cloud View) <span className="text-red-400 text-[10px] ml-1">*Optional for Privacy Score</span></label>
                                    <textarea
                                        name="masked_context"
                                        value={formData.masked_context}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none font-mono text-xs"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleEvaluate}
                                    disabled={loading}
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading && <Spinner size={16} />}
                                    {loading ? "Computing Metrics..." : "Run Evaluation"}
                                </button>
                            </div>
                            {error && <div className="text-red-400 text-xs bg-red-950/20 p-2 rounded">{error}</div>}
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="space-y-6">
                        {results ? (
                            <div className="glass-panel p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                 <div className="flex items-center gap-2 border-b border-border pb-4">
                                    <CheckIcon size={18} className="text-emerald-500" />
                                    <h3 className="font-semibold">Evaluation Results</h3>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Generation Quality</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <MetricCard 
                                                title="ROUGE-1" 
                                                value={results["ROUGE-1"]} 
                                                description="Word overlap with reference. >0.4 is good." 
                                                colorClass={results["ROUGE-1"] > 0.5 ? "text-emerald-400" : "text-yellow-400"}
                                            />
                                            <MetricCard 
                                                title="METEOR" 
                                                value={results["METEOR"]} 
                                                description="Semantic meaning alignment." 
                                                colorClass={results["METEOR"] > 0.4 ? "text-emerald-400" : "text-blue-400"}
                                            />
                                            <MetricCard title="ROUGE-L" value={results["ROUGE-L"]} description="Sentence structure similarity." />
                                            <MetricCard title="BLEU-4" value={results["BLEU-4"]} description="Precise phrasing match." />
                                        </div>
                                    </div>

                                    {results["PPS"] !== undefined && (
                                        <div>
                                            <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Privacy & Security</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <MetricCard 
                                                    title="PPS (Privacy Score)" 
                                                    value={`${results["PPS"] * 100}%`} 
                                                    description="Percentage of sensitive entities successfully masked."
                                                    colorClass={results["PPS"] === 1.0 ? "text-emerald-500" : "text-red-500"} 
                                                />
                                                <MetricCard 
                                                    title="Reconstruction Acc" 
                                                    value={`${results["Reconstruction_Acc"] * 100}%`} 
                                                    description="Percentage of placeholders correctly restored."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center glass-panel border-dashed p-12 text-center space-y-4 opacity-60">
                                <ActivityIcon size={48} className="text-muted-foreground/30" />
                                <div>
                                    <div className="font-medium text-muted-foreground">No Evaluation Data</div>
                                    <div className="text-xs text-muted-foreground/70 max-w-[200px] mx-auto mt-1">Run an evaluation to see performance metrics.</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
