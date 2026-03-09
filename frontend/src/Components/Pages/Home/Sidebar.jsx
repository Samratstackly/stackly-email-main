import { useState } from "react";
import {
  getInboxMails,
  getSentMails,
  getDraftMails,
  getStarredMails,
  getSpamMails,
  getTrashMails,
} from "../../../api/api";

const items = [
  { label: "All Inbox", key: "inbox" },
  { label: "Sent mail", key: "sent" },
   { label: "Outbox", key: "outbox" },
  { label: "Drafts", key: "drafts" },
  { label: "Junk", key: "junk" },
  { label: "Trash", key: "trash" },
  { label: "Snoozed", key: "snoozed" },
  { label: "Archive", key: "archived" },
  // { label: "Remainders", key: "remainders" },
  { label: "Favourite", key: "favorite" },
];

const MAILBOX_API_MAP = {
  inbox: getInboxMails,
  sent: getSentMails,
  drafts: getDraftMails,
  favorite: getStarredMails,
  junk: getSpamMails,
  trash: getTrashMails,
};

const labelItems = ["Events", "Meetings", "Promotions", "Others"];

export const Sidebar = ({ selectedMailbox, setSelectedMailbox, loadMailbox }) => {
  // const [selectedMailboxIndex, setSelectedMailboxIndex] = useState(0);
  // const [selectedOthersIndex, setSelectedOthersIndex] = useState(null);
  const [selectedLabelIndex, setSelectedLabelIndex] = useState(null);

  const handleMailboxClick = async(itemKey) => {
  setSelectedMailbox(itemKey);
};

  return (
    <div className="flex flex-col w-[158px] h-full bg-[#040B23]">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className="border-b-[2px] border-[#FFFFFF24] flex flex-col">
          <h2 className="inter-bold text-[12px] text-[#FFFFFF] px-[20px] pt-[30px] tracking-[0.07em]">
            Mailbox
          </h2>
          <div className="flex flex-col gap-[10px] py-[10px]">
            {items.map((item) => {
               const isActive = selectedMailbox === item.key;
               return (
              <div
                key={item.key}
                onClick={() => {
                  // setSelectedMailboxIndex(index);
                  // setSelectedOthersIndex(null);
                  setSelectedLabelIndex(null);
                  // handleMailboxClick(item.key);
                  setSelectedMailbox(item.key);
                  //  loadMailbox(item.key);
                }}
                className={`flex items-center justify-between w-[158px] py-[1px] pr-[16px] pl-[28px] gap-[px] cursor-pointer  ${isActive ? "h-[44px] bg-[#6A37F5] text-[#FFFFFF]" : ""}`}
              >
                <span
                  className={`${    isActive ? "inter-bold text-[12px] tracking-[0.07em] leading-[100%]" : "inter-regular text-[11px] text-[#FFFFFF]"} hover:text-[#FFFFFF]`}
                >
                  {item.label}
                </span>
                {/* {index === 0 && ( */}
                  {/* <div className="w-[28px] h-[18px] rounded-[9px] bg-[#4924B0] flex items-center justify-center">
                    <span className="inter-medium text-[9px] text-[#FFFFFF] tracking-[0.07em]">
                      54
                    </span>
                  </div> */}
                {/* )} */}
              </div>
            )})}
          </div>
        </div>
        <div className="border-[#FFFFFF24] flex flex-col">
          <h2 className="inter-bold text-[12px] text-[#FFFFFF] px-[20px] pt-[30px] tracking-[0.07em]">
            Labels
          </h2>
          <div className="flex flex-col h-[200px] gap-[10px] py-[10px]">
            {labelItems.map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedLabelIndex(index);
                  setSelectedMailboxIndex(null);
                  setSelectedOthersIndex(null);
                }}
                className={`flex items-center w-[158px] ${selectedLabelIndex === index ? "h-[44px]" : ""} py-[1px] pr-[16px] pl-[28px] gap-[11px] cursor-pointer ${selectedLabelIndex === index ? "bg-[#6A37F5]" : ""}`}
              >
                {index === 0 && (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="4"
                      cy="4"
                      r="3"
                      stroke="#FFBF60"
                      strokeWidth="2"
                    />
                  </svg>
                )}
                {index === 1 && (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="4"
                      cy="4"
                      r="3"
                      stroke="#00C798"
                      strokeWidth="2"
                    />
                  </svg>
                )}
                {index === 2 && (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="4"
                      cy="4"
                      r="3"
                      stroke="#713CE1"
                      strokeWidth="2"
                    />
                  </svg>
                )}
                {index === 3 && (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="4"
                      cy="4"
                      r="3"
                      stroke="#FF7D6F"
                      strokeWidth="2"
                    />
                  </svg>
                )}
                <span
                  className={`${selectedLabelIndex === index ? "inter-bold text-[12px] tracking-[0.07em] leading-[100%]" : "inter-regular text-[11px]"} ${selectedLabelIndex === index ? "text-[#FFFFFF]" : "text-[#B6B6B6]"} hover:text-[#FFFFFF]`}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
