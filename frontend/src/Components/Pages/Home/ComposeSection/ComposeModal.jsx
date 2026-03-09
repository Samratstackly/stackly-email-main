import React, { useState, useRef, useEffect } from "react";
import { sendMail,getDraftMails,saveDraft,updateDraft,getDraftById,publishDraft } from "../../../../api/api";
import { EmailEditor } from "./EmailEditor";
import { ComposeModalCrossIcon, ComposeModalExpandIcon } from "../../../../assets/icons/Icons2";

export const ComposeModal = ({ isOpen, onClose, onSendSuccess, draftData = null }) => {
  const [formData, setFormData] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCCBCC, setShowCCBCC] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [draftId, setDraftId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const quillRef = useRef(null);
  const isCCBCCVisible = isExpanded || showCCBCC;

    useEffect(() => {
       if (!isOpen) return;
  if (draftData) {
    setFormData({
      to: draftData.receiver_email || "",
      subject: draftData.subject || "",
      body: draftData.body || "",
      cc: "",
      bcc: ""
    });

    setDraftId(draftData.id);
  } else {
    // Fresh compose
    setFormData({
      to: "",
      cc: "",
      bcc: "",
      subject: "",
      body: ""
    });
    setDraftId(null);
  }
}, [draftData, isOpen]);

useEffect(() => {
  if (!draftId) return;

  const timeout = setTimeout(() => {
    updateDraft(draftId, {
      receiver_email: formData.to,
      subject: formData.subject,
      body: formData.body,
    });
  }, 2000); // autosave after 2s idle

  return () => clearTimeout(timeout);
}, [formData, draftId]);


  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBodyChange = (value) => {
    setFormData(prev => ({
      ...prev,
      body: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleImageInsert = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    
    input.onchange = () => {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const quill = quillRef.current?.getEditor();
          const range = quill.getSelection();
          quill.insertEmbed(range.index, 'image', e.target.result);
        };
        reader.readAsDataURL(file);
      }
    };
  };

  const handleRemoveAttachment = (id) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };

  const handleSend = async () => {
    if (!formData.to.trim()) {
      setError("Recipient (To) is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // const mailData = new FormData();
      // mailData.append("receiver_email", formData.to);
      // mailData.append("subject", formData.subject);
      // mailData.append("body", formData.body);
      const mailPayload = {
        receiver_email: formData.to,
        subject: formData.subject,
        body: formData.body,
      };

      // if (attachments.length > 0) {
      //   mailData.append("file", attachments[0].file);
      // }

      if (draftId) {
        await updateDraft(draftId, mailPayload);
        await publishDraft(draftId);
      } else {
        // await sendMail(mailData);
        const mailData = new FormData();
        mailData.append("receiver_email", formData.to);
        mailData.append("subject", formData.subject);
        mailData.append("body", formData.body);

        if (attachments.length > 0) {
          mailData.append("file", attachments[0].file);
        }
        await sendMail(mailData);
      }

      setFormData({ to: "", cc: "", bcc: "", subject: "", body: "" });
      setAttachments([]);
      setDraftId(null);
      onSendSuccess();
      setError("");
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to send email",
      );
    } finally {
      setIsLoading(false);
    }
  };

 const handleClose = async () => {
   const hasContent = formData.to || formData.subject || formData.body;

   if (hasContent) {
     const mailData = {
       receiver_email: formData.to,
       subject: formData.subject,
       body: formData.body,
     };

     try {
       if (draftId) {
         await updateDraft(draftId, mailData);
       } else {
         const response = await saveDraft(mailData);
         setDraftId(response.data.id);
       }
     } catch (err) {
       console.error("Draft save failed");
     }
   }

   onClose();
 };



  return (
    //  <div className="fixed inset-0 bg-[#00000029] flex items-center justify-center z-50"  onClick={handleClose}>
     <div className={`fixed inset-0 bg-[#00000029] z-50 ${ isExpanded ? "flex justify-end" :"flex items-center justify-center"}`} onClick={handleClose}> 
      {/* <div className="bg-white w-[583px] h-[613px] rounded-[17.24px] overflow-hidden"  onClick={(e) => e.stopPropagation()}> */}
      <div className={`bg-white overflow-hidden transition-all duration-300 ${isExpanded? "fixed top-[24px] bottom-[24px] right-[24px] bottom-[24px] w-[783px] min-h-screen rounded-[12px]": "w-[583px] h-[613px] rounded-[17.24px] overflow-hidden"}`} onClick={(e) => e.stopPropagation()}>
      <div className="bg-[linear-gradient(135deg,#4E73FF42_26%,#B9A0FF8A_54%)] h-[79px] text-black p-4 flex justify-between items-center">
        {/* <div className="bg-[linear-gradient(135deg,#4E73FF42_26%,#B9A0FF8A_54%)] h-[79px] text-black px-[24px] flex justify-between items-center"> */}
          <h2 className="w-[138px] h-[24px] inter-bold text-[20px] leading-[100%] tracking-[0]">
            New Message
          </h2>
          <div className="flex items-center gap-[22px]">
          <button  onClick={() => setIsExpanded((prev) => !prev)} className="text-black hover:text-gray-700 w-8 h-8 flex items-center justify-center"> <ComposeModalExpandIcon/> </button>
          <button onClick={onClose} className="text-black hover:text-gray-700 text-xl w-8 h-8 flex items-center justify-center" > <ComposeModalCrossIcon/> </button>
        </div>
        </div>

        {/* <div className={`p-6 overflow-y-auto ${isExpanded ? "h-[calc(100vh-160px)]" : "max-h-[70vh]" }`}> */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-[16px]">
            <div>
              <div className="flex items-center justify-between mb-[8px]">
                <label className="text-[#000000] text-[12px] inter-regular">
                  To
                </label>

                {!isExpanded && (
                <div className="flex items-center gap-[8px]">
                  <span className="text-[12px] text-[#000000] inter-medium">
                    Show CC & BCC
                  </span>

                  <button
                    className={`flex items-center w-[42px] h-[23px] rounded-[12px] px-[2px] transition-colors duration-200 ${
                      showCCBCC ? "bg-[#6A37F5]" : "bg-[#EDECFF]"
                    }`}
                    onClick={() => setShowCCBCC((prev) => !prev)}
                    aria-pressed={showCCBCC}
                    type="button"
                  >
                    <div
                      className={`w-[19px] h-[19px] rounded-full transition-all duration-200 ${
                        showCCBCC ? "bg-white" : "bg-[#6A37F5]"
                      }`}
                      style={{
                        transform: showCCBCC
                          ? "translateX(19px)"
                          : "translateX(0)",
                      }}
                    ></div>
                  </button>
                </div>
                )}
              </div>

              <input
                type="text"
                name="to"
                value={formData.to}
                onChange={handleChange}
                placeholder="Recipient"
                className="w-full h-[30px] px-[14px] border border-[#EAEAEA] rounded-[8px] text-[12px] focus:outline-none focus:border-[#6A37F5]"
              />
            </div>

           {isCCBCCVisible &&(
            // {showCCBCC && (
              <>
                <div>
                  <label className="block text-[#000000] text-[12px] font-medium mb-[8px]">
                    CC
                  </label>
                  <input
                    type="text"
                    name="cc"
                    value={formData.cc}
                    onChange={handleChange}
                    placeholder="CC"
                    className="w-full h-[30px] px-[14px] border border-[#EAEAEA] rounded-[8px] text-[12px] focus:outline-none focus:border-[#6A37F5]"
                  />
                </div>

                <div>
                  <label className="block text-[#000000] text-[12px] font-medium mb-[8px]">
                    BCC
                  </label>
                  <input
                    type="text"
                    name="bcc"
                    value={formData.bcc}
                    onChange={handleChange}
                    placeholder="BCC"
                    className="w-full h-[30px] px-[14px] border border-[#EAEAEA] rounded-[8px] text-[12px] focus:outline-none focus:border-[#6A37F5]"
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-[20px]">
            <label className="block text-[#000000] text-[12px] mb-[8px] inter-regular">
              Subject
            </label>

            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Your subject"
              className="w-full h-[30px] px-[14px] border border-[#EAEAEA] rounded-[8px] text-[12px] focus:outline-none focus:border-[#6A37F5]"
            />
          </div>

          <div className="mt-[20px]">
            <label className="block text-[#000000] text-[12px] mb-[8px] inter-regular">
              Message
            </label>

            <EmailEditor
              value={formData.body}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, body: val }))
              }
            />
          </div>

          {attachments.length > 0 && (
            <div className="mt-4">
              <h4 className="text-[12px] font-medium text-[#000000] mb-2">
                Attachments:
              </h4>
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="text-[12px]">{attachment.name}</span>
                    <button
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 flex justify-end items-center">
          <div className="flex space-x-3 w-[78px] h-[32px]">
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="inter-regular px-4 py-2 bg-[#6A37F5] text-white rounded-[16px] text-[12px] cursor-pointer"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};