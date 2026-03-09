import React, { useState, useEffect } from "react";
import { getMyDriveFiles, toggleFavorite, moveToTrash, api } from "../../../api/api"; // Added 'api' to imports
import { DriveFileIcon, DriveUploadDropdownIcon } from "../../../assets/icons/Icons1";
import { UploadFileModal } from "./Modals/UploadFileModal"; 
import { ActionMenu } from "./Modals/ActionMenu"; 

// --- Inline SVGs for Main Action Icons ---
const SearchIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9A9B" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const ShareIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>);
const TrashIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const DownloadIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);
const KebabIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>);
const StarFilledIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);

// --- Inline SVGs for Dropdown Menu Icons ---
const MenuCopyIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>);
const MenuUserIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const MenuStarIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);
const MenuEditIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);

// Date formatter
const formatDate = (dateString) => {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const MyFiles = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);

  const fetchFiles = async () => {
    try {
      const response = await getMyDriveFiles();
      setFiles(response.data);
    } catch (error) {
      // Error handling silently or with UI feedback
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleCloseModal = () => {
    setShowUploadModal(false);
    fetchFiles(); 
  };

  // --- Authenticated Download Handler ---
  const handleDownload = async (file) => {
    try {
      const response = await api.get(file.url, {
        responseType: 'blob', // Important: response is treated as a file, not JSON
      });

      // Create a temporary URL for the file blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Use the original filename for the download
      link.setAttribute('download', file.original_name);
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download file.");
    }
  };

  const handleToggleFavorite = async (file) => {
    try {
      // Optimistic UI Update
      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, is_favorite: !f.is_favorite } : f));
      await toggleFavorite(file.id);
    } catch (error) {
      fetchFiles(); 
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      // Optimistic UI Update
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      await moveToTrash(fileId);
    } catch (error) {
      fetchFiles();
    }
  };

  const handleCopyLink = (url) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
  };

  const filteredFiles = files.filter(file => 
    file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDropdownOptions = (file) => [
    {
      label: (
        <div className="flex items-center gap-[12px]">
          <MenuCopyIcon />
          <span>Copy link</span>
        </div>
      ),
      onClick: () => handleCopyLink(file.url),
    },
    {
      label: (
        <div className="flex items-center gap-[12px]">
          <MenuUserIcon />
          <span>Manage access</span>
        </div>
      ),
      onClick: () => {},
    },
    {
      label: (
        <div className="flex items-center gap-[12px]">
          {file.is_favorite ? <StarFilledIcon /> : <MenuStarIcon />}
          <span>{file.is_favorite ? "Remove from favorites" : "Favorite"}</span>
        </div>
      ),
      onClick: () => handleToggleFavorite(file),
    },
    {
      label: (
        <div className="flex items-center gap-[12px]">
          <MenuEditIcon />
          <span>Rename</span>
        </div>
      ),
      onClick: () => {},
    }
  ];

  return (
    <>
      <div className="flex-1 flex flex-col gap-[20px] p-5 w-full" style={{ marginLeft: "10px" }}>
        
        {/* Header Area */}
        <div className="flex flex-row items-center justify-between w-full">
          <span className="inter-bold text-[20px] text-[#040B23]">View your files</span>
          
          {/* Search Bar */}
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

        {/* Table Area */}
        <div className="flex flex-col w-full h-[550px] rounded-[8px] border-[1px] border-[#EAEAEA] bg-white mt-[10px]">
          
          {/* Table Header */}
          <div className="w-full h-[46px] bg-[#F9F9F9] rounded-tl-[8px] rounded-tr-[8px] flex items-center px-6 border-b border-[#EAEAEA]">
            <div className="flex-[3] inter-bold text-[11px] text-[#040B23]">Title</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Modified on</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Modified by</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Sharing type</div>
            <div className="flex-[1.5] inter-bold text-[11px] text-[#040B23]">Action</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <span className="inter-medium text-[13px] text-[#9A9A9B]">No files found.</span>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center px-6 border-b border-[#EAEAEA] h-[70px] hover:bg-[#FDFDFD]">
                  
                  {/* Title Area */}
                  <div className="flex-[3] flex flex-row items-center gap-[12px]">
                    <div className="flex items-center justify-center w-[34px] h-[34px] rounded-[7px] bg-[#EEE8FF]">
                      <DriveFileIcon />
                    </div>
                    <div className="flex flex-col gap-[2px] justify-center">
                      <span className="inter-medium text-[13px] text-[#222]">
                        {file.original_name}
                      </span>
                      <span className="inter-regular text-[11px] text-[#939393]">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  </div>

                  {/* Modified On */}
                  <div className="flex-[2] inter-regular text-[13px] text-[#444]">
                    {formatDate(file.created_at)}
                  </div>

                  {/* Modified By (Static for now) */}
                  <div className="flex-[2] inter-regular text-[13px] text-[#444]">
                    You
                  </div>

                  {/* Sharing Type (Static for now) */}
                  <div className="flex-[2] inter-regular text-[13px] text-[#444]">
                    Private
                  </div>

                  {/* Action Columns */}
                  <div className="flex-[1.5] flex flex-row items-center gap-[16px] relative">
                    <button className="cursor-pointer hover:opacity-70"><ShareIcon /></button>
                    
                    <button className="cursor-pointer hover:opacity-70" onClick={() => handleDeleteFile(file.id)}>
                      <TrashIcon />
                    </button>
                    
                    {/* Updated Download Button using authenticated handler */}
                    <button 
                      className="cursor-pointer hover:opacity-70"
                      onClick={() => handleDownload(file)}
                    >
                      <DownloadIcon />
                    </button>
                    
                    {/* Dropdown Menu Trigger */}
                    <button 
                      className={`cursor-pointer hover:opacity-70 flex items-center justify-center w-[24px] h-[24px] rounded-[4px] ${activeMenuId === file.id ? 'bg-[#EEE8FF]' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === file.id ? null : file.id);
                      }}
                    >
                      <KebabIcon />
                    </button>

                    {/* Standalone Action Menu Implementation */}
                    <ActionMenu 
                      isOpen={activeMenuId === file.id} 
                      onClose={() => setActiveMenuId(null)}
                      options={getDropdownOptions(file)} 
                    />
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
        style={{
          width: "132px",
          height: "36px",
          top: "777px",
          left: "700px",
          borderRadius: "18px",
          background: "#040B23",
          boxShadow: "0px 4px 4px 0px #49494959",
          opacity: 1,
          zIndex: 50
        }}
        onClick={() => setShowUploadModal(true)}
      >
        <span className="text-white inter-regular text-[11px] cursor-pointer" style={{ borderRadius: "18px", background: "transparent" }}>
          Upload file
        </span>
        <div className="flex items-center justify-center w-[30px] h-[30px] rounded-[50%] mr-[-30px] bg-[#FFFFFF1F]">
          <DriveUploadDropdownIcon />
        </div>
      </button>

      <UploadFileModal open={showUploadModal} onClose={handleCloseModal} />
    </>
  );
};

export default MyFiles;