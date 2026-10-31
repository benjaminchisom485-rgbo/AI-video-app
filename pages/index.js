import Head from "next/head";
import { useEffect, useState } from "react";

const promptIdeas = [
  "A quiet street in Lagos just after the rain, warm reflections, slow cinematic push-in",
  "A tiny greenhouse floating above the clouds at sunrise, soft wind moving the leaves",
  "A close-up of a ceramicist shaping blue clay, natural light, thoughtful camera movement",
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [videoUrl, setVideoUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  async function handleGenerate(event) {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();

    if (trimmedPrompt.length < 8) {
      setError("Add a little more detail before generating.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setVideoUrl("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedPrompt, aspectRatio }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "The video could not be generated. Try again.");
      }

      const videoBlob = await response.blob();
      if (!videoBlob.size) {
        throw new Error("The model returned an empty video. Try a different prompt.");
      }

      setVideoUrl(URL.createObjectURL(videoBlob));
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "The video could not be generated. Try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      <Head>
        <title>AI Video Studio — Make an idea move</title>
        <meta
          name="description"
          content="Turn a written scene into a cinematic AI-generated video. Shape your prompt, choose a format, and preview the result."
        />
        <meta property="og:title" content="AI Video Studio" />
        <meta
          property="og:description"
          content="Turn a written scene into a cinematic AI-generated video."
        />
      </Head>

      <div className="app-shell">
        <header className="topbar">
          <a className="brand" href="/" aria-label="AI Video Studio home">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="brand-name">FRAME<span>WORK</span></span>
          </a>
          <div className="model-pill" aria-label="Video model: Veo 3.1 Fast">
            <span className="model-dot" aria-hidden="true" />
            <span>Veo 3.1 Fast</span>
            <span className="model-divider" aria-hidden="true" />
            <span className="model-provider">AI Gateway</span>
          </div>
        </header>

        <main className="workspace">
          <section className="hero" aria-labelledby="page-title">
            <div className="eyebrow"><span /> AI VIDEO STUDIO <span className="eyebrow-index">/ 01</span></div>
            <h1 id="page-title">Make an idea <span>move.</span></h1>
            <p className="hero-copy">
              Describe a scene. Set the frame. Let the model bring it to life.
            </p>
          </section>

          <div className="studio-grid">
            <section className="panel composer-panel" aria-labelledby="prompt-heading">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">YOUR SCENE</p>
                  <h2 id="prompt-heading">Start with a prompt</h2>
                </div>
                <span className="step-number">01</span>
              </div>

              <form onSubmit={handleGenerate}>
                <label className="field-label" htmlFor="video-prompt">Describe what happens</label>
                <textarea
                  id="video-prompt"
                  name="prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="A lone cyclist rides through a foggy coastal road at dawn, ocean mist drifting across the frame..."
                  maxLength={600}
                  rows={6}
                  aria-describedby="prompt-guidance prompt-count"
                  disabled={isGenerating}
                />
                <div className="input-meta">
                  <span id="prompt-guidance">Be specific about motion, light, and mood.</span>
                  <span id="prompt-count">{prompt.length}/600</span>
                </div>

                <div className="ideas-block">
                  <span className="field-label">Need a starting point?</span>
                  <div className="idea-list">
                    {promptIdeas.map((idea, index) => (
                      <button
                        className="idea-chip"
                        key={idea}
                        type="button"
                        onClick={() => {
                          setPrompt(idea);
                          setError("");
                        }}
                        disabled={isGenerating}
                        aria-label={`Use prompt idea ${index + 1}`}
                      >
                        <span aria-hidden="true">+</span>
                        <span>{index === 0 ? "Rainy Lagos" : index === 1 ? "Cloud greenhouse" : "Clay studio"}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-bottom">
                  <div className="format-control">
                    <label className="field-label" htmlFor="aspect-ratio">FORMAT</label>
                    <select
                      id="aspect-ratio"
                      value={aspectRatio}
                      onChange={(event) => setAspectRatio(event.target.value)}
                      disabled={isGenerating}
                    >
                      <option value="16:9">Landscape · 16:9</option>
                      <option value="9:16">Portrait · 9:16</option>
                    </select>
                  </div>
                  <button
                    className="generate-button"
                    type="submit"
                    disabled={isGenerating || prompt.trim().length < 8}
                  >
                    <span>{isGenerating ? "Creating your video" : "Generate video"}</span>
                    <span className="button-arrow" aria-hidden="true">↗</span>
                  </button>
                </div>
              </form>

              {error && <p className="error-message" role="alert">{error}</p>}
              <p className="usage-note">
                Generation uses your connected AI Gateway and may take a few minutes.
              </p>
            </section>

            <section className="panel preview-panel" aria-labelledby="preview-heading">
              <div className="panel-heading preview-heading">
                <div>
                  <p className="panel-kicker">THE OUTPUT</p>
                  <h2 id="preview-heading">Your video</h2>
                </div>
                <span className={`output-status${videoUrl ? " is-ready" : ""}`}>
                  <span />{videoUrl ? "READY" : isGenerating ? "IN PROGRESS" : "AWAITING PROMPT"}
                </span>
              </div>

              <div className={`preview-stage${videoUrl ? " has-video" : ""}`}>
                {videoUrl ? (
                  <video
                    className="generated-video"
                    src={videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    aria-label="Generated AI video"
                  />
                ) : isGenerating ? (
                  <div className="generating-state" role="status" aria-live="polite">
                    <span className="loader-ring" aria-hidden="true" />
                    <p>Building your scene</p>
                    <span>Keep this tab open while the model renders.</span>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="frame-icon" aria-hidden="true">
                      <span className="frame-corner corner-tl" />
                      <span className="frame-corner corner-tr" />
                      <span className="frame-corner corner-bl" />
                      <span className="frame-corner corner-br" />
                      <span className="frame-orbit orbit-one" />
                      <span className="frame-orbit orbit-two" />
                      <span className="frame-center" />
                    </div>
                    <p>Your next scene starts here.</p>
                    <span>Generated video will appear in this frame.</span>
                  </div>
                )}
              </div>

              {videoUrl ? (
                <div className="output-actions">
                  <span>Preview generated successfully</span>
                  <a href={videoUrl} download="framework-ai-video.mp4">Download video <span aria-hidden="true">↓</span></a>
                </div>
              ) : (
                <div className="preview-footer">
                  <span>MP4 output</span>
                  <span className="footer-separator" aria-hidden="true" />
                  <span>Private to this browser session</span>
                </div>
              )}
            </section>
          </div>

          <footer className="page-footer">
            <span>FRAMEWORK <span className="footer-year">/</span> CREATIVE TOOLS</span>
            <span>Ideas in motion, one frame at a time.</span>
          </footer>
        </main>
      </div>
    </>
  );
}
