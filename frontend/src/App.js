import React, { useState } from "react";
import axios from "axios";
import * as UTIF from "utif";

function App() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [displayUrl, setDisplayUrl] = useState("");
  const [error, setError] = useState("");

  const CHUNK_SIZE = 1024 * 1024; // 1MB

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setProgress(0);
    setDisplayUrl("");
    setError("");
  };

  const uploadFile = async () => {
    if (!file) return;

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const filename = file.name;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunk);
      formData.append("chunkIndex", chunkIndex);
      formData.append("totalChunks", totalChunks);
      formData.append("filename", filename);

      try {
        await axios.post("http://localhost:8000/api/upload/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const percent = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setProgress(percent);

        if (chunkIndex + 1 === totalChunks) {
          const fileUrl = `http://localhost:8000/media/uploads/${filename}`;
          handleImageDisplay(fileUrl, filename);
        }
      } catch (error) {
        console.error("Erreur lors de l'upload :", error);
        setError("Erreur lors de l'upload.");
        break;
      }
    }
  };

  const handleImageDisplay = (url, filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    const MAX_RAM_MB = 1000; // Taille maximale en mémoire pour l'affichage
    const BYTES_PER_PIXEL = 4; // RGBA

    if (ext === "tif" || ext === "tiff") {
      fetch(url)
        .then((res) => res.arrayBuffer())
        .then((buffer) => {
          const ifds = UTIF.decode(buffer);
          UTIF.decodeImage(buffer, ifds[0]);
          const rgba = UTIF.toRGBA8(ifds[0]);

          const originalWidth = ifds[0].width;
          const originalHeight = ifds[0].height;

          const totalPixels = originalWidth * originalHeight;
          const maxPixels = (MAX_RAM_MB * 1024 * 1024) / BYTES_PER_PIXEL;

          // Si même redimensionné, ça dépasse la limite → erreur
          if (totalPixels > maxPixels * 25) {
            setError(
              `L'image est trop grande pour être affichée (même réduite). Dimensions : ${originalWidth}x${originalHeight}px`
            );
            return;
          }

          const ratio = Math.min(1, Math.sqrt(maxPixels / totalPixels));

          const width = Math.floor(originalWidth * ratio);
          const height = Math.floor(originalHeight * ratio);

          const originalCanvas = document.createElement("canvas");
          originalCanvas.width = originalWidth;
          originalCanvas.height = originalHeight;
          const originalCtx = originalCanvas.getContext("2d");

          const originalImageData = originalCtx.createImageData(originalWidth, originalHeight);
          originalImageData.data.set(rgba);
          originalCtx.putImageData(originalImageData, 0, 0);

          const previewCanvas = document.createElement("canvas");
          previewCanvas.width = width;
          previewCanvas.height = height;
          const previewCtx = previewCanvas.getContext("2d");
          previewCtx.drawImage(originalCanvas, 0, 0, width, height);

          const dataURL = previewCanvas.toDataURL("image/png");
          setDisplayUrl(dataURL);
        })
        .catch((err) => {
          console.error("Erreur lors de la conversion TIFF:", err);
          setError("Erreur d'affichage du fichier TIFF.");
        });
    } else {
      setDisplayUrl(url);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", backgroundColor: "#f9f9f9", borderRadius: "8px", maxWidth: "600px", margin: "auto" }}>
      <h2 style={{ textAlign: "center", color: "#333" }}>Upload de Fichier en Chunks</h2>
      <input 
        type="file" 
        onChange={handleFileChange} 
        style={{
          display: "block", 
          margin: "0 auto", 
          padding: "10px", 
          fontSize: "16px", 
          borderRadius: "4px", 
          border: "1px solid #ccc", 
          width: "100%", 
          marginBottom: "20px"
        }} 
      />
      <button 
        onClick={uploadFile} 
        disabled={!file} 
        style={{
          display: "block", 
          margin: "0 auto", 
          padding: "10px 20px", 
          fontSize: "16px", 
          backgroundColor: "#4CAF50", 
          color: "#fff", 
          border: "none", 
          borderRadius: "4px", 
          cursor: file ? "pointer" : "not-allowed"
        }}
      >
        Upload
      </button>

      <div style={{ marginTop: "10px", textAlign: "center" }}>
        <p>Progression : {progress}%</p>
        <div style={{ height: "10px", background: "#eee", width: "100%", marginTop: "4px", borderRadius: "5px" }}>
          <div style={{ width: `${progress}%`, background: "#4CAF50", height: "100%", borderRadius: "5px" }} />
        </div>
      </div>

      {error && <p style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>{error}</p>}

      {displayUrl && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ textAlign: "center", color: "#333" }}>Prévisualisation :</h3>
          <img
            src={displayUrl}
            alt="Aperçu"
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "500px",
              margin: "0 auto",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
