import React, { useState, useEffect } from "react";
import { getTrashFiles } from "../../../api/api"; // Ensure this matches your API setup
import { DriveFileIcon, DriveUploadDropdownIcon } from "../../../assets/icons/Icons1";
import { UploadFileModal } from "./Modals/UploadFileModal"; 

// --- Inline SVGs ---
const SearchIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9A9B" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const TrashBinIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const InfoIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A996FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>);

// Date formatter (e.g., "Nov 30, 2025")
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const Trash = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFiles = async () => {
    try {
      const response = await getTrashFiles();
      setFiles(response.data);
    } catch (error) {
      console.error("Failed to fetch trash files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleEmptyTrash = () => {
    // Connect to a backend API later if needed
    console.log("Empty trash clicked");
  };

  const filteredFiles = files.filter(file => 
    (file.original_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex-1 flex flex-col gap-[20px] p-5 w-full" style={{ marginLeft: "10px" }}>
        
        {/* Header Area */}
        <div className="flex flex-row justify-between items-start w-full">
          {/* Left Side: Title & Info */}
          <div className="flex flex-col gap-[6px]">
            <span className="inter-bold text-[22px] text-[#040B23]">Trash file</span>
            <div className="flex items-center gap-[6px]">
              <InfoIcon />
              <span className="inter-regular text-[11px] text-[#A996FF]">Trash file will be automatically deleted in 30 days</span>
            </div>
          </div>
          
          {/* Right Side: Empty Trash & Search */}
          <div className="flex flex-row items-center gap-[24px] mt-[4px]">
            <button onClick={handleEmptyTrash} className="flex items-center gap-[8px] text-[#333] hover:opacity-70 cursor-pointer">
              <TrashBinIcon />
              <span className="inter-medium text-[12px]">Empty trash now</span>
            </button>
            <div className="flex flex-row items-center w-[250px] h-[36px] rounded-[18px] border-[1px] border-[#EAEAEA] bg-white px-[14px] gap-[8px]">
              <SearchIcon />
              <input 
                type="text" 
                placeholder="Search by file name or person" 
                className="flex-1 outline-none border-none inter-regular text-[11px] bg-transparent text-[#222]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex flex-col w-full h-[550px] rounded-[8px] border-[1px] border-[#EAEAEA] bg-white mt-[10px]">
          
          {/* Table Header */}
          <div className="w-full h-[46px] bg-[#F9F9F9] rounded-tl-[8px] rounded-tr-[8px] flex items-center px-6 border-b border-[#EAEAEA]">
            <div className="flex-[3] inter-bold text-[11px] text-[#040B23]">Title</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Deleted on</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Deleted by</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Created by</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <span className="inter-medium text-[13px] text-[#9A9A9B]">Trash is empty.</span>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center px-6 border-b border-[#EAEAEA] h-[70px] hover:bg-[#FDFDFD]">
                  
                  {/* Title */}
                  <div className="flex-[3] flex flex-row items-center gap-[12px]">
                    <div className="flex items-center justify-center w-[34px] h-[34px] rounded-[7px] bg-[#EEE8FF]">
                      <DriveFileIcon />
                    </div>
                    <div className="flex flex-col gap-[2px] justify-center">
                      <span className="inter-medium text-[13px] text-[#222]">
                        {file.original_name}
                      </span>
                      <span className="inter-regular text-[11px] text-[#939393]">
                        {file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Size N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Deleted On (Fallback to N/A if missing from backend) */}
                  <div className="flex-[2] inter-regular text-[13px] text-[#444]">
                    {file.created_at ? formatDate(file.created_at) : "N/A"}
                  </div>

                  {/* Deleted By (Static) */}
                  <div className="flex-[2] inter-regular text-[13px] text-[#444]">
                    You
                  </div>

                  {/* Created By (Static) */}
                  <div className="flex-[2] inter-regular text-[13px] text-[#444]">
                    You
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Upload Button */}
      <button
        className="absolute flex flex-row items-center gap-[10px] justify-center cursor-pointer"
        style={{ width: "132px", height: "36px", top: "777px", left: "700px", borderRadius: "18px", background: "#040B23", boxShadow: "0px 4px 4px 0px #49494959", opacity: 1, zIndex: 50 }}
        onClick={() => setShowUploadModal(true)}
      >
        <span className="text-white inter-regular text-[11px] cursor-pointer" style={{ borderRadius: "18px", background: "transparent" }}>
          Upload file
        </span>
        <div className="flex items-center justify-center w-[30px] h-[30px] rounded-[50%] mr-[-30px] bg-[#FFFFFF1F]">
          <DriveUploadDropdownIcon />
        </div>
      </button>

      <UploadFileModal open={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </>
  );
};

export default Trash;