import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Make sure to import useNavigate
import Settings from "../../Settings/Settings";

const activityRows = [
  { browser: "This Device", ip: "192.149.122.128", time: "Now", Action: "Logout" },
  { browser: "Safari - Mac OS", ip: "192.149.122.128", time: "Nov 10, 2025 10:34 PM", Action: "Logout" },
  { browser: "Mozilla - Window", ip: "192.149.122.128", time: "Nov 10, 2025 10:34 PM", Action: "Logout" },
  { browser: "Chrome - Mac OS", ip: "192.149.122.128", time: "Nov 10, 2025 10:34 PM", Action: "Logout" },
  { browser: "Mozilla - Window", ip: "192.149.122.128", time: "Nov 10, 2025 10:34 PM", Action: "Logout" },
  { browser: "Chrome - Mac OS", ip: "192.149.122.128", time: "Nov 10, 2025 10:34 PM", Action: "Logout" },
  { browser: "Mozilla - Window", ip: "192.149.122.128", time: "Nov 10, 2025 10:34 PM", Action: "Logout" },
];

const ProfileDropdown = ({ profile, onClose }) => {
  const navigate = useNavigate(); // Make sure this is defined
  const [showSettings, setShowSettings] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [availableActive, setAvailableActive] = useState(false);
  const [activityActive, setActivityActive] = useState(false);
  const dropdownRef = useRef(null);
  const settingsPopupRef = useRef(null);
  const availableDropdownRef = useRef(null);
  const activityModalRef = useRef(null);

  // Handle click outside to close all dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      // Only close if click is outside BOTH dropdown and settings popup
      if (
        showSettings &&
        dropdownRef.current &&
        settingsPopupRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !settingsPopupRef.current.contains(event.target)
      ) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettings]);

  const handleAccountSettingsClick = () => {
    setShowSettings(true);
  };

  const handleLogoutClick = () => {
    setActivityActive(false);
    setShowActivity(false);
    setAvailableActive(false);
    if (onClose) onClose();
    navigate("/");
  };

  const handleLogoutAllDevices = () => {
    // Add your logout from all devices logic here
    console.log("Logout from all devices clicked");
  };

  const handleStatusSelect = (status) => {
    console.log("Selected status:", status);
    setAvailableActive(false);
  };

  return (
    <>
      {/* Settings Popup - FIXED: Added onClick handler to stop propagation */}
      {showSettings && (
        <div 
          className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50"
          onClick={(e) => e.stopPropagation()} // Prevent click from bubbling
        >
          <div 
            ref={settingsPopupRef}
            onClick={(e) => e.stopPropagation()} // Prevent click from bubbling
          >
            <Settings onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}

      {/* Profile Dropdown */}
      <div
        ref={dropdownRef}
        className="absolute right-0 mt-2 z-40 w-[250px] h-[226px] rounded-[32px] border border-[#D9D9D9] bg-white opacity-100 shadow-[0_7px_16px_0px_rgba(0,0,0,0.10),0_29px_29px_0px_rgba(0,0,0,0.09),0_65px_39px_0px_rgba(0,0,0,0.05),0_115px_46px_0px_rgba(0,0,0,0.01),0_180px_50px_0px_rgba(0,0,0,0)]"
      >
        <div className="p-4 text-black">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={profile.img}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="inter-medium text-[16px] leading-[20px]">{profile.name}</div>
              <div className="inter-medium text-[12px] leading-[20px]">{profile.email}</div>
            </div>
          </div>
          <hr style={{ borderColor: "#D9D9D9" }} />
          <div className="mt-4 gap-[0px] flex flex-col">
            {/* Available Status Dropdown */}
            <div className="flex items-center relative">
              <button
                className={`flex items-center justify-between text-left gap-[10px] py-2 px-3 rounded-[10px] w-full h-[34px] hover:w-full ${availableActive ? "bg-[#F4F4F4]" : "hover:bg-gray-100"}`}
                onClick={() => {
                  setAvailableActive(!availableActive);
                  setActivityActive(false);
                }}
              >
                <div className="flex flex-row items-center w-[120px] gap-[20px] whitespace-nowrap">
                  <div className="mr-2 w-[20px] h-[20px] flex items-center justify-center">
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.33334 0C6.68516 0 5.07399 0.488742 3.70358 1.40442C2.33318 2.3201 1.26507 3.62159 0.634341 5.1443C0.0036107 6.66702 -0.161417 8.34258 0.160126 9.95909C0.48167 11.5756 1.27534 13.0605 2.44078 14.2259C3.60622 15.3913 5.09108 16.185 6.70758 16.5065C8.32409 16.8281 9.99965 16.6631 11.5224 16.0323C13.0451 15.4016 14.3466 14.3335 15.2622 12.9631C16.1779 11.5927 16.6667 9.98151 16.6667 8.33333C16.6667 7.23898 16.4511 6.15535 16.0323 5.1443C15.6135 4.13326 14.9997 3.2146 14.2259 2.44078C13.4521 1.66696 12.5334 1.05313 11.5224 0.634337C10.5113 0.215548 9.42769 0 8.33334 0ZM11.9167 6.34167L8.10834 11.3417C8.03071 11.4425 7.93101 11.5242 7.81689 11.5806C7.70277 11.6369 7.57727 11.6664 7.45 11.6667C7.32343 11.6673 7.19836 11.6392 7.08429 11.5843C6.97022 11.5294 6.87015 11.4493 6.79167 11.35L4.75834 8.75833C4.69103 8.67188 4.64142 8.57302 4.61232 8.46739C4.58323 8.36176 4.57522 8.25144 4.58877 8.14271C4.60231 8.03399 4.63713 7.929 4.69125 7.83374C4.74537 7.73847 4.81772 7.6548 4.90417 7.5875C5.07877 7.45158 5.30022 7.39058 5.51979 7.41793C5.62851 7.43147 5.7335 7.4663 5.82877 7.52041C5.92403 7.57453 6.0077 7.64688 6.075 7.73333L7.43334 9.46667L10.5833 5.3C10.6501 5.21245 10.7334 5.13891 10.8286 5.08357C10.9238 5.02823 11.0289 4.99219 11.138 4.97748C11.2472 4.96278 11.3581 4.96971 11.4645 4.99788C11.5709 5.02605 11.6708 5.07491 11.7583 5.14167C11.8459 5.20842 11.9194 5.29177 11.9748 5.38694C12.0301 5.48212 12.0662 5.58727 12.0809 5.69637C12.0956 5.80548 12.0886 5.91642 12.0605 6.02285C12.0323 6.12928 11.9834 6.22912 11.9167 6.31667V6.34167Z" fill="#1EAF53"/>
                    </svg>
                  </div>
                  <span className="inter-regular text-[12px]">Available now</span>
                </div>
                <div className="w-[12px] h-[12px] flex items-center justify-center">
                  <svg width="4" height="7" viewBox="0 0 4 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.375 0.375C0.375 0.375 3.375 2.5845 3.375 3.375C3.375 4.1655 0.375 6.375 0.375 6.375" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
              {availableActive && (
                <div 
                  ref={availableDropdownRef}
                  className="absolute right-0 top-full mt-2 z-50 w-[191px] h-[220px] rounded-[32px] bg-white opacity-100"
                  style={{
                    boxShadow: `0px 6px 14px 0px #0000001A, 0px 25px 25px 0px #00000017, 0px 57px 34px 0px #0000000D, 0px 101px 40px 0px #00000003, 0px 158px 44px 0px #00000000`
                  }}
                >
                  <div className="flex flex-col w-full h-full p-5 gap-3">
                    <button 
                      className="flex flex-row items-center w-full h-[17px] px-[5px] py-[2px] gap-[25px] hover:bg-gray-100 rounded"
                      onClick={() => handleStatusSelect("Available")}
                    >
                      <div className="w-[20px] h-[20px] flex items-center justify-center">
                        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.33334 0C6.68516 0 5.07399 0.488742 3.70358 1.40442C2.33318 2.3201 1.26507 3.62159 0.634341 5.1443C0.0036107 6.66702 -0.161417 8.34258 0.160126 9.95909C0.48167 11.5756 1.27534 13.0605 2.44078 14.2259C3.60622 15.3913 5.09108 16.185 6.70758 16.5065C8.32409 16.8281 9.99965 16.6631 11.5224 16.0323C13.0451 15.4016 14.3466 14.3335 15.2622 12.9631C16.1779 11.5927 16.6667 9.98151 16.6667 8.33333C16.6667 7.23898 16.4511 6.15535 16.0323 5.1443C15.6135 4.13326 14.9997 3.2146 14.2259 2.44078C13.4521 1.66696 12.5334 1.05313 11.5224 0.634337C10.5113 0.215548 9.42769 0 8.33334 0ZM11.9167 6.34167L8.10834 11.3417C8.03071 11.4425 7.93101 11.5242 7.81689 11.5806C7.70277 11.6369 7.57727 11.6664 7.45 11.6667C7.32343 11.6673 7.19836 11.6392 7.08429 11.5843C6.97022 11.5294 6.87015 11.4493 6.79167 11.35L4.75834 8.75833C4.69103 8.67188 4.64142 8.57302 4.61232 8.46739C4.58323 8.36176 4.57522 8.25144 4.58877 8.14271C4.60231 8.03399 4.63713 7.929 4.69125 7.83374C4.74537 7.73847 4.81772 7.6548 4.90417 7.5875C5.07877 7.45158 5.30022 7.39058 5.51979 7.41793C5.62851 7.43147 5.7335 7.4663 5.82877 7.52041C5.92403 7.57453 6.0077 7.64688 6.075 7.73333L7.43334 9.46667L10.5833 5.3C10.6501 5.21245 10.7334 5.13891 10.8286 5.08357C10.9238 5.02823 11.0289 4.99219 11.138 4.97748C11.2472 4.96278 11.3581 4.96971 11.4645 4.99788C11.5709 5.02605 11.6708 5.07491 11.7583 5.14167C11.8459 5.20842 11.9194 5.29177 11.9748 5.38694C12.0301 5.48212 12.0662 5.58727 12.0809 5.69637C12.0956 5.80548 12.0886 5.91642 12.0605 6.02285C12.0323 6.12928 11.9834 6.22912 11.9167 6.31667V6.34167Z" fill="#1EAF53"/>
                        </svg>
                      </div>
                      <span className="inter-regular text-[12px]">Available</span>
                    </button>
                    <button 
                      className="flex flex-row items-center w-full h-[17px] px-[5px] py-[2px] gap-[25px] hover:bg-gray-100 rounded"
                      onClick={() => handleStatusSelect("Busy")}
                    >
                      <div className="w-[20px] h-[20px]  flex items-center justify-center">
                        <div className="w-[16.67px] h-[16.67px] rounded-full bg-[#FC3737]"></div>
                      </div>
                      <span className="inter-regular text-[12px]">Busy</span>
                    </button>
                    <button 
                      className="flex flex-row items-center w-full h-[17px] px-[5px] py-[2px] gap-[25px] hover:bg-gray-100 rounded"
                      onClick={() => handleStatusSelect("Do not Disturb")}
                    >
                      <div className="w-[20px] h-[20px] flex items-center justify-center">
                        <div className="w-[16.67px] h-[16.67px] rounded-full bg-[#FC3737] flex items-center justify-center">
                          <div className="w-[7px] h-0 border-t border-[1px] border-white opacity-100"></div>
                        </div>
                      </div>
                      <span className="inter-regular text-[12px]">Do not Disturb</span>
                    </button>
                    <button 
                      className="flex flex-row items-center w-full h-[17px] px-[5px] py-[2px] gap-[25px] hover:bg-gray-100 rounded"
                      onClick={() => handleStatusSelect("Be right back")}
                    >
                      <div className="w-[20px] h-[20px] flex items-center justify-center">
                        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.33334 0C6.68516 0 5.07399 0.488742 3.70358 1.40442C2.33318 2.3201 1.26507 3.62159 0.634341 5.1443C0.0036107 6.66702 -0.161417 8.34258 0.160126 9.95909C0.48167 11.5756 1.27534 13.0605 2.44078 14.2259C3.60622 15.3913 5.09108 16.185 6.70758 16.5065C8.32409 16.8281 9.99965 16.6631 11.5224 16.0323C13.0451 15.4016 14.3466 14.3335 15.2622 12.9631C16.1779 11.5927 16.6667 9.98151 16.6667 8.33333C16.6667 7.23898 16.4511 6.15535 16.0323 5.1443C15.6135 4.13326 14.9997 3.2146 14.2259 2.44078C13.4521 1.66696 12.5334 1.05313 11.5224 0.634337C10.5113 0.215548 9.42769 0 8.33334 0ZM11.6667 9.16667H8.33334C8.11232 9.16667 7.90036 9.07887 7.74408 8.92259C7.5878 8.76631 7.5 8.55435 7.5 8.33333V5C7.5 4.77899 7.5878 4.56703 7.74408 4.41074C7.90036 4.25446 8.11232 4.16667 8.33334 4.16667C8.55435 4.16667 8.76631 4.25446 8.92259 4.41074C9.07887 4.56703 9.16667 4.77899 9.16667 5V7.5H11.6667C11.8877 7.5 12.0996 7.5878 12.2559 7.74408C12.4122 7.90036 12.5 8.11232 12.5 8.33333C12.5 8.55435 12.4122 8.76631 12.2559 8.92259C12.0996 9.07887 11.8877 9.16667 11.6667 9.16667Z" fill="#F89F00"/>
                        </svg>
                      </div>
                      <span className="inter-regular text-[12px]">Appear away</span>
                    </button>
                    <button 
                      className="flex flex-row items-center w-full h-[17px] px-[5px] py-[2px] gap-[25px] hover:bg-gray-100 rounded"
                      onClick={() => handleStatusSelect("Offline")}
                    >
                      <div className="w-[20px] h-[20px] flex items-center justify-center relative">
                        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.33334 0C6.68516 0 5.07399 0.488742 3.70358 1.40442C2.33318 2.3201 1.26507 3.62159 0.634341 5.1443C0.0036107 6.66702 -0.161417 8.34258 0.160126 9.95909C0.48167 11.5756 1.27534 13.0605 2.44078 14.2259C3.60622 15.3913 5.09108 16.185 6.70758 16.5065C8.32409 16.8281 9.99965 16.6631 11.5224 16.0323C13.0451 15.4016 14.3466 14.3335 15.2622 12.9631C16.1779 11.5927 16.6667 9.98151 16.6667 8.33333C16.6667 7.23898 16.4511 6.15535 16.0323 5.1443C15.6135 4.13326 14.9997 3.2146 14.2259 2.44078C13.4521 1.66696 12.5334 1.05313 11.5224 0.634337C10.5113 0.215548 9.42769 0 8.33334 0ZM8.33334 15C7.0148 15 5.72586 14.609 4.62954 13.8765C3.53321 13.1439 2.67872 12.1027 2.17414 10.8846C1.66956 9.66638 1.53753 8.32594 1.79477 7.03273C2.052 5.73952 2.68694 4.55164 3.61929 3.61929C4.55164 2.68694 5.73953 2.052 7.03274 1.79477C8.32594 1.53753 9.66639 1.66955 10.8846 2.17414C12.1027 2.67872 13.1439 3.5332 13.8765 4.62953C14.609 5.72586 15 7.01479 15 8.33333C15 10.1014 14.2976 11.7971 13.0474 13.0474C11.7971 14.2976 10.1014 15 8.33334 15Z" fill="#8A8A8A"/>
                        </svg>
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                          <svg width="5" height="5" viewBox="0 0 5 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.76317 0.246499C4.6857 0.168392 4.59353 0.106397 4.49198 0.0640893C4.39043 0.0217821 4.28151 0 4.1715 0C4.06149 0 3.95257 0.0217821 3.85102 0.0640893C3.74947 0.106397 3.6573 0.168392 3.57983 0.246499L2.50483 1.32983L1.42983 0.246499C1.27291 0.0895788 1.06008 0.00142256 0.838165 0.00142256C0.616247 0.00142256 0.403418 0.0895788 0.246499 0.246499C0.0895788 0.403418 0.00142256 0.616247 0.00142256 0.838165C0.00142256 1.06008 0.0895788 1.27291 0.246499 1.42983L1.32983 2.50483L0.246499 3.57983C0.168392 3.6573 0.106397 3.74947 0.0640893 3.85102C0.0217821 3.95257 0 4.06149 0 4.1715C0 4.28151 0.0217821 4.39043 0.0640893 4.49198C0.106397 4.59353 0.168392 4.6857 0.246499 4.76317C0.323968 4.84127 0.416135 4.90327 0.517685 4.94557C0.619234 4.98788 0.728155 5.00966 0.838165 5.00966C0.948175 5.00966 1.0571 4.98788 1.15865 4.94557C1.2602 4.90327 1.35236 4.84127 1.42983 4.76317L2.50483 3.67983L3.57983 4.76317C3.6573 4.84127 3.74947 4.90327 3.85102 4.94557C3.95257 4.98788 4.06149 5.00966 4.1715 5.00966C4.28151 5.00966 4.39043 4.98788 4.49198 4.94557C4.59353 4.90327 4.6857 4.84127 4.76317 4.76317C4.84127 4.6857 4.90327 4.59353 4.94557 4.49198C4.98788 4.39043 5.00966 4.28151 5.00966 4.1715C5.00966 4.06149 4.98788 3.95257 4.94557 3.85102C4.90327 3.74947 4.84127 3.6573 4.76317 3.57983L3.67983 2.50483L4.76317 1.42983C4.84127 1.35236 4.90327 1.2602 4.94557 1.15865C4.98788 1.0571 5.00966 0.948175 5.00966 0.838165C5.00966 0.728155 4.98788 0.619234 4.94557 0.517685C4.90327 0.416135 4.84127 0.323968 4.76317 0.246499Z" fill="#8A8A8A"/>
                          </svg>
                        </span>
                      </div>
                      <span className="inter-regular text-[12px]">Offline</span>
                    </button>
                    <button 
                      className="flex flex-row items-center w-full h-[17px] px-[5px] py-[2px] gap-[25px] hover:bg-gray-100 rounded"
                      onClick={() => handleStatusSelect("Be right back")}
                    >
                      <div className="w-[20px] h-[20px] flex items-center justify-center">
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14.825 6.95L12.0417 1.38334C11.8338 0.966966 11.5139 0.61688 11.1178 0.372485C10.7218 0.128091 10.2654 -0.000909752 9.80001 4.82952e-06H5.20001C4.73464 -0.000909752 4.27825 0.128091 3.88221 0.372485C3.48617 0.61688 3.16621 0.966966 2.95835 1.38334L0.175013 6.95C0.0589264 7.18291 -0.00100693 7.43977 1.27975e-05 7.7V12.5C1.27975e-05 13.163 0.263405 13.7989 0.732246 14.2678C1.20109 14.7366 1.83697 15 2.50001 15H12.5C13.1631 15 13.7989 14.7366 14.2678 14.2678C14.7366 13.7989 15 13.163 15 12.5V7.7C15.001 7.43977 14.9411 7.18291 14.825 6.95ZM4.45001 2.125C4.5199 1.98631 4.62715 1.8699 4.75967 1.78892C4.89219 1.70793 5.04471 1.66559 5.20001 1.66667H9.80001C9.95532 1.66559 10.1078 1.70793 10.2404 1.78892C10.3729 1.8699 10.4801 1.98631 10.55 2.125L12.8167 6.66667H10.8333C10.6123 6.66667 10.4004 6.75447 10.2441 6.91075C10.0878 7.06703 10 7.27899 10 7.5V10H5.00001V7.5C5.00001 7.27899 4.91222 7.06703 4.75594 6.91075C4.59965 6.75447 4.38769 6.66667 4.16668 6.66667H2.18335L4.45001 2.125ZM12.5 13.3333H2.50001C2.279 13.3333 2.06704 13.2455 1.91076 13.0893C1.75448 12.933 1.66668 12.721 1.66668 12.5V8.33334H3.33335V10.8333C3.33335 11.0544 3.42114 11.2663 3.57742 11.4226C3.7337 11.5789 3.94567 11.6667 4.16668 11.6667H10.8333C11.0544 11.6667 11.2663 11.5789 11.4226 11.4226C11.5789 11.2663 11.6667 11.0544 11.6667 10.8333V8.33334H13.3333V12.5C13.3333 12.721 13.2456 12.933 13.0893 13.0893C12.933 13.2455 12.721 13.3333 12.5 13.3333Z" fill="#FC3737"/>
                        </svg>
                      </div>
                      <span className="inter-regular text-[12px]">Out of office</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Account Activity Button */}
            <button
              className={`flex items-center justify-between text-left gap-[10px] py-2 px-3 rounded w-full h-[34px] hover:w-full ${activityActive ? "bg-[#C4C4C480]" : "hover:bg-gray-100"}`}
              onClick={() => {
                setActivityActive(true);
                setAvailableActive(false);
                setShowActivity(true);
              }}
            >
              <div className="flex flex-row items-center w-[140px] gap-[20px] whitespace-nowrap">
                <div className="mr-2 w-[20px] h-[20px] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.0417 16.4583C12.2042 16.4583 12.785 16.4583 13.2642 16.3433C14.0115 16.164 14.6946 15.7814 15.238 15.238C15.7814 14.6946 16.164 14.0115 16.3433 13.2642C16.4583 12.785 16.4583 12.2042 16.4583 11.0417M6.04167 16.4583C4.87917 16.4583 4.29833 16.4583 3.81917 16.3433C3.07187 16.164 2.38875 15.7814 1.84532 15.238C1.3019 14.6946 0.91936 14.0115 0.74 13.2642C0.625 12.785 0.625 12.2042 0.625 11.0417M6.04167 0.625C4.87917 0.625 4.29833 0.625 3.81917 0.74C3.07187 0.91936 2.38875 1.3019 1.84532 1.84532C1.3019 2.38875 0.91936 3.07187 0.74 3.81917C0.625 4.29833 0.625 4.88 0.625 6.04167M11.0417 0.625C12.2042 0.625 12.785 0.625 13.2642 0.74C14.0115 0.91936 14.6946 1.3019 15.238 1.84532C15.7814 2.38875 16.164 3.07187 16.3433 3.81917C16.4583 4.29833 16.4583 4.88 16.4583 6.04167M11.0417 6.45833C11.0417 5.79529 10.7783 5.15941 10.3094 4.69057C9.84059 4.22173 9.20471 3.95833 8.54167 3.95833C7.87863 3.95833 7.24274 4.22173 6.7739 4.69057C6.30506 5.15941 6.04167 5.79529 6.04167 6.45833C6.04167 7.12137 6.30506 7.75726 6.7739 8.2261C7.24274 8.69494 7.87863 8.95833 8.54167 8.95833C9.20471 8.95833 9.84059 8.69494 10.3094 8.2261C10.7783 7.75726 11.0417 7.12137 11.0417 6.45833Z" stroke="black" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12.7083 13.1237C12.7083 12.0186 12.2693 10.9588 11.4879 10.1774C10.7065 9.39602 9.64674 8.95703 8.54167 8.95703C7.4366 8.95703 6.37679 9.39602 5.59539 10.1774C4.81399 10.9588 4.375 12.0186 4.375 13.1237" stroke="black" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="inter-regular text-[12px]">Account Activities</span>
              </div>
              <div className="w-[12px] h-[12px] flex items-center justify-center">
                <svg width="4" height="7" viewBox="0 0 4 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.375 0.375C0.375 0.375 3.375 2.5845 3.375 3.375C3.375 4.1655 0.375 6.375 0.375 6.375" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            <hr className="border-t border-[#D9D9D9] mt-2" />
          </div>

          <div className="flex flex-row w-[218px] h-[32px] mt-3">
            <button 
              className="w-[104px] h-[32px] rounded-[32px] bg-[#040B23]"
              onClick={handleAccountSettingsClick}
            >
              <span className="inter-regular text-[12px] text-white">Settings</span>
            </button>
            <button 
              className="w-[104px] h-[32px] flex items-center justify-center"
              onClick={handleLogoutClick}
            >
              <div className="flex flex-row w-[64px] h-[20px] gap-[10px]">
                <div className="w-[16px] h-[16px] flex items-center justify-center">
                  <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.16667 3.85992C9.13933 3.08659 9.048 2.60326 8.74267 2.22459C8.30733 1.68326 7.56267 1.51392 6.07333 1.17392L5.40667 1.02192C3.14333 0.505924 2.012 0.247924 1.256 0.841924C0.5 1.43659 0.5 2.58392 0.5 4.87859V8.12126C0.5 10.4159 0.5 11.5639 1.256 12.1579C2.012 12.7519 3.14267 12.4939 5.406 11.9779L6.074 11.8259C7.56267 11.4859 8.30733 11.3166 8.74267 10.7753C9.048 10.3973 9.13933 9.91326 9.16667 9.13992M11.1667 4.50792C11.1667 4.50792 13.1667 5.98126 13.1667 6.50792C13.1667 7.03459 11.1667 8.50792 11.1667 8.50792M12.8333 6.50792H4.5" stroke="#FC3737" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="inter-regular text-[12px] text-[#FC3737]">Logout</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Account Activity Modal */}
      {showActivity && (
        <div 
          ref={activityModalRef}
          className="fixed top-[350px] right-[40px] z-50" 
          style={{ transform: "translate(-50%, -50%)" }}
          onClick={(e) => e.stopPropagation()} // Prevent click from closing
        >
          <div className="w-[714px] h-[499px] bg-white rounded-[20px] p-[20px] opacity-100 shadow-lg flex flex-col">
            <div className="flex flex-col w-full h-[63px] gap-[10px] px-[12px] py-[4px]">
              <span className="inter-bold text-[18px] text-black text-left">Activity Logs</span>
              <span className="inter-medium text-[12px] text-black text-left">Recent account login activities</span>
            </div>
            <div className="flex flex-col w-full h-full px-[10px] py-[10px] gap-[0px] items-center justify-center">
              <div className="w-[654px] h-[330px] gap-[5px] overflow-auto">
                <div className="overflow-hidden">
                  <table className="min-w-full table-fixed">
                    <thead>
                      <tr className="w-full h-[40px] bg-[#040B23]">
                        <th className="w-1/3 py-2 px-4 inter-regular text-[12px] text-white h-[19px] text-start">Browser</th>
                        <th className="w-1/3 py-2 px-4 inter-regular text-[12px] text-white h-[19px] text-start">IP address</th>
                        <th className="w-1/3 py-2 px-4 inter-regular text-[12px] text-white h-[19px] text-start">Time</th>
                        <th className="w-1/3 py-2 px-4 inter-regular text-[12px] text-white h-[19px] text-start">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityRows.map((row, idx) => (
                        <tr key={idx} className="h-[26px] text-left">
                          <td className="py-0 px-4 inter-regular text-[14px] text-black h-[40px] align-middle text-start whitespace-nowrap">{row.browser}</td>
                          <td className="py-0 px-4 inter-regular text-[14px] text-black h-[40px] align-middle text-start whitespace-nowrap">{row.ip}</td>
                          <td className="py-0 px-4 inter-regular text-[14px] text-black h-[40px] align-middle text-start whitespace-nowrap">{row.time}</td>
                          <td className="py-0 px-4 inter-regular text-[14px] text-black h-[40px] align-middle text-start whitespace-nowrap">{row.Action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <button 
                className="w-[164px] h-[30px] rounded-[8px] bg-[#FFE5E5] mt-3 flex items-center justify-center"
                onClick={handleLogoutAllDevices}
              >
                <span className="inter-regular text-[12px] text-[#F70027]">Logout from all devices</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileDropdown;