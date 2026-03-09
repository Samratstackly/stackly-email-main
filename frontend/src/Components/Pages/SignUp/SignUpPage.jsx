import React, { useState, useEffect } from "react";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { SignUpForm1 } from "./SignUpForm1";
import { SignUpForm2 } from "./SignUpForm2";
import { SignUpForm3 } from "./SignUpForm3";
import { SignUpForm4 } from "./SignUpForm4";
import { useCreateAnAccount } from "../../../hooks/useCreateAnAccountNew";
import { AuthCardLayout } from "../../../layouts/AuthCardLayout";
import { SlideUpWrapper } from "../../../animations/SlideUpWrapper";
import { useParams } from "react-router-dom";
import { useSmoothNavigation } from "../../../hooks/useSmoothNavigation";

const SignUpPage = () => {
  // const [step, setStep] = useState(1);
  const signUpFormData = useCreateAnAccount();
  const [visible, setVisible] = useState(false);
  const {step}=useParams();
  const { smoothNavigate } = useSmoothNavigation(1000);

  useEffect(() => {
    setVisible(true);
  }, []);

     const currentStep = Number(step?.split("-")[1]) || 1;

  const goToStep = (stepNumber) => {
    smoothNavigate(`/signup/step-${stepNumber}`);
  };

  useEffect(() => {
    if (currentStep < 1 || currentStep > 4) {
      smoothNavigate("/signup/step-1");
    }
  }, [currentStep, smoothNavigate]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, /*[step]*/ [currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SignUpForm1 setStep={goToStep} signUpFormData={signUpFormData} />
        );
      case 2:
        return (
          <SignUpForm2 setStep={goToStep} signUpFormData={signUpFormData} />
        );
      case 3:
        return (
          <SignUpForm3 setStep={goToStep} signUpFormData={signUpFormData} />
        );
      case 4:
        return <SignUpForm4 />;
      default:
        return null;
    }
  };



  return (
    <AuthLayout
      step={currentStep}
      showStepper={true}
      left={
        <AuthCardLayout
        variant='signup'
          isVisible={visible}
          //title="Let's get started 👍"
          //description="Lorem Ipsum is simply dummy text of the printing and typesetting industry.Lorem Ipsum has been the industry's standard"
        />
      }
    >
      <SlideUpWrapper isVisible={visible}>{renderStep()}</SlideUpWrapper>
    </AuthLayout>
  );
};

export default SignUpPage;