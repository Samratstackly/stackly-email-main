import React, { useEffect, useState } from "react";
import profileimage from "../../../assets/images/profileimg.png";
import profileimage1 from "../../../assets/images/profileimg1.png";
import profileimage2 from "../../../assets/images/profileimg2.png";
import profileimage3 from "../../../assets/images/profileimg3.png";
import profileimage4 from "../../../assets/images/profileimg4.png";
import { ComposeModal } from "./ComposeSection/ComposeModal";
import { StripHtml } from "../../../utils/StripHtml";

export const InboxList = ({ mails, selectedMail, setSelectedMail, selectedMailbox, setIsComposeOpen, setDraftData, onToggleStar }) => {

  // const [isComposeOpen, setIsComposeOpen] = useState(false);

  const sortedMails = [...mails].sort((a, b) => {
  const dateA = new Date(a.date || a.created_at || 0);
  const dateB = new Date(b.date || b.created_at || 0);
  return dateB - dateA;
});

  const formatGroupDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();

  const isToday =
    date.toDateString() === today.toDateString();

  if (isToday) {
    return `Today, ${date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    })}`;
  }

  return date.toLocaleDateString("default", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getDisplayEmail = (mail) => {
  if (selectedMailbox === "sent") return mail.to;
  if (selectedMailbox === "drafts") return mail.receiver_email || "Draft";
  return mail.from;
};

  return (
    <div className="relative flex flex-col w-[298px] h-full min-h-0 flex-shrink-0 mx-[26px] pt-[9px] gap-[10px]">
      <div className="w-full h-[44px] px-[26px] border-b-[2px] border-[#6A37F5] flex items-center">
        <div className="flex flex-row justify-between items-center w-[222px] h-[27px] ">
          <button className="flex items-center justify-center w-[104px] h-[27px] rounded-[4px] bg-[#6231A514] inter-bold text-[12px] tracking-[0.07em] text-[#6A37F5] cursor-pointer hover:bg-[#6A37F5] hover:text-[#FFFFFF]">
            Primary
          </button>
          <button className="inter-regular text-[12px] text-[#636775] tracking-[0.07em] cursor-pointer hover:text-[#6A37F5]">
            Others
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between w-full h-[15px] pl-[15px] mb-[2px]">
        <div className="flex justify-between items-center w-[50px] h-[15px] gap-[5px]">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.85412 5.98267C2.40337 4.89767 1.36854 3.70417 0.803287 3.03333C0.628287 2.82567 0.57112 2.67342 0.536703 2.40567C0.41887 1.48867 0.359953 1.03017 0.62887 0.733833C0.897787 0.4375 1.3732 0.4375 2.32404 0.4375H9.05104C10.0019 0.4375 10.4773 0.4375 10.7462 0.73325C11.0151 1.02958 10.9562 1.48808 10.8384 2.40508C10.8034 2.67283 10.7462 2.82508 10.5718 3.03275C10.006 3.70475 8.96937 4.90058 7.51512 5.98733C7.44787 6.03966 7.39228 6.10544 7.35191 6.18047C7.31153 6.2555 7.28725 6.33814 7.28062 6.42308C7.13654 8.01617 7.00354 8.88883 6.9207 9.32983C6.78712 10.0427 5.77737 10.4714 5.23604 10.8535C4.91404 11.081 4.5232 10.8103 4.48179 10.458C4.32689 9.11546 4.19582 7.77027 4.08862 6.42308C4.08263 6.33733 4.05865 6.25379 4.01825 6.17791C3.97785 6.10204 3.92193 6.03551 3.85412 5.98267Z"
              stroke="#040B23"
              stroke-width="0.875"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span className="inter-regular text-[12px] text-[#040B23]">
            Filter
          </span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.41667 4.66667H11.0833M6.41667 7H9.33333M6.41667 9.33333H8.16667M6.41667 2.33333H12.25M3.20833 12.25V1.75M3.20833 12.25C2.8 12.25 2.037 11.0868 1.75 10.7917M3.20833 12.25C3.61667 12.25 4.37967 11.0868 4.66667 10.7917"
            stroke="#040B23"
            stroke-width="0.875"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <div className="relative flex flex-col min-h-0 flex-1 gap-[6px] pt-[12px] pb-[140px] overflow-y-auto scrollbar-hide">
        {sortedMails.map((mail, index) => {
          const currentDate = new Date(mail.date).toDateString();
          const previousDate =
            index > 0
              ? new Date(sortedMails[index - 1].date).toDateString()
              : null;

          const showDateHeader = currentDate !== previousDate;

          return (
            <React.Fragment key={`${mail.id}-${mail.is_favorite ?? false}`}>
              <div className="relative">
                {showDateHeader && (
                  <div className="absolute top-[-8px] left-1/2 transform -translate-x-1/2 w-[108px] h-[16px] px-[10px] py-[4px] gap-[10px] rounded-[8px] bg-[#FFFFFF] shadow-[0px_1px_3.8px_0px_#00000040] flex items-center justify-center z-10">
                    <span className="inter-medium text-[7px] text-[#6A37F5]">
                      {formatGroupDate(mail.date)}
                    </span>
                  </div>
                )}
                <div
                  onClick={() => {
                    if (selectedMailbox === "drafts") {
                      setDraftData(mail);
                      setIsComposeOpen(true);
                    } else {
                      setSelectedMail(mail);
                    }
                  }}
                  className={`cursor-pointer flex justify-between w-full min-h-[98px] px-[12px] py-[15px] rounded-[6px] border border-[#EAEAEA] 
              ${selectedMail?.id === mail.id ? "bg-[#E6E8F0]" : "hover:bg-[#E6E8F0]"}`}
                >
                  <div className="relative w-[26px] h-[26px]">
                    <img
                      src={
                        index === 1
                          ? profileimage
                          : index === 2
                            ? profileimage2
                            : index === 3
                              ? profileimage3
                              : index === 4
                                ? profileimage4
                                : profileimage1
                      }
                      alt="Profile"
                      className="w-[26px] h-[26px]"
                    />
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute bottom-0 right-0"
                    >
                      <circle cx="4" cy="4" r="4" fill="#50C878" />
                    </svg>
                  </div>
                  <div className="flex flex-col flex-1 gap-[5px] mx-[10px]">
                    <div className="flex flex-row justify-between items-center w-[218px] h-[18px]">
                      <span className="inter-regular text-[10px] text-[#767676]">
                        {getDisplayEmail(mail)}
                      </span>
                    </div>
                    <span
                      className={`inter-semibold text-[12px] mt-[0px] ${index === 2 || index === 4 ? "text-[#6A37F5]" : index === 5 ? "text-[#575757]" : "text-[#040B23]"}`}
                    >
                      {mail.subject}
                    </span>
                    {mail.body && (
                      <span className="inter-regular text-[10px] text-[#B6B6B6] mt-[0px] leading-[15px] line-clamp-2">
                        {/* {mail.body} */}
                        {StripHtml(mail.body)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-between w-[32px] h-[70px]">
                    <span className="inter-regular text-[8px] text-[#767676] ml-[-20px] whitespace-nowrap">
                      {new Date(mail.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(mail.id);
                      }}
                    >
                      <g clip-path="url(#clip0_1209_1358)">
                        <path
                          d="M5.72048 1.43457L6.45381 2.91332C6.55381 3.11915 6.82048 3.31665 7.04548 3.35415L8.37423 3.57707C9.22423 3.71999 9.42423 4.34165 8.81173 4.95499L7.77839 5.99665C7.60339 6.1729 7.50756 6.51332 7.56173 6.75707L7.85756 8.04665C8.09089 9.06749 7.55339 9.46207 6.65756 8.92874L5.41173 8.18499C5.18673 8.05082 4.81589 8.05082 4.58673 8.18499L3.34173 8.92874C2.45006 9.46207 1.90839 9.0629 2.14173 8.04665L2.43756 6.75707C2.49173 6.51332 2.39589 6.1729 2.22089 5.99665L1.18756 4.95499C0.579644 4.34124 0.775477 3.71999 1.62506 3.57707L2.95423 3.35415C3.17506 3.31665 3.44173 3.11915 3.54173 2.91332L4.27506 1.43457C4.67506 0.632487 5.32506 0.632487 5.72089 1.43457"
                          stroke={mail.is_favorite ? "#FFB800" : "#727272"}
                          fill={mail.is_favorite ? "#FFB800" : "none"}
                          strokeWidth="0.909091"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_1209_1358">
                          <rect width="10" height="10" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ); })}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-[87px] bg-gradient-to-b from-[rgba(255,255,255,0.19)] to-[#575757]" />
      <button className="absolute z-10 bottom-[20px] left-1/2 transform -translate-x-1/2 w-[132px] h-[36px] rounded-[18px] bg-[#040B23] shadow-[0px_4px_4px_0px_#49494959,0.35] flex flex-row items-center justify-center gap-[8px] cursor-pointer hover:bg-[#1a2340] transition-colors">
        <span className="inter-regular mr-[25px] text-[11px] text-[#FFFFFF]"  onClick={() => {setDraftData(null); // new compose
         setIsComposeOpen(true)}}>
          Compose New
        </span>
        <div className="absolute left-[98px] w-[30px] h-[30px] rounded-[18px] bg-[#FFFFFF1F] flex items-center justify-center">
          <svg
            width="8"
            height="5"
            viewBox="0 0 8 5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.437532 0.4375C0.437532 0.4375 3.01586 3.9375 3.93753 3.9375C4.8592 3.9375 7.43753 0.4375 7.43753 0.4375"
              stroke="white"
              stroke-width="0.875"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* <ComposeModal 
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSendSuccess={() => {
          // Optional: refresh sent items or show notification
          console.log("Email sent successfully!");
        }}
      /> */}
      
    </div>
  );
};