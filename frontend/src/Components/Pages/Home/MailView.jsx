import { useState } from "react";
import attachmentimage from "../../../assets/images/attachmentimg.png";
import attachmentimage1 from "../../../assets/images/attachmentimg1.png";
import profileimage from "../../../assets/images/profileimg.png";
import { StripHtml } from "../../../utils/StripHtml";
import nomessagestoread from "../../../assets/images/nomessagestoread.png"; 

export const MailView = ({mail,mails,onArchive,onDelete,onToggleStar,onToggleRead,onUnarchive,selectedMailbox,setSelectedMail,onRestore}) => {
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState("");

  if (!mails || mails.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white">
        <img
          src={nomessagestoread}
          alt="No messages to read"
          className="w-[320px] opacity-80"
        />
      </div>
    );
  }

// const currentIndex = mails.findIndex(m => m.id === mail?.id) + 1;
const currentIndex = mails.findIndex(m => m.id === mail?.id);
  const totalCount = mails.length;

const goPrev = () => {
  if (currentIndex > 0) {
    setSelectedMail(mails[currentIndex - 1]);
  }
};

const goNext = () => {
  if (currentIndex < mails.length - 1) {
    setSelectedMail(mails[currentIndex + 1]);
  }
};

  if (!mail || currentIndex === -1) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white">
        Select a Mail to Preview
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 w-[672px] mr-[52px] mt-[9px] overflow-hidden ">
      {/*Top toolbar */}
      <div className="w-[672px] h-[45px] shrink-0 bg-[#040B23] px-[16px] flex items-center gap-[128px] rounded-[4px]">
        <div className="flex flex-row w-[164px] h-[16px] gap-[21px] ">
          <svg
            onClick={() =>
              selectedMailbox === "archived"
                ? onUnarchive(mail.id)
                : onArchive(mail.id)
            }
            className="cursor-pointer"
            width="15"
            height="13"
            viewBox="0 0 15 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.5 3.83333V8.5C12.5 10.3853 12.5 11.3287 11.914 11.914C11.3287 12.5 10.3853 12.5 8.5 12.5H5.83333C3.948 12.5 3.00467 12.5 2.41933 11.914C1.83333 11.3287 1.83333 10.3853 1.83333 8.5V3.83333M5.83333 5.83333H8.5M12.1667 0.5H2.16667C1.54333 0.5 1.232 0.5 1 0.634C0.847993 0.721765 0.721765 0.847993 0.634 1C0.5 1.232 0.5 1.54333 0.5 2.16667C0.5 2.79 0.5 3.10133 0.634 3.33333C0.721765 3.48534 0.847993 3.61157 1 3.69933C1.232 3.83333 1.54333 3.83333 2.16667 3.83333H12.1667C12.79 3.83333 13.1013 3.83333 13.3333 3.69933C13.4853 3.61157 13.6116 3.48534 13.6993 3.33333C13.8333 3.10133 13.8333 2.79 13.8333 2.16667C13.8333 1.54333 13.8333 1.232 13.6993 1C13.6116 0.847993 13.4853 0.721765 13.3333 0.634C13.1013 0.5 12.79 0.5 12.1667 0.5Z"
              stroke="white"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            {selectedMailbox === "archived" && (
              <line
                x1="1"
                y1="12"
                x2="14"
                y2="1"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            )}
          </svg>
          <svg
            width="15"
            height="13"
            viewBox="0 0 15 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.08667 10.9687L1.5 12.502M11.26 10.9453L12.8333 12.4987M2.5 0.5L0.5 2.5M13.8333 2.5L11.8333 0.5M12.8333 6.83333C12.8333 8.33623 12.2363 9.77757 11.1736 10.8403C10.1109 11.903 8.66956 12.5 7.16667 12.5C5.66377 12.5 4.22243 11.903 3.15973 10.8403C2.09702 9.77757 1.5 8.33623 1.5 6.83333C1.5 5.33044 2.09702 3.8891 3.15973 2.8264C4.22243 1.76369 5.66377 1.16667 7.16667 1.16667C8.66956 1.16667 10.1109 1.76369 11.1736 2.8264C12.2363 3.8891 12.8333 5.33044 12.8333 6.83333Z"
              stroke="white"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M7.16699 3.83301V6.83301L8.50033 8.16634"
              stroke="white"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.5 11.1667C9.5 11.4731 9.43965 11.7765 9.32239 12.0596C9.20513 12.3427 9.03325 12.5999 8.81658 12.8166C8.59991 13.0333 8.34269 13.2051 8.05959 13.3224C7.7765 13.4396 7.47308 13.5 7.16667 13.5C6.86025 13.5 6.55683 13.4396 6.27374 13.3224C5.99065 13.2051 5.73342 13.0333 5.51675 12.8166C5.30008 12.5999 5.12821 12.3427 5.01095 12.0596C4.89369 11.7765 4.83333 11.4731 4.83333 11.1667M0.5 0.5L13.8333 13.8333"
              stroke="white"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M13.1668 9.98748C13.1668 9.67481 13.0428 9.37481 12.8215 9.15414L12.4195 8.75148C12.0444 8.37649 11.8336 7.86787 11.8335 7.33748V5.50014C11.8336 4.63747 11.5945 3.79165 11.1429 3.05663C10.6913 2.32162 10.0448 1.72617 9.27515 1.33642C8.50553 0.946677 7.64295 0.777889 6.78319 0.848804C5.92343 0.919719 5.10016 1.22756 4.40481 1.73814M2.34681 11.1668C2.11359 11.1667 1.88564 11.0975 1.69177 10.9678C1.4979 10.8382 1.34682 10.654 1.25762 10.4385C1.16843 10.223 1.14513 9.98592 1.19067 9.75719C1.23621 9.52846 1.34855 9.31837 1.51347 9.15348L1.91481 8.75148C2.28966 8.37638 2.5002 7.86777 2.50014 7.33748V5.50014C2.50014 4.63881 2.73347 3.83214 3.14014 3.14014L11.1668 11.1668H2.34681Z"
              stroke="white"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg
            // onClick={() => onDelete(mail.id)}
            width="13"
            height="15"
            viewBox="0 0 13 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={() => {
              if (selectedMailbox === "trash") {
                onRestore(mail.id);
              } else {
                onDelete(mail.id);
              }
            }}
            className="cursor-pointer"
          >
            <path
              d="M11.5 2.83333L11.0867 9.51667C10.9813 11.224 10.9287 12.078 10.5 12.692C10.2884 12.9954 10.0159 13.2515 9.7 13.444C9.062 13.8333 8.20667 13.8333 6.496 13.8333C4.78267 13.8333 3.926 13.8333 3.28667 13.4433C2.97059 13.2505 2.69814 12.9939 2.48667 12.69C2.05867 12.0753 2.00667 11.22 1.904 9.51L1.5 2.83333M0.5 2.83333H12.5M9.204 2.83333L8.74867 1.89467C8.44667 1.27067 8.29533 0.959333 8.03467 0.764667C7.97676 0.721544 7.91545 0.683195 7.85133 0.65C7.56267 0.5 7.216 0.5 6.52333 0.5C5.81267 0.5 5.45733 0.5 5.16333 0.656C5.09834 0.690807 5.03635 0.730945 4.978 0.776C4.71467 0.978 4.56733 1.30133 4.27267 1.94733L3.86867 2.83333"
              stroke="white"
              stroke-linecap="round"
            />
            {selectedMailbox === "trash" && (
              <line
                x1="1"
                y1="14"
                x2="12"
                y2="1"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            )}
          </svg>
          <svg
            width="2"
            height="12"
            viewBox="0 0 2 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 1C2 0.734784 1.89464 0.48043 1.70711 0.292893C1.51957 0.105357 1.26522 0 1 0C0.734784 0 0.480429 0.105357 0.292893 0.292893C0.105357 0.48043 0 0.734784 0 1C0 1.26522 0.105357 1.51957 0.292893 1.70711C0.480429 1.89464 0.734784 2 1 2C1.26522 2 1.51957 1.89464 1.70711 1.70711C1.89464 1.51957 2 1.26522 2 1ZM2 6C2 5.73478 1.89464 5.48043 1.70711 5.29289C1.51957 5.10536 1.26522 5 1 5C0.734784 5 0.480429 5.10536 0.292893 5.29289C0.105357 5.48043 0 5.73478 0 6C0 6.26522 0.105357 6.51957 0.292893 6.70711C0.480429 6.89464 0.734784 7 1 7C1.26522 7 1.51957 6.89464 1.70711 6.70711C1.89464 6.51957 2 6.26522 2 6ZM2 11C2 10.7348 1.89464 10.4804 1.70711 10.2929C1.51957 10.1054 1.26522 10 1 10C0.734784 10 0.480429 10.1054 0.292893 10.2929C0.105357 10.4804 0 10.7348 0 11C0 11.2652 0.105357 11.5196 0.292893 11.7071C0.480429 11.8946 0.734784 12 1 12C1.26522 12 1.51957 11.8946 1.70711 11.7071C1.89464 11.5196 2 11.2652 2 11Z"
              fill="white"
            />
          </svg>
        </div>

        <div className="flex flex-row items-center justify-between w-[89px] h-[12px] gap-[12px] ">
          <svg
            onClick={goPrev}
            className={`cursor-pointer ${
              currentIndex === 0 ? "opacity-40 pointer-events-none" : ""
            }`}
            width="4"
            height="7"
            viewBox="0 0 4 7"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.375 0.375C3.375 0.375 0.375 2.5845 0.375 3.375C0.375 4.1655 3.375 6.375 3.375 6.375"
              stroke="white"
              stroke-width="0.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span className="inter-regular text-[10px] text-[#FFFFFF]">
            {currentIndex + 1} / {totalCount}
          </span>

          <svg
            onClick={goNext}
            className={`cursor-pointer ${
              currentIndex === mails.length - 1
                ? "opacity-40 pointer-events-none"
                : ""
            }`}
            width="4"
            height="7"
            viewBox="0 0 4 7"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.375 0.375C0.375 0.375 3.375 2.5845 3.375 3.375C3.375 4.1655 0.375 6.375 0.375 6.375"
              stroke="white"
              stroke-width="0.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <div className="flex flex-row items-center justify-center w-[132px] h-[29px] gap-[18px] ">
          <button
            className="flex items-center justify-center w-[98px] h-[29px] rounded-[4px] border border-[#FFFFFF] inter-regular text-[10px] text-[#FFFFFF]"
            onClick={() => onToggleRead(mail.id)}
          >
            {mail.isRead ? "Mark as unread" : "Mark as read"}
          </button>
          <svg
            onClick={() => onToggleStar(mail.id)}
            className="cursor-pointer"
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.5469 1.69004L9.72024 4.05604C9.88024 4.38537 10.3069 4.70137 10.6669 4.76137L12.7929 5.11804C14.1529 5.34671 14.4729 6.34137 13.4929 7.32271L11.8396 8.98937C11.5596 9.27137 11.4062 9.81604 11.4929 10.206L11.9662 12.2694C12.3396 13.9027 11.4796 14.534 10.0462 13.6807L8.0529 12.4907C7.6929 12.276 7.09957 12.276 6.7329 12.4907L4.7409 13.6807C3.31424 14.534 2.44757 13.8954 2.8209 12.2694L3.29424 10.206C3.3809 9.81604 3.22757 9.27137 2.94757 8.98937L1.29424 7.32271C0.321571 6.34071 0.634904 5.34671 1.99424 5.11804L4.1209 4.76137C4.47424 4.70137 4.9009 4.38537 5.0609 4.05604L6.23424 1.69004C6.87424 0.406706 7.91424 0.406706 8.54757 1.69004"
              stroke={mail.is_favorite ? "#FFB800" : "white"}
              fill={mail.is_favorite ? "#FFB800" : "none"}
              stroke-width="1.45455"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      {/*Mail body */}
      {/* <div className="flex flex-col w-[900px] h-[630px] rounded-[4px] border border-[#EAEAEA] p-[30px] gap-[13px] bg-[#FFFFFF]"> */}
      <div className="relative w-[672px] flex-1 min-h-0 overflow-hidden mt-[10px] rounded-[6px] bg-white border border-[#EAEAEA]">
        <div className=/*"mx-auto w-full max-w-[612px]"*/ "h-full overflow-y-auto px-[30px] pt-[30px] pb-[200px] scrollbar-hide">
          {/*profilename and header */}
          <div className=" flex flex-col w-full max-w-[612px] gap-[26px]">
            <div className="flex flex-col w-[562px] h-[89px] gap-[26px]">
              <div className="flex flex-row  w-[159px] gap-[5px] h-[36px]">
                <img
                  src={profileimage}
                  alt="Profile"
                  className="w-[36px] h-[36px] rounded-full"
                />
                <div className="flex flex-col mt-[3px] w-[120px] h-[36px]">
                  <span className="inter-bold text-[10px]"> {selectedMailbox === "sent" ? `${mail.to}` : `${mail.from}`}</span>
                  <span className="inter-regular text-[10px]">{selectedMailbox === "sent" ? mail.to : mail.from} </span>
                </div>
              </div>
              <h1 className="inter-semibold text-[22px]">{mail.subject}</h1>
            </div>

            {/*mail content */}
            {/* <span className="inter-regular text-[11px] text-[#5E5E5E]">
              Hi John,
            </span>
            <span className="inter-regular text-[11px] text-[#5E5E5E]">
              I am writing on behalf of the Product Development Team to invite
              you to make a special appearance at our upcoming quarterly team
              meeting.
            </span>
            <span className="inter-regular text-[11px] text-[#5E5E5E]">
              {" "}
              The past few months have been tremendously successful for our
              team—we have not only met but exceeded our targets. This success
              is a direct result of the team’s dedication, collaboration, and
              exceptional workmanship.
            </span>
            <span className="inter-regular text-[11px] text-[#5E5E5E]">
              Since the meeting is scheduled for later this year, the exact date
              has not yet been finalized. I would greatly appreciate it if you
              could let me know your availability within the coming month so I
              can coordinate a date that works for both you and the team.
            </span>
            <span className="inter-regular text-[11px] text-[#5E5E5E]">
              Yours sincerely,
            </span>
            <span className="inter-regular text-[11px] text-[#5E5E5E]">
              Eric
            </span> */}
            <div className="inter-regular text-[11px] text-[#5E5E5E] whitespace-pre-line leading-[18px]">
              {/* {mail.body} */}
              {StripHtml(mail.body)}
            </div>
          </div>

          {/*Attachment bar */}
          <div className="flex flex-row justify-between w-full max-w-[612px] h-[23px]">
            <span className="inter-bold text-[14px] leading-[23px]">
              Attachments (3)
            </span>
            <span className="inter-regular text-[12px] leading-[23px] text-[#6231A5]">
              Download all
            </span>
          </div>

          {/*Attachment items */}
          <div className="flex flex-row w-[340px] h-[63px] gap-[12px]">
            {/* Attachment Item 1 */}
            <div className="flex flex-row items-center justify-center w-[164px] h-[63px] gap-[12px] rounded-[6px] border border-[#040B2308] bg-[#F0F1F8]">
              <img
                src={attachmentimage}
                alt="Attachment"
                className="w-[43px] h-[43px] rounded-[6px]"
              />
              <div className="flex flex-col gap-[0px]">
                <span className="inter-semibold text-[10px]">Payment Data</span>
                <span className="inter-regular text-[9px] text-[#7E7E7E]">
                  17kb
                </span>
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 9 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.33333 4.16667C8.33333 6.46792 6.46792 8.33333 4.16667 8.33333C1.86542 8.33333 0 6.46792 0 4.16667C0 1.86542 1.86542 0 4.16667 0C6.46792 0 8.33333 1.86542 8.33333 4.16667Z"
                    fill="#6A37F5"
                  />
                  <path
                    d="M5.83333 4.37533C5.83333 4.37533 4.60583 6.04199 4.16667 6.04199C3.7275 6.04199 2.5 4.37533 2.5 4.37533M4.16667 5.83366V2.29199"
                    stroke="white"
                    stroke-width="0.625"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>
            {/* Attachment Item 2 */}
            <div className="flex flex-row items-center justify-center w-[164px] h-[63px] gap-[12px] rounded-[6px] border border-[#040B2308] bg-[#F0F1F8]">
              <img
                src={attachmentimage1}
                alt="Attachment"
                className="w-[43px] h-[43px] rounded-[6px]"
              />
              <div className="flex flex-col gap-[0px]">
                <span className="inter-semibold text-[10px]">Payment Data</span>
                <span className="inter-regular text-[9px] text-[#7E7E7E]">
                  17kb
                </span>
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 9 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.33333 4.16667C8.33333 6.46792 6.46792 8.33333 4.16667 8.33333C1.86542 8.33333 0 6.46792 0 4.16667C0 1.86542 1.86542 0 4.16667 0C6.46792 0 8.33333 1.86542 8.33333 4.16667Z"
                    fill="#6A37F5"
                  />
                  <path
                    d="M5.83333 4.37533C5.83333 4.37533 4.60583 6.04199 4.16667 6.04199C3.7275 6.04199 2.5 4.37533 2.5 4.37533M4.16667 5.83366V2.29199"
                    stroke="white"
                    stroke-width="0.625"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div
          className="sticky top-[15px] bottom-[-5px] left-[28px] right-[30px] flex flex-col w-[614px] h-[152px] rounded-[6px] border border-[#EAEAEA] bg-[#FFFFFF] px-[20px] py-[12px] gap-[10px]"
          style={{ boxShadow: "0px -4px 22px 0px rgba(233, 231, 231, 0.48)" }}
        >
          <div className="mx-auto w-full max-w-[614px] flex flex-col gap-[10px]">
            <div className="text-[11px] text-[#7E7E7E] w-[558px] flex flex-col items-start justify-center gap-[12px]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.0041 9.58301C10.2251 9.58301 10.4371 9.67081 10.5933 9.82709C10.7496 9.98337 10.8374 10.1953 10.8374 10.4163C10.8374 10.6374 10.7496 10.8493 10.5933 11.0056C10.4371 11.1619 10.2251 11.2497 10.0041 11.2497C9.78307 11.2497 9.57111 11.1619 9.41483 11.0056C9.25855 10.8493 9.17076 10.6374 9.17076 10.4163C9.17076 10.1953 9.25855 9.98337 9.41483 9.82709C9.57111 9.67081 9.78307 9.58301 10.0041 9.58301ZM15.0041 9.58301C15.2251 9.58301 15.4371 9.67081 15.5933 9.82709C15.7496 9.98337 15.8374 10.1953 15.8374 10.4163C15.8374 10.6374 15.7496 10.8493 15.5933 11.0056C15.4371 11.1619 15.2251 11.2497 15.0041 11.2497C14.7831 11.2497 14.5711 11.1619 14.4148 11.0056C14.2586 10.8493 14.1708 10.6374 14.1708 10.4163C14.1708 10.1953 14.2586 9.98337 14.4148 9.82709C14.5711 9.67081 14.7831 9.58301 15.0041 9.58301ZM5.00326 9.58301C5.22427 9.58301 5.43623 9.67081 5.59251 9.82709C5.74879 9.98337 5.83659 10.1953 5.83659 10.4163C5.83659 10.6374 5.74879 10.8493 5.59251 11.0056C5.43623 11.1619 5.22427 11.2497 5.00326 11.2497C4.78224 11.2497 4.57028 11.1619 4.414 11.0056C4.25772 10.8493 4.16992 10.6374 4.16992 10.4163C4.16992 10.1953 4.25772 9.98337 4.414 9.82709C4.57028 9.67081 4.78224 9.58301 5.00326 9.58301Z"
                  stroke="black"
                  stroke-width="1.25"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div className="w-[558px] border radius-[6px] border-[#D9D9D9] px-[24px] py-[15px]">
                {/* <textarea placeholder=""></textarea> */}
                Click here to
                <span className="text-[#6231A5] cursor-pointer ml-1">
                  Reply
                </span>
                ,
                <span className="text-[#6231A5] cursor-pointer ml-1">
                  Reply all
                </span>{" "}
                or
                <span className="text-[#6231A5] cursor-pointer ml-1">
                  Forward
                </span>
              </div>
            </div>

            {/* <textarea
            placeholder="Type your message..."
            className="w-full h-[60px] resize-none outline-none border border-[#EAEAEA] rounded-[6px] px-[10px] py-[6px] text-[11px]"
          /> */}

            <div className="flex justify-between items-center">
              <div className="flex gap-[10px]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.9584 6.12533V5.83366C11.9584 3.63391 11.9584 2.53374 11.2747 1.85066C10.5911 1.16758 9.4915 1.16699 7.29175 1.16699H6.70842C4.50866 1.16699 3.4085 1.16699 2.72541 1.85066C2.04233 2.53433 2.04175 3.63391 2.04175 5.83366V8.45866C2.04175 10.3761 2.04175 11.3351 2.57141 11.9808C2.66864 12.099 2.77636 12.2068 2.89458 12.304C3.54091 12.8337 4.49875 12.8337 6.41675 12.8337M4.37508 4.08366H9.62508M4.37508 7.00033H7.87508"
                    stroke="#040B23"
                    stroke-width="0.875"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M11.9583 11.667V9.91699C11.9583 9.08283 11.1748 8.16699 10.2083 8.16699C9.24167 8.16699 8.45825 9.08283 8.45825 9.91699V11.9587C8.45825 12.1907 8.55044 12.4133 8.71453 12.5774C8.87863 12.7415 9.10119 12.8337 9.33325 12.8337C9.56532 12.8337 9.78788 12.7415 9.95197 12.5774C10.1161 12.4133 10.2083 12.1907 10.2083 11.9587V9.91699"
                    stroke="#040B23"
                    stroke-width="0.875"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.37488 5.25C4.85813 5.25 5.24988 4.85825 5.24988 4.375C5.24988 3.89175 4.85813 3.5 4.37488 3.5C3.89163 3.5 3.49988 3.89175 3.49988 4.375C3.49988 4.85825 3.89163 5.25 4.37488 5.25Z"
                    stroke="#040B23"
                    stroke-width="0.875"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M1.45825 6.99967C1.45825 4.38751 1.45825 3.08084 2.26967 2.26942C3.08109 1.45801 4.38717 1.45801 6.99992 1.45801C9.61209 1.45801 10.9188 1.45801 11.7302 2.26942C12.5416 3.08084 12.5416 4.38692 12.5416 6.99967C12.5416 9.61184 12.5416 10.9185 11.7302 11.7299C10.9188 12.5413 9.61267 12.5413 6.99992 12.5413C4.38775 12.5413 3.08109 12.5413 2.26967 11.7299C1.45825 10.9185 1.45825 9.61243 1.45825 6.99967Z"
                    stroke="#040B23"
                    stroke-width="0.875"
                  />
                  <path
                    d="M2.91675 12.2501C5.46708 9.20217 8.32658 5.18242 12.5406 7.89959"
                    stroke="#040B23"
                    stroke-width="0.875"
                  />
                </svg>
              </div>

              <button className="w-[70px] h-[28px] rounded-[14px] bg-[#6231A5] text-white text-[11px] cursor-pointer">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
