# ⚡ Full Book Generation Time & Performance Benchmarks

> **Empirical Synthesis Speed Metrics, Processing Time Matrix & Batch Catalog Pipeline**  
> **Updated**: August 24, 2026  

---

## 🚀 1. Real-Time Generation Speed Benchmark

Our pipeline utilizes Kokoro ONNX neural speech synthesis, Whispersync alignment, FFmpeg HLS VOD chunking, and Hetzner S3 uploading:

* **Benchmark Book**: *The Strange Case of Dr. Jekyll and Mr. Hyde*
* **Total Chapters**: 10 Chapters
* **Total Character Count**: ~125,000 Characters
* **Total Generated Audio**: **117.93 Minutes (1.97 Hours)**
* **Actual Real-Time Pipeline Processing Time**: **~4.5 Minutes (270 Seconds)**

### 📊 Synthesis Throughput Ratio:
$$\text{Speed Ratio} = \frac{117.93 \text{ Minutes Audio}}{4.5 \text{ Minutes Real Time}} \approx \mathbf{26.2\times \text{ Real-Time Speed}}$$

> **Key Takeaway**: 1 minute of processing time generates **~26 minutes of finished high-fidelity audio**!

---

## ⏱️ 2. Full Book Generation Time Estimates Matrix

| Book Size / Category | Word Count | Generated Audio | Estimated Generation Time |
| :--- | :--- | :--- | :--- |
| **Short Novella / Classic** | 15,000 – 30,000 words | 1.5 – 2.5 Hours | **3 – 6 Minutes** |
| **Medium Novel** | 50,000 – 70,000 words | 5.0 – 7.0 Hours | **11 – 16 Minutes** |
| **Long Epic Novel** | 100,000 – 120,000 words| 10.0 – 12.0 Hours | **22 – 28 Minutes** |
| **Massive Volume / Omnibus**| 200,000+ words | 20.0+ Hours | **45 – 50 Minutes** |

---

## 💻 3. Single-Book & Batch Commands

### 3.1 Single Book (All Chapters)
```bash
python3 backend/audio_pipeline/run_full_pipeline.py \
  --slug <BOOK_SLUG> \
  --voice am_adam \
  --upload \
  --hls
```

### 3.2 Batch Catalog Generation (Multiple Books in Parallel)
```bash
python3 backend/audio_pipeline/batch_catalog.py \
  --voice am_adam \
  --limit 10
```
