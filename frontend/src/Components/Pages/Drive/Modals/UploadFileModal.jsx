import React, { useRef, useState } from "react";
import pdfimage from "../../../../assets/images/pdfimage.png";
import { UploadFileIcon, UploadFileRemoveIcon } from "../../../../assets/icons/Icons1";
import { uploadDriveFile } from "../../../../api/api"; // Adjust this path if api.js is located elsewhere

const modalStyle = {
  position: "absolute",
  width: 318,
  height: 360,
  top: 236,
  left: 540,
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
  opacity: 1,
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 24
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.3)",
  zIndex: 999
};

export const UploadFileModal = ({ open, onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  if (!open) return null;

  const handleFileChange = (e) => {
    setError("");
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setError("");
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError("");

    try {
      // 1. Create a single FormData object
      const formData = new FormData();

      // 2. Append ALL selected files to the "files" key 
      // This perfectly matches the files: List[UploadFile] in your FastAPI backend
      selectedFiles.forEach((file) => {
        formData.append("files", file); 
      });
      
      // 3. Send a single request with all files included
      await uploadDriveFile(formData);

      // Clear files and close modal on success
      setSelectedFiles([]);
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div className="flex flex-col w-[278px] h-[330px] gap-[20px]">
          <div className="flex flex-col w-full h-[282px] gap-[10px]">
            <div className="w-[278px] h-[39px] p-[10px]">
              <span className="inter-bold text-[16px] ">Upload files</span>
            </div>
            <div className="flex flex-col w-[full] h-[233px] gap-[11px]">
              <div
                className="w-full h-[130px] rounded-[12px] border-[1px] border-[#EAEAEA] px-[70px] py-[33px]"
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{ cursor: "pointer" }}
              >
                <div className="flex flex-col items-center justify-center w-full h-[64px] gap-[5px]">
                  <UploadFileIcon />
                  <span className="inter-medium text-[12px] whitespace-nowrap">Drop file here or browse</span>
                  <span className="inter-medium text-[12px] text-[#B5B5B5]">Upload upto 1GB </span>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              <div className="flex flex-col w-full h-[92px] gap-[8px]">
                {selectedFiles.length === 0 ? (
                  <>
                    <div className="flex flex-row items-center justify-between w-[278px] h-[42px] rounded-[10px] px-[10px] py-[10px] gap-[10px]">
                      <div className="flex flex-row w-[200px] h-full gap-[10px]">
                        <img src={pdfimage} alt="pdf" className="w-[19.33px] h-[24px]" />
                        <div className="flex flex-col w-full h-full gap-[0px]">
                          <span className="inter-medium text-[10px] ">3rd Quarter Plan.pdf</span>
                          <span className="inter-regular text-[9px] text-[#939393]">16 MB</span>
                        </div>
                      </div>
                      <UploadFileRemoveIcon />
                    </div>
                    <div className="flex flex-row items-center justify-between w-[278px] h-[42px] rounded-[10px] px-[10px] py-[10px] gap-[10px]">
                      <div className="flex flex-row w-[200px] h-full gap-[10px]">
                        <img src={pdfimage} alt="pdf" className="w-[19.33px] h-[24px]" />
                        <div className="flex flex-col w-full h-full gap-[0px]">
                          <span className="inter-medium text-[10px] ">3rd Quarter Plan.pdf</span>
                          <span className="inter-regular text-[9px] text-[#939393]">16 MB</span>
                        </div>
                      </div>
                      <UploadFileRemoveIcon />
                    </div>
                  </>
                ) : (
                  selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex flex-row items-center justify-between w-[278px] h-[42px] rounded-[10px] px-[10px] py-[10px] gap-[10px]">
                      <div className="flex flex-row w-[200px] h-full gap-[10px]">
                        <img src={pdfimage} alt="pdf" className="w-[19.33px] h-[24px]" />
                        <div className="flex flex-col w-full h-full gap-[0px]">
                          <span className="inter-medium text-[10px] ">{file.name}</span>
                          <span className="inter-regular text-[9px] text-[#939393]">{(file.size/1024/1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                      <UploadFileRemoveIcon style={{ cursor: "pointer" }} onClick={() => handleRemoveFile(idx)} />
                    </div>
                  ))
                )}
              </div>
              {error && <span className="text-red-500 text-xs text-center mt-1">{error}</span>}
            </div>
          </div>
          <button
            className="flex items-center justify-center w-[278px] h-[28px] rounded-[10px] bg-[#141414]"
            onClick={handleUpload}
            disabled={uploading}
          >
            <span className="inter-medium text-[10px] text-[white]">{uploading ? "Uploading..." : "Upload now"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};