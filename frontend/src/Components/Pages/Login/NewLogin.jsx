import { useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- Add this import
import {
  EMailIcon,
  EyeOnIcon,
  EyeOffIcon,
  LockIcon,
  RedCrossRoundedIcon,
} from "../../../assets/icons/Icons";
import { InputField } from "../../CustomComponent/InputField/InputField";
import { useLoginForm } from "../../../hooks/useLoginForm";
import { useSmoothNavigation } from "../../../hooks/useSmoothNavigation";

export const NewLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { smoothNavigate } = useSmoothNavigation(1000);
  const {
    email,
    password,
    fieldErrors,
    apiError,
    loading,
    handleLogin,
    handleEmailChange,
    handlePasswordChange,
  } = useLoginForm();

  // const handleLogin = () => {
  //   const usernameCorrect = false;
  //   const passwordCorrect = false;
  //   if (!usernameCorrect || !passwordCorrect) {
  //     setError("Entered email or password is incorrect");
  //   }
  // };

  // const handleLogin = async () => {
  //   setError("");
  //   setLoading(true);

  //   try {
  //     const res = await loginUser({
  //       email,
  //       password,
  //       // otp: "123456" // i need to add later if 2FA is enabled
  //     });
  //     const { access_token } = res.data;
  //     // I'm storing token here
  //     localStorage.setItem("access_token", access_token);
  //     console.log("Login success:", res.data);
  //     // navigate("/homePage") later
  //   } catch (err) {
  //     setError(
  //       err.response?.data?.detail || "Entered email or password is incorrect"
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const onLoginClick = async () => {
  const success = await handleLogin();
  if (success) {
    smoothNavigate("/home");
  }
};

  return (
    <>
      <div className="flex flex-col items-start w-full gap-[12px]">
        <p className="inter-bold text-[#000000] text-[28px] leading-tight flex items-center">
          <span>Welcome Back</span>
          <span className="ml-2 pb-1">👋</span>
        </p>
        <p className="inter-regular text-[#626262] text-[14px] mt-1 leading-[17px]">
          Please enter your account details
        </p>
  </div>
      <div className="w-[360px] h-[107px] flex items-center justify-center">
        <div
          className={`w-full h-[64px] bg-[#FFEDF0] text-[#E53935] text-[14px] px-4 py-3 rounded-[12px] flex items-center gap-2 transition-all duration-300 ${
            apiError
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-2 scale-95"
          }`}
        >
          <RedCrossRoundedIcon />
          <span className="inter-regular">{apiError}</span>
        </div>
      </div>
      <div className="flex flex-col inter-semibold">
        <div className="flex flex-col gap-[20px]">
          <InputField
            label="Email ID"
            placeholder="Enter your email address"
            leftIcon={<EMailIcon />}
            className="flex-1 text-black outline-none focus:outline focus:outline-1 focus:outline-[#6231A5] text-[14px] align-middle tracking-[2px] inter-semibold"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            errorMessage={fieldErrors.email}
          />
          <InputField
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            leftIcon={<LockIcon />}
            rightIcon={
              <span
                className="cursor-pointer"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOnIcon /> : <EyeOffIcon />}
              </span>
            }
            className="flex-1 text-black outline-none text-[14px] align-middle tracking-[2px] inter-semibold"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            errorMessage={fieldErrors.password}
          />
        </div>
        <button
          className="block mt-2.5 text-right text-[#2B68FB] cursor-pointer inter-semibold"
          onClick={() => smoothNavigate("/forgot-password")}
        >
          Forgot password
        </button>
      </div>
      <div className="flex flex-col items-center justify-center w-[362px] h-[146px] mt-[104px] gap-[20px]">
        <button
          className="block text-center text-[#6231A5] cursor-pointer inter-semibold"
          // onClick={forgotUsernameHandler}

          onClick={() => smoothNavigate("/forgot-username")}
        >
          Forgot username
        </button>
        <button
          className="w-full bg-[#6231A5] text-white rounded-xl py-4 mt-6 cursor-pointer inter-semibold"
          onClick={onLoginClick}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="text-center text-black text-sm mt-4 inter-regular">
          Get Started by{" "}
          <span
            className="text-[#6231A5] cursor-pointer inter-semibold"
            onClick={() => smoothNavigate("/signup/step-1")}
          >
            Creating new account
          </span>
        </p>
      </div>
    </>
  );
};
