import React from "react";
import image1 from '../../../assets/images/image1.png';
import { ChatRecentFileIcon } from '../../../assets/icons/Icons1';

const ChatDetails = ({
  activeTab,
  handleTabClick,
  files,
  photos,
  showAllPhotos,
  handleViewAllPhotos
}) => (
  <div className="w-[282px] h-[700px] pt-[40px] pr-[31px] pb-[24px] pl-[31px] gap-[10px]">
    <div className="flex flex-col items-center justify-center w-[220px] h-[605px] gap-[30px]">
      <div className="flex flex-col w-full h-[551px] gap-[20px]">
        <div className="flex flex-col items-center justify-center w-full h-[217px] gap-[10px]">
          <div className="flex items-center justify-center w-[100px] h-[100px]">
            <img src={image1} alt="" className="w-[80px] h-[80px] rounded-[50%]" />
          </div>
          <div className="flex flex-col items-center justify-center w-[146px] h-[37px] gap-[9px]">
            <span className="inter-bold text-[12px] ">Ricky Smith</span>
            <span className="inter-regular text-[11px] text-[#909090]">Rickysmith@thestackly.com</span>
          </div>
          <div className="flex flex-row items-center w-[165px] h-[40px] px-[3px] rounded-[20px] mt-[20px] border-[1px] border-[#D6D6D6]">
            <div
              className={`flex items-center justify-center w-[79.5px] h-[34px] rounded-[20px] cursor-pointer ${activeTab === "files" ? "bg-[#040B23] text-white" : ""}`}
              onClick={() => handleTabClick("files")}
            >
              <span className="inter-medium text-[11px]">Files</span>
            </div>
            <span
              className={`inter-regular ml-[20px] text-[11px] cursor-pointer rounded-[20px] px-3 py-1 transition-colors duration-150 ${
                activeTab === "settings" ? "bg-[#040B23] w-[79.5px] h-[34px] text-white font-bold " : ""
              }`}
              onClick={() => handleTabClick("settings")}
              tabIndex={0}
            >
              Settings
            </span>
          </div>
        </div>
        {/* Tab content */}
        {activeTab === "files" ? (
          <div className="flex flex-col w-full h-[111px] gap-[16px]">
            <span className="inter-bold text-[12px] tracking-[0.02em]">Recent files</span>
            {files.map((file, idx) => (
              <div key={idx} className="flex flex-row items-center w-[103px] h-[16px] px-[2px] gap-[10px]">
                <ChatRecentFileIcon />
                <span className="inter-regular text-[12px] tracking-[0.07em] text-[#5A5A5A]">{file.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col w-full h-[111px] gap-[16px]">
            <span className="inter-bold text-[12px] tracking-[0.02em]">Settings</span>
            <span className="inter-regular text-[12px] text-[#5A5A5A]">Settings content goes here.</span>
          </div>
        )}
        {/* Photos */}
        <div className="w-[220px] h-[165px] mt-[20px]">
          <span className="inter-bold text-[12px]  tracking-[0.02em]">Photos</span>
          <div className="w-[220px] h-[165px] mt-[1px] grid grid-rows-3 grid-cols-3 gap-y-[7px] gap-x-[8px]">
            {(showAllPhotos ? photos : photos.slice(0, 5)).map((img, idx) => (
              <img key={idx} src={img} alt="" className="w-full h-full rounded-[9px]" />
            ))}
          </div>
        </div>
      </div>
      {!showAllPhotos && (
        <button
          className="w-[60px] h-[24px] bg-[#040B230F] rounded-[20px] mt-[30px] border-[1px] border-[#E2E2E2] inter-medium text-[11px] text-[#040B23]"
          onClick={handleViewAllPhotos}
        >
          View all
        </button>
      )}
    </div>
  </div>
);

export default ChatDetails;
