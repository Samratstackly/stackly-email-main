import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "./Card";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { AuthCardLayout } from "../../../layouts/AuthCardLayout";

function ForgotnewPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (pwd) => {
    // At least 11 chars, max 20, 1 uppercase, 1 number, 1 special char
    if (pwd.length < 11) return false;
    if (pwd.length > 20) return false;
    if (!/[A-Z]/.test(pwd)) return false;
    if (!/[0-9]/.test(pwd)) return false;
    if (!/[^A-Za-z0-9]/.test(pwd)) return false;
    return true;
  };

  const getPasswordError = (pwd) => {
    if (!pwd) return "Enter your password";
    if (pwd.length < 6 || pwd.length > 18)
      return "Password must be 6–18 characters and include one uppercase letter, one lowercase letter, one number, and one special character.";
    if (!/[A-Z]/.test(pwd))
      return "Password must contain at least 1 uppercase letter.";
    if (!/[a-z]/.test(pwd))
      return "Password must contain at least 1 lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least 1 number.";
    if (!/[^A-Za-z0-9]/.test(pwd))
      return "Password must contain at least 1 special character.";
    return "";
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    const pwdError = getPasswordError(password);
    if (!password) {
      setError("Please enter the password.");
      return;
    }
    if (pwdError) {
      setError(pwdError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    navigate("/done-reset");
  };

  return (
    // <div className="flex flex-row items-center justify-center w-full max-w-[1440px] h-[832px] gap-[180px] min-h-screen bg-[#FFFFFF] overflow-hidden">
    //   <div className="relative w-[598px] h-[748px]">
    //     <Card />
    //   </div>
    <AuthLayout
      left={<AuthCardLayout variant="forgotPassword" isVisible={true} />}
    >
      <div className="flex flex-col w-[500px] h-[700px] gap-[30px] ">
        <div className="flex flex-col w-[394px] h-[120px] gap-[20px]">
          <h1 className="text-[28px] inter-bold">Enter password</h1>
          <p className="text-[12px] leading-[24px] inter-regular">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col w-[362px] gap-[10px]">
            <p className="text-[12px] inter-semibold">Password</p>
            <div className="relative w-[362px] h-[72px] mt-[0px]">
              <span className="absolute left-[18px] top-1/2 transform -translate-y-1/2 flex items-center cursor-pointer z-10">
                {/* Password icon SVG here */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.55683 15.7045C3.74433 17.0961 4.89683 18.187 6.30016 18.2511C7.48016 18.3053 8.67933 18.3336 10.0002 18.3336C11.321 18.3336 12.5202 18.3053 13.7002 18.2503C15.1035 18.187 16.256 17.0961 16.4435 15.7045C16.566 14.7961 16.6668 13.8653 16.6668 12.917C16.6668 11.9686 16.566 11.0378 16.4435 10.1295C16.256 8.73779 15.1035 7.64696 13.7002 7.58279C12.4676 7.52646 11.234 7.49895 10.0002 7.50029C8.67933 7.50029 7.48016 7.52862 6.30016 7.58362C4.89683 7.64696 3.74433 8.73779 3.55683 10.1295C3.4335 11.0378 3.3335 11.9686 3.3335 12.917C3.3335 13.8653 3.43433 14.7961 3.55683 15.7045Z"
                    stroke="black"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M6.25 7.50008V5.41675C6.25 4.42219 6.64509 3.46836 7.34835 2.7651C8.05161 2.06184 9.00544 1.66675 10 1.66675C10.9946 1.66675 11.9484 2.06184 12.6516 2.7651C13.3549 3.46836 13.75 4.42219 13.75 5.41675V7.50008"
                    stroke="black"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.3334 12.9087V12.917M10.0001 12.9087V12.917M6.66675 12.9087V12.917"
                    stroke="black"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                type="password"
                className="w-full h-full rounded-[16px] border border-[#F7F7F9] bg-[#F4F4F4] opacity-100 px-[48px] text-[16px] pr-[26px]"
                style={{ gap: "10px" }}
                placeholder="Enter new password"
                value={password}
                maxLength={20}
                onChange={(e) => {
                  setPassword(e.target.value.slice(0, 20));
                  if (error && error.toLowerCase().includes("password"))
                    setError("");
                }}
              />
            </div>
            {/* Password validation hints */}
            {(password || error === "Please enter the password.") && (
              <div className="text-[10px] mt-[0px] inter-regular text-[#8E8E8E] space-y-1">
                {/* At least 1 uppercase */}
                {(!/[A-Z]/.test(password) ||
                  error === "Please enter the password.") && (
                  <div className="flex items-center gap-1">
                    {/* SVG */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_822_1235)">
                        <path
                          d="M10.0003 1.66663C8.35215 1.66663 6.74099 2.15537 5.37058 3.07105C4.00017 3.98672 2.93206 5.28821 2.30133 6.81093C1.6706 8.33365 1.50558 10.0092 1.82712 11.6257C2.14866 13.2422 2.94234 14.7271 4.10777 15.8925C5.27321 17.058 6.75807 17.8516 8.37458 18.1732C9.99109 18.4947 11.6666 18.3297 13.1894 17.699C14.7121 17.0682 16.0136 16.0001 16.9292 14.6297C17.8449 13.2593 18.3337 11.6481 18.3337 9.99996C18.3337 8.90561 18.1181 7.82198 17.6993 6.81093C17.2805 5.79988 16.6667 4.88122 15.8929 4.1074C15.1191 3.33358 14.2004 2.71975 13.1894 2.30096C12.1783 1.88217 11.0947 1.66663 10.0003 1.66663ZM13.5837 8.00829L9.77533 13.0083C9.6977 13.1091 9.598 13.1909 9.48388 13.2472C9.36977 13.3035 9.24426 13.333 9.117 13.3333C8.99042 13.334 8.86535 13.3058 8.75128 13.2509C8.63721 13.1961 8.53714 13.1159 8.45866 13.0166L6.42533 10.425C6.35803 10.3385 6.30841 10.2396 6.27932 10.134C6.25022 10.0284 6.24222 9.91806 6.25576 9.80934C6.2693 9.70062 6.30412 9.59563 6.35824 9.50036C6.41236 9.4051 6.48471 9.32143 6.57116 9.25413C6.74576 9.1182 6.96721 9.05721 7.18678 9.08456C7.2955 9.0981 7.40049 9.13292 7.49576 9.18704C7.59102 9.24116 7.67469 9.31351 7.742 9.39996L9.10033 11.1333L12.2503 6.96663C12.3171 6.87908 12.4004 6.80554 12.4956 6.7502C12.5908 6.69486 12.6959 6.65881 12.805 6.64411C12.9141 6.62941 13.0251 6.63634 13.1315 6.66451C13.2379 6.69268 13.3378 6.74154 13.4253 6.80829C13.5129 6.87505 13.5864 6.95839 13.6418 7.05357C13.6971 7.14875 13.7331 7.25389 13.7478 7.363C13.7625 7.47211 13.7556 7.58305 13.7274 7.68948C13.6993 7.79591 13.6504 7.89574 13.5837 7.98329V8.00829Z"
                          fill="#008981"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_822_1235">
                          <rect width="20" height="20" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    At least 1 uppercase
                  </div>
                )}
                {/* At least 1 number */}
                {(!/[0-9]/.test(password) ||
                  error === "Please enter the password.") && (
                  <div className="flex items-center gap-1">
                    {/* SVG */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.0003 1.66663C8.35215 1.66663 6.74099 2.15537 5.37058 3.07105C4.00017 3.98672 2.93206 5.28821 2.30133 6.81093C1.6706 8.33365 1.50558 10.0092 1.82712 11.6257C2.14866 13.2422 2.94234 14.7271 4.10777 15.8925C5.27321 17.058 6.75807 17.8516 8.37458 18.1732C9.99109 18.4947 11.6666 18.3297 13.1894 17.699C14.7121 17.0682 16.0136 16.0001 16.9292 14.6297C17.8449 13.2593 18.3337 11.6481 18.3337 9.99996C18.3337 8.90561 18.1181 7.82198 17.6993 6.81093C17.2805 5.79988 16.6667 4.88122 15.8929 4.1074C15.1191 3.33358 14.2004 2.71975 13.1894 2.30096C12.1783 1.88217 11.0947 1.66663 10.0003 1.66663ZM12.2587 11.075C12.3368 11.1524 12.3988 11.2446 12.4411 11.3461C12.4834 11.4477 12.5052 11.5566 12.5052 11.6666C12.5052 11.7766 12.4834 11.8856 12.4411 11.9871C12.3988 12.0887 12.3368 12.1808 12.2587 12.2583C12.1812 12.3364 12.089 12.3984 11.9875 12.4407C11.8859 12.483 11.777 12.5048 11.667 12.5048C11.557 12.5048 11.4481 12.483 11.3465 12.4407C11.245 12.3984 11.1528 12.3364 11.0753 12.2583L10.0003 11.175L8.92533 12.2583C8.84786 12.3364 8.75569 12.3984 8.65414 12.4407C8.55259 12.483 8.44367 12.5048 8.33366 12.5048C8.22365 12.5048 8.11473 12.483 8.01318 12.4407C7.91163 12.3984 7.81946 12.3364 7.742 12.2583C7.66389 12.1808 7.60189 12.0887 7.55959 11.9871C7.51728 11.8856 7.4955 11.7766 7.4955 11.6666C7.4955 11.5566 7.51728 11.4477 7.55959 11.3461C7.60189 11.2446 7.66389 11.1524 7.742 11.075L8.82533 9.99996L7.742 8.92496C7.58508 8.76804 7.49692 8.55521 7.49692 8.33329C7.49692 8.11137 7.58508 7.89855 7.742 7.74163C7.89892 7.58471 8.11174 7.49655 8.33366 7.49655C8.55558 7.49655 8.76841 7.58471 8.92533 7.74163L10.0003 8.82496L11.0753 7.74163C11.2322 7.58471 11.4451 7.49655 11.667 7.49655C11.8889 7.49655 12.1017 7.58471 12.2587 7.74163C12.4156 7.89855 12.5037 8.11137 12.5037 8.33329C12.5037 8.55521 12.4156 8.76804 12.2587 8.92496L11.1753 9.99996L12.2587 11.075Z"
                        fill="black"
                      />
                    </svg>
                    At least 1 number
                  </div>
                )}
                {/* At least 6-18 characters */}
                {(password.length < 6 || password.length > 18 ||
                  error === "Please enter the password.") && (
                  <div className="flex items-center gap-1">
                    {/* SVG */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.0003 1.66663C8.35215 1.66663 6.74099 2.15537 5.37058 3.07105C4.00017 3.98672 2.93206 5.28821 2.30133 6.81093C1.6706 8.33365 1.50558 10.0092 1.82712 11.6257C2.14866 13.2422 2.94234 14.7271 4.10777 15.8925C5.27321 17.058 6.75807 17.8516 8.37458 18.1732C9.99109 18.4947 11.6666 18.3297 13.1894 17.699C14.7121 17.0682 16.0136 16.0001 16.9292 14.6297C17.8449 13.2593 18.3337 11.6481 18.3337 9.99996C18.3337 8.90561 18.1181 7.82198 17.6993 6.81093C17.2805 5.79988 16.6667 4.88122 15.8929 4.1074C15.1191 3.33358 14.2004 2.71975 13.1894 2.30096C12.1783 1.88217 11.0947 1.66663 10.0003 1.66663ZM12.2587 11.075C12.3368 11.1524 12.3988 11.2446 12.4411 11.3461C12.4834 11.4477 12.5052 11.5566 12.5052 11.6666C12.5052 11.7766 12.4834 11.8856 12.4411 11.9871C12.3988 12.0887 12.3368 12.1808 12.2587 12.2583C12.1812 12.3364 12.089 12.3984 11.9875 12.4407C11.8859 12.483 11.777 12.5048 11.667 12.5048C11.557 12.5048 11.4481 12.483 11.3465 12.4407C11.245 12.3984 11.1528 12.3364 11.0753 12.2583L10.0003 11.175L8.92533 12.2583C8.84786 12.3364 8.75569 12.3984 8.65414 12.4407C8.55259 12.483 8.44367 12.5048 8.33366 12.5048C8.22365 12.5048 8.11473 12.483 8.01318 12.4407C7.91163 12.3984 7.81946 12.3364 7.742 12.2583C7.66389 12.1808 7.60189 12.0887 7.55959 11.9871C7.51728 11.8856 7.4955 11.7766 7.4955 11.6666C7.4955 11.5566 7.51728 11.4477 7.55959 11.3461C7.60189 11.2446 7.66389 11.1524 7.742 11.075L8.82533 9.99996L7.742 8.92496C7.58508 8.76804 7.49692 8.55521 7.49692 8.33329C7.49692 8.11137 7.58508 7.89855 7.742 7.74163C7.89892 7.58471 8.11174 7.49655 8.33366 7.49655C8.55558 7.49655 8.76841 7.58471 8.92533 7.74163L10.0003 8.82496L11.0753 7.74163C11.2322 7.58471 11.4451 7.49655 11.667 7.49655C11.8889 7.49655 12.1017 7.58471 12.2587 7.74163C12.4156 7.89855 12.5037 8.11137 12.5037 8.33329C12.5037 8.55521 12.4156 8.76804 12.2587 8.92496L11.1753 9.99996L12.2587 11.075Z"
                        fill="black"
                      />
                    </svg>
                    At least 6-18 characters
                  </div>
                )}
                {/* At least 1 special character */}
                {(!/[^A-Za-z0-9]/.test(password) ||
                  error === "Please enter the password.") && (
                  <div className="flex items-center gap-1">
                    {/*  SVG */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.0003 1.66663C8.35215 1.66663 6.74099 2.15537 5.37058 3.07105C4.00017 3.98672 2.93206 5.28821 2.30133 6.81093C1.6706 8.33365 1.50558 10.0092 1.82712 11.6257C2.14866 13.2422 2.94234 14.7271 4.10777 15.8925C5.27321 17.058 6.75807 17.8516 8.37458 18.1732C9.99109 18.4947 11.6666 18.3297 13.1894 17.699C14.7121 17.0682 16.0136 16.0001 16.9292 14.6297C17.8449 13.2593 18.3337 11.6481 18.3337 9.99996C18.3337 8.90561 18.1181 7.82198 17.6993 6.81093C17.2805 5.79988 16.6667 4.88122 15.8929 4.1074C15.1191 3.33358 14.2004 2.71975 13.1894 2.30096C12.1783 1.88217 11.0947 1.66663 10.0003 1.66663ZM12.2587 11.075C12.3368 11.1524 12.3988 11.2446 12.4411 11.3461C12.4834 11.4477 12.5052 11.5566 12.5052 11.6666C12.5052 11.7766 12.4834 11.8856 12.4411 11.9871C12.3988 12.0887 12.3368 12.1808 12.2587 12.2583C12.1812 12.3364 12.089 12.3984 11.9875 12.4407C11.8859 12.483 11.777 12.5048 11.667 12.5048C11.557 12.5048 11.4481 12.483 11.3465 12.4407C11.245 12.3984 11.1528 12.3364 11.0753 12.2583L10.0003 11.175L8.92533 12.2583C8.84786 12.3364 8.75569 12.3984 8.65414 12.4407C8.55259 12.483 8.44367 12.5048 8.33366 12.5048C8.22365 12.5048 8.11473 12.483 8.01318 12.4407C7.91163 12.3984 7.81946 12.3364 7.742 12.2583C7.66389 12.1808 7.60189 12.0887 7.55959 11.9871C7.51728 11.8856 7.4955 11.7766 7.4955 11.6666C7.4955 11.5566 7.51728 11.4477 7.55959 11.3461C7.60189 11.2446 7.66389 11.1524 7.742 11.075L8.82533 9.99996L7.742 8.92496C7.58508 8.76804 7.49692 8.55521 7.49692 8.33329C7.49692 8.11137 7.58508 7.89855 7.742 7.74163C7.89892 7.58471 8.11174 7.49655 8.33366 7.49655C8.55558 7.49655 8.76841 7.58471 8.92533 7.74163L10.0003 8.82496L11.0753 7.74163C11.2322 7.58471 11.4451 7.49655 11.667 7.49655C11.8889 7.49655 12.1017 7.58471 12.2587 7.74163C12.4156 7.89855 12.5037 8.11137 12.5037 8.33329C12.5037 8.55521 12.4156 8.76804 12.2587 8.92496L11.1753 9.99996L12.2587 11.075Z"
                        fill="black"
                      />
                    </svg>
                    At least 1 special character
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Confirm Password Field */}
          <div className="flex flex-col w-[362px] h-[150px] gap-[10px] mt-[10px]">
            <p className="text-[12px] inter-semibold">Confirm Password</p>
            <div className="relative w-[362px] h-[72px] mt-[0px]">
              <span className="absolute left-[18px] top-1/2 transform -translate-y-1/2 flex items-center cursor-pointer z-10">
                {/* Password icon SVG here */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.55683 15.7045C3.74433 17.0961 4.89683 18.187 6.30016 18.2511C7.48016 18.3053 8.67933 18.3336 10.0002 18.3336C11.321 18.3336 12.5202 18.3053 13.7002 18.2503C15.1035 18.187 16.256 17.0961 16.4435 15.7045C16.566 14.7961 16.6668 13.8653 16.6668 12.917C16.6668 11.9686 16.566 11.0378 16.4435 10.1295C16.256 8.73779 15.1035 7.64696 13.7002 7.58279C12.4676 7.52646 11.234 7.49895 10.0002 7.50029C8.67933 7.50029 7.48016 7.52862 6.30016 7.58362C4.89683 7.64696 3.74433 8.73779 3.55683 10.1295C3.4335 11.0378 3.3335 11.9686 3.3335 12.917C3.3335 13.8653 3.43433 14.7961 3.55683 15.7045Z"
                    stroke="black"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M6.25 7.50008V5.41675C6.25 4.42219 6.64509 3.46836 7.34835 2.7651C8.05161 2.06184 9.00544 1.66675 10 1.66675C10.9946 1.66675 11.9484 2.06184 12.6516 2.7651C13.3549 3.46836 13.75 4.42219 13.75 5.41675V7.50008"
                    stroke="black"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.3334 12.9087V12.917M10.0001 12.9087V12.917M6.66675 12.9087V12.917"
                    stroke="black"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full h-full rounded-[16px] border border-[#F7F7F9] bg-[#F4F4F4] opacity-100 px-[48px] text-[16px] pr-[26px]"
                style={{ gap: "10px" }}
                placeholder="Confirm new password"
                value={confirmPassword}
                maxLength={20}
                onChange={(e) =>
                  setConfirmPassword(e.target.value.slice(0, 20))
                }
              />
              <span
                className="absolute right-[18px] top-1/2 transform -translate-y-1/2 flex items-center cursor-pointer z-10"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.3395 9.00617C11.7885 8.55824 12.1992 8.07355 12.5674 7.55716C12.7447 7.30866 12.8334 7.18383 12.8334 7.00008C12.8334 6.81575 12.7447 6.6915 12.5674 6.443C11.7706 5.32533 9.73533 2.91675 7.00008 2.91675C6.47042 2.91675 5.96758 3.00716 5.49392 3.16058M3.93641 3.93641C2.75983 4.72975 1.89125 5.80016 1.43275 6.443C1.25541 6.6915 1.16675 6.81633 1.16675 7.00008C1.16675 7.18442 1.25541 7.30866 1.43275 7.55716C2.22958 8.67483 4.26483 11.0834 7.00008 11.0834C8.16092 11.0834 9.19633 10.6494 10.0643 10.0643"
                    stroke="#8E8E8E"
                    strokeWidth="0.875"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.75058 5.83325C5.58917 5.99129 5.4607 6.17976 5.3726 6.38777C5.2845 6.59577 5.23852 6.81919 5.23733 7.04508C5.23613 7.27097 5.27975 7.49485 5.36564 7.70378C5.45153 7.91271 5.57801 8.10253 5.73774 8.26226C5.89747 8.42199 6.08729 8.54846 6.29622 8.63436C6.50514 8.72025 6.72903 8.76386 6.95492 8.76267C7.18081 8.76147 7.40422 8.7155 7.61223 8.6274C7.82024 8.5393 8.00871 8.41083 8.16674 8.24942"
                    stroke="#8E8E8E"
                    strokeWidth="0.875"
                    strokeLinecap="round"
                  />
                  <path
                    d="M1.75 1.75L12.25 12.25"
                    stroke="#8E8E8E"
                    strokeWidth="0.875"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            {error && error.toLowerCase().includes("match") && (
              <p className="text-red-500 text-[10px] mt-[0px]">{error}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-[179px] h-[72px] rounded-[16px] bg-[#6231A5] text-white inter-regular font-[600] text-[14px] mt-[30px] leading-[24px] border-0 cursor-pointer"
          >
            Submit
          </button>
        </form>
      </div>
      {/* <div
        className="absolute inter-regular text-[12px] leading-[100%] tracking-[0] text-[#000] flex items-center"
        style={{
          width: "197px",
          height: "15px",
          top: "802px",
          left: "42px",
        }}
      >
        © 2025 Stackly. All rights received
      </div> */}
      {/* </div> */}
    </AuthLayout>
  );
}

export default ForgotnewPassword;
