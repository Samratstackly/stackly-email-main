import React, { useEffect, useRef, useState } from "react";
import { searchChats, startCall, sendMessageToRoom } from "../../../api/api";
import {
  ChatProfileCallIcon,
  ChatProfileDropdownIcon,
  ChatProfileSearchIcon,
  ChatAddReactionIcon,
  ChatAttachIcon,
  ChatSendIcon
} from '../../../assets/icons/Icons1';

const ChatMainArea = ({
  chatList,
  selectedChatIdx,
  input,
  handleInputChange,
  handleKeyDown,
  handleSend,
  messages,
  setMessages,
  selectedUser,
  setInput
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isSendingRef = useRef(false); // Prevent double sends
  
  // Get current user info
  const currentUser = {
    id: localStorage.getItem("user_id"),
    email: localStorage.getItem("user_email")
  };

  const selectedChat = Array.isArray(chatList) &&
    selectedChatIdx !== null &&
    selectedChatIdx !== undefined &&
    selectedChatIdx >= 0 &&
    selectedChatIdx < chatList.length
    ? chatList[selectedChatIdx]
    : null;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedChat) {
      console.log("Selected chat object:", selectedChat);
    }
  }, [selectedChat]);

  const getRoomId = (chat) => {
    if (!chat) return null;
    const possibleIds = ['id', '_id', 'roomId', 'room_id', 'chatId', 'roomID', 'chat_id'];
    for (const key of possibleIds) {
      if (chat[key]) return chat[key];
    }
    return null;
  };

  const isChatSelected = selectedChat &&
    (selectedChat.id || selectedChat._id || selectedChat.name || selectedChat.username);

  // Get the other participant's details - FIXED VERSION
  const getOtherParticipant = () => {
    if (!selectedChat) return null;
    
    // Try to get other participant email
    let otherEmail = null;
    
    // Check if otherParticipantEmail exists directly
    if (selectedChat.otherParticipantEmail) {
      otherEmail = selectedChat.otherParticipantEmail;
    }
    // Otherwise try to extract from participants array
    else if (selectedChat.participants && Array.isArray(selectedChat.participants)) {
      otherEmail = selectedChat.participants.find(
        email => email !== currentUser.email
      ) || selectedChat.participants[0];
    }
    // Fallback to email property
    else if (selectedChat.email) {
      otherEmail = selectedChat.email;
    }
    
    if (!otherEmail) {
      return {
        email: 'Unknown',
        name: 'Unknown User',
        first_name: '',
        last_name: '',
        profile_image: null
      };
    }
    
    // Try to find the user details from chatList or otherParticipant object
    let firstName = '';
    let lastName = '';
    let profileImage = null;
    
    // Check if the chat object has first_name/last_name directly
    if (selectedChat.first_name || selectedChat.last_name) {
      firstName = selectedChat.first_name || '';
      lastName = selectedChat.last_name || '';
    }
    // Check if there's a nested otherParticipant object with details
    else if (selectedChat.otherParticipant) {
      firstName = selectedChat.otherParticipant.first_name || '';
      lastName = selectedChat.otherParticipant.last_name || '';
      profileImage = selectedChat.otherParticipant.profile_image || selectedChat.otherParticipant.avatar;
    }
    // Try to find in chatList by matching email
    else {
      const userFromList = chatList.find(chat => 
        (chat.otherParticipantEmail === otherEmail) || 
        (chat.email === otherEmail) ||
        (chat.participants && chat.participants.includes(otherEmail) && chat !== selectedChat)
      );
      
      if (userFromList) {
        firstName = userFromList.first_name || '';
        lastName = userFromList.last_name || '';
        profileImage = userFromList.profile_image || userFromList.avatar;
      }
    }
    
    // Format the display name
    let displayName = '';
    if (firstName || lastName) {
      displayName = `${firstName} ${lastName}`.trim();
    } else {
      // If no name, format email to a readable name
      if (otherEmail && otherEmail.includes('@')) {
        const username = otherEmail.split('@')[0];
        displayName = username.split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      } else {
        displayName = otherEmail || 'Unknown User';
      }
    }
    
    return {
      email: otherEmail,
      name: displayName,
      first_name: firstName,
      last_name: lastName,
      profile_image: profileImage
    };
  };

  const otherParticipant = getOtherParticipant();

  const handleAttachClick = () => {
    if (!isChatSelected && !selectedUser) return;
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!isChatSelected && !selectedUser) return;
    
    const roomId = selectedChat ? getRoomId(selectedChat) : null;
    const fileId = Date.now();
    const fileObject = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'selected',
      roomId: roomId || 'local-demo',
      file: file
    };
    
    setUploadedFiles(prev => [...prev, fileObject]);
    
    if (setInput) {
      const fileMention = `📎${file.name}`;
      setInput(prev => prev && prev.trim() ? prev + ' ' + fileMention : fileMention);
    }
    
    setTimeout(() => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 100);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCallClick = async () => {
    if (!isChatSelected) return;
    const roomId = getRoomId(selectedChat);
    if (!roomId) return;
    try {
      await startCall(roomId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveFile = (fileId) => {
    const fileToRemove = uploadedFiles.find(file => file.id === fileId);
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    if (setInput && fileToRemove) {
      const fileMention = `📎${fileToRemove.name}`;
      setInput(prev => prev.replace(fileMention, '').replace(/\s+/g, ' ').trim());
    }
  };

  // Send message using the API - with double send prevention
  const handleSendClick = async () => {
    // Prevent double sending
    if (isSendingRef.current) return;
    if (!isChatSelected || !input?.trim() || isUploading) return;
    
    const roomId = getRoomId(selectedChat);
    if (!roomId) {
      console.error('No room ID found');
      return;
    }

    // Set sending flag
    isSendingRef.current = true;

    const messageContent = input;
    const tempId = `temp-${Date.now()}`;

    try {
      setIsUploading(true);

      // Optimistically add message to UI
      const optimisticMessage = {
        id: tempId,
        content: messageContent,
        sender_email: currentUser.email,
        timestamp: new Date().toISOString(),
        fromMe: true,
        status: 'sending'
      };

      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear input immediately for better UX
      if (setInput) setInput("");
      setUploadedFiles([]);

      // Send to backend using the API
      const response = await sendMessageToRoom(roomId, { content: messageContent });
      
      console.log('Message sent successfully:', response);

      // Update the optimistic message with real data
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { 
                ...response, 
                fromMe: true,
                status: 'sent' 
              }
            : msg
        )
      );

    } catch (error) {
      console.error('Failed to send message:', error, error?.response, error?.message);
      
      // Mark the message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, status: 'failed', error: true }
            : msg
        )
      );

      alert('Failed to send message. Please try again.');
      
    } finally {
      setIsUploading(false);
      // Reset sending flag after a short delay
      setTimeout(() => {
        isSendingRef.current = false;
      }, 500);
    }
  };

  // Handle file upload separately
  const handleFileUpload = async () => {
    if (uploadedFiles.length === 0 || !isChatSelected) return;
    
    const roomId = getRoomId(selectedChat);
    if (!roomId) return;

    setIsUploading(true);
    
    try {
      for (const file of uploadedFiles) {
        const fileMessage = `📎 ${file.name}`;
        await sendMessageToRoom(roomId, { content: fileMessage });
      }
      
      setUploadedFiles([]);
      if (setInput) setInput("");
      
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle key down for input - with double send prevention
  const handleKeyDownHandler = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (selectedChat && !isSendingRef.current) {
        handleSendClick();
      }
      // Do NOT call parent's handleKeyDown for Enter to avoid double send
      return;
    }
    // For other keys, call parent's handleKeyDown if provided
    if (handleKeyDown) {
      handleKeyDown(e);
    }
  };

  // Handle input change
  const handleInputChangeHandler = (e) => {
    const newValue = e.target.value;
    
    // Check for file mentions being removed
    const fileMentions = uploadedFiles.map(file => `📎${file.name}`);
    const remainingMentions = fileMentions.filter(mention => newValue.includes(mention));
    
    if (remainingMentions.length < uploadedFiles.length) {
      const removedFiles = uploadedFiles.filter(file => !newValue.includes(`📎${file.name}`));
      removedFiles.forEach(file => {
        setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
      });
    }
    
    // Call the parent's handleInputChange to update the input state in ChatHome
    if (handleInputChange) {
      handleInputChange(e);
    }
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Check if message is from current user
  const isMessageFromCurrentUser = (message) => {
    return message.sender_email === currentUser.email || message.fromMe === true;
  };

  // Determine what to display in header
  const getHeaderInfo = () => {
    // Always show the receiver's (other participant's) info in the header when a chat is selected
    if (selectedChat && otherParticipant) {
      return {
        name: otherParticipant.name || otherParticipant.email || 'Unknown User',
        image:
          otherParticipant.profile_image ||
          otherParticipant.avatar ||
          selectedChat.img ||
          "/default-avatar.png",
        email: otherParticipant.email
      };
    } else if (selectedUser) {
      const userName = `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim();
      return {
        name: userName || selectedUser.email || 'Unknown User',
        image: selectedUser.profile_image || selectedUser.avatar || "/default-avatar.png",
        email: selectedUser.email
      };
    }
    return null;
  };

  const headerInfo = getHeaderInfo();

  // If no user or chat selected
  if (!headerInfo) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">Welcome to Chats</p>
          <p className="text-sm">Select a conversation or search for users to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Chat Header */}
      <div className="flex flex-row items-center justify-between w-full h-[64px] bg-[#040B23] px-[25px]">
        <div className="flex flex-row w-[118px] h-[30px] gap-[10px]">
          <img 
            src={headerInfo.image} 
            alt={headerInfo.name} 
            className="w-[30px] h-[30px] rounded-[50%] border-[1px] border-[#9D9D9D]" 
          />
          <div className="flex flex-col justify-center w-[200px] h-[30px]">
            <span className="inter-bold text-[12px] tracking-[0.07em] text-white whitespace-nowrap">
              {headerInfo.name}
            </span>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between w-[80px] h-[20px] ">
          <div className="flex flex-row justify-between items-center w-[40px] h-[20px]">
            <div
              className={selectedChat ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
              onClick={selectedChat ? handleCallClick : undefined}
              title={selectedChat ? "Start call" : "Select a chat to start a call"}
            >
              <ChatProfileCallIcon />
            </div>
            <ChatProfileDropdownIcon />
          </div>
          <ChatProfileSearchIcon />
        </div>
      </div>

      {/* Upload Status Bar */}
      {uploadedFiles.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 ${
                    file.roomId && file.roomId !== 'local-demo' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  <span>📎</span>
                  <span className="max-w-[200px] truncate" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-xs opacity-75">
                    ({formatFileSize(file.size)})
                  </span>
                  {file.roomId === 'local-demo' && (
                    <span className="text-xs text-yellow-600 ml-1">(demo)</span>
                  )}
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="ml-1 text-red-500 hover:text-red-700 text-sm font-bold"
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleFileUpload}
              disabled={isUploading}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Send Files'}
            </button>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex w-full h-[calc(100vh-64px)] px-[20px] pt-[20px] overflow-hidden">
        <div className="flex flex-col w-full h-full">
          <div className="flex-1 overflow-y-auto pb-[20px]">
            {!selectedChat ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 text-lg mb-2">
                    {selectedUser?.first_name} {selectedUser?.last_name}
                  </div>
                  <div className="text-gray-500 text-sm mb-2">
                    {selectedUser?.email}
                  </div>
                  <div className="text-gray-400 text-sm">
                    No chat history yet. Start a conversation!
                  </div>
                </div>
              </div>
            ) : messages && messages.length > 0 ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
                    Today
                  </div>
                </div>
                {messages.map((message, idx) => {
                  const isFromMe = isMessageFromCurrentUser(message);
                  // For received messages, show the receiver's (other participant's) info
                  let displayName = '';
                  if (!isFromMe) {
                    if (otherParticipant && otherParticipant.name) {
                      displayName = otherParticipant.name;
                    } else if (otherParticipant && otherParticipant.email) {
                      // Format email to name as fallback
                      const email = otherParticipant.email;
                      if (email.includes('@')) {
                        const username = email.split('@')[0];
                        displayName = username.split('.')
                          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                          .join(' ');
                      } else {
                        displayName = email;
                      }
                    } else {
                      displayName = message.sender_email || 'User';
                    }
                  }
                  return (
                    <div 
                      key={message.id || idx} 
                      className={`flex mb-4 ${isFromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex flex-row max-w-[70%] ${isFromMe ? 'items-end' : 'items-start'}`}>
                        {/* Avatar for received messages */}
                        {!isFromMe && (
                          <img
                            src={otherParticipant?.profile_image || otherParticipant?.avatar || '/default-avatar.png'}
                            alt={displayName}
                            className="w-[28px] h-[28px] rounded-full mr-2 border border-gray-300"
                          />
                        )}
                        <div className="flex flex-col flex-1">
                          {/* Receiver name for received messages */}
                          {!isFromMe && (
                            <span className="inter-bold text-[11px] mb-1 ml-2 flex items-center gap-2">
                              {displayName}
                              <span className="inter-regular text-[9px] text-[#898989] ml-2">
                                {formatMessageTime(message.timestamp)}
                              </span>
                            </span>
                          )}
                          {/* Message bubble */}
                          <div 
                            className={`px-4 py-2 rounded-lg ${
                              message.isFile || message.content?.startsWith('📎')
                                ? 'bg-[#EDEDED] text-[#000000] rounded-[10px]'
                                : isFromMe 
                                  ? 'bg-[#EDEDED] text-[#000000] rounded-tr-none' 
                                  : 'bg-[#EDEDED] text-[#000000] rounded-tl-none'
                            } ${message.status === 'failed' ? 'border border-red-500' : ''}`}
                          >
                            {message.isFile || message.content?.startsWith('📎') ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📎</span>
                                <div>
                                  <a
                                    href={message.fileUrl || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium hover:underline text-blue-600"
                                  >
                                    {message.content?.replace('📎 ', '') || message.text}
                                  </a>
                                  <div className="text-xs opacity-75 mt-1">
                                    Click to download
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm break-words whitespace-pre-wrap">
                                  {message.content || message.text}
                                </p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  {message.status === 'sending' && (
                                    <span className="text-[10px] opacity-75">Sending...</span>
                                  )}
                                  {message.status === 'failed' && (
                                    <span className="text-[10px] text-red-500">Failed</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Reactions (if any) */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {message.reactions.map((reaction, i) => (
                                <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs">
                                  <span>{reaction.emoji}</span>
                                  <span>{reaction.count}</span>
                                </div>
                              ))}
                              <button className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                <ChatAddReactionIcon />
                              </button>
                            </div>
                          )}
                        </div>
                        {/* Timestamp and avatar for sender*/}
                        {isFromMe && (
                          <div className="flex flex-row gap-[10px] items-center ml-2 mb-8">
                            <span className="inter-regular text-[9px] text-[#898989] mb-1">
                              {formatMessageTime(message.timestamp)}
                            </span>
                            <img
                              src={currentUser.profile_image || '/default-avatar.png'}
                              alt="You"
                              className="w-[28px] h-[28px] rounded-full border border-gray-300"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  No messages yet. Start the conversation!
                </div>
              </div>
            )}
          </div>

          {/* Message Input Area */}
          <div className="mt-auto pt-4 pb-6">
            <div className="w-full h-[52px] rounded-lg p-[14px] bg-[#F4F4F4]">
              <div className="flex items-center h-full">
                <button
                  onClick={handleAttachClick}
                  disabled={!selectedChat || isUploading}
                  className={`mr-2 focus:outline-none ${!selectedChat || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={selectedChat ? "Attach file" : "Select a chat to attach files"}
                >
                  <ChatAttachIcon />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,.doc,.docx,.txt,.zip"
                  disabled={!selectedChat}
                />
                <input
                  className="flex-1 bg-transparent outline-none text-sm px-2"
                  type="text"
                  placeholder={selectedChat ? "Type your message..." : "Select a chat to start messaging"}
                  value={input || ""}
                  onChange={handleInputChangeHandler}
                  onKeyDown={handleKeyDownHandler}
                  disabled={!selectedChat}
                />
                <button
                  onClick={handleSendClick}
                  disabled={!selectedChat || !input?.trim() || isUploading || isSendingRef.current}
                  className={`focus:outline-none ${!selectedChat || !input?.trim() || isUploading || isSendingRef.current ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title="Send message"
                >
                  <ChatSendIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMainArea;