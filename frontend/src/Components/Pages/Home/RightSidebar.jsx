import React, { useState } from "react";
import notes from "../../../assets/images/3d-notes.png";
import discussion from "../../../assets/images/discussion.png";
import shipment from "../../../assets/images/shipment.png";
import image1 from "../../../assets/images/image1.png";
import image2 from "../../../assets/images/image2.png";
import image3 from "../../../assets/images/image3.png";
import { PlusIcon, RightChevronIcon } from "../../../assets/icons/Icons2";
import { RightSidebar1 } from "./RightSidebar1";

export const RightSidebar = () => {
  const [isRightSidebar1Open, setIsRightSidebar1Open] = useState(false);

  return (
    <>
      {!isRightSidebar1Open && (
        <div 
          className="flex flex-col w-[48px] h-[700px] gap-[0px] py-[16px] bg-[#FFFFFF] cursor-pointer"
          onClick={() => setIsRightSidebar1Open(true)}
        >
          <div className="w-[48px] h-[610px] border-b-[1px] border-[#D9D9D9]">
            <div className="flex flex-col items-center w-[48px] h-[279px]">
               <div className="flex justify-center w-[48px] h-[139px] border-b border-[#D9D9D9]">
                 <div className="flex flex-col w-[20px] h-[108px] gap-[24px]">
                   <img src={discussion} alt="discussion" className="w-[20px] h-[20px]" />
                   <img src={notes} alt="notes" className="w-[20px] h-[20px]" />
                    <img src={shipment} alt="shipment" className="w-[20px] h-[20px]" />
                 </div>
                </div> 
                 <div className="flex justify-center items-end w-[48px] h-[139px]">
                 <div className="flex flex-col  w-[20px] h-[122px] gap-[14px]">
                   <img src={image3} alt="Image3" className="w-[20px] h-[20px]" />
                   <img src={image2} alt="Image2" className="w-[20px] h-[20px]" />
                    <img src={image1} alt="Image1" className="w-[20px] h-[20px]" />
                    <div className="flex items-center justify-center w-[20px] h-[20px] rounded-[50%] border-[0.5px] border-[#6A37F5]">
                      <PlusIcon />
                    </div>
                 </div>
                </div>
            </div>
          </div>
          <div className="flex items-center justify-center w-[48px] h-[90px]">
            <div className="flex items-center justify-center w-[36.67px] h-[36.67px] ">
              <div className="flex items-center justify-center w-[16.67px] h-[16.67px] bg-[#EDEDED]">
                <RightChevronIcon />
              </div>
            </div>
          </div>
        </div>
      )}

      {isRightSidebar1Open && <RightSidebar1 onClose={() => setIsRightSidebar1Open(false)} />}
    </>
  );
};