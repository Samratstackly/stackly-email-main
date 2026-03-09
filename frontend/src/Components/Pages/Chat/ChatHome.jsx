import { searchUsers, getOnlineStatus, startCall, getRoomMessages, getChatRooms, sendMessageToRoom, createChatRoom, api } from "../../../api/api";
import React, { useState, useEffect } from "react";
import ChatDetails from "./ChatDetails";
import ChatMainArea from "./ChatMainArea";
import { Navbar } from "../Home/Navbar/Navbar";
import { AppNavBar } from "../Home/Navbar/AppNavBar";
import { RightSidebar } from "../Home/RightSidebar";
import { useSmoothNavigation } from "../../../hooks/useSmoothNavigation";
import image1 from '../../../assets/images/image1.png';
import image2 from '../../../assets/images/image2.png';
import image3 from '../../../assets/images/image3.png';
import profileimg from '../../../assets/images/profileimg.png';
import profileimg1 from '../../../assets/images/profileimg1.png';
import profileimg2 from '../../../assets/images/profileimg2.png';
import chatimg from '../../../assets/images/chatimg.png';
import chatimg1 from '../../../assets/images/chatimg1.png';
import chatimg2 from '../../../assets/images/chatimg2.png';
import chatimg3 from '../../../assets/images/chatimg3.png';
import chatimg4 from '../../../assets/images/chatimg4.png';
import {
  ChatThreeDotIcon,
  ChatInboxIcon,
  ChatEditIcon,
  ChatSearchIcon,
  ChatShortcutsArrowIcon,
  ChatStarIcon,
  ChatAllMessagesArrowIcon,
  ChatAddReactionIcon,
  ChatAttachIcon,
  ChatSendIcon,
  ChatProfileDropdownIcon,
  ChatProfileSearchIcon,
  ChatProfileCallIcon,
  ChatRecentFileIcon
} from '../../../assets/icons/Icons1';

const ChatHome = () => {
  const { visible, smoothNavigate } = useSmoothNavigation(1000);

  // State for input and messages
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedChatIdx, setSelectedChatIdx] = useState(0);

  // --- Chats sidebar state ---
  const [chatSearch, setChatSearch] = useState("");
  const [chatList, setChatList] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // --- User profile state ---
  const [selectedUser, setSelectedUser] = useState(null);

  // Get current user info
  const currentUser = {
    id: localStorage.getItem("user_id"),
    email: localStorage.getItem("user_email")
  };

  // Fetch chat list on mount and filter out empty rooms
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      try {
        const chats = await getChatRooms();
        const chatData = Array.isArray(chats) ? chats : chats?.data || chats?.rooms || [];
        
        // Process each room to get the other participant's info
        const processedRooms = await Promise.all(chatData.map(async (room) => {
          // Find the other participant (not the current user)
          const otherParticipantEmail = room.participants?.find(
            email => email !== currentUser.email
          ) || room.participants?.[0];
          
          // Get the last message
          const lastMessage = room.last_message?.content || room.last_message;
          const lastMessageTime = room.last_message?.timestamp;
          
          // Check if room has any messages
          let hasMessages = false;
          let messageCount = 0;
          
          if (room.message_count !== undefined) {
            // If the API provides message count, use it
            messageCount = room.message_count;
            hasMessages = messageCount > 0;
          } else {
            // Otherwise, fetch messages to check
            try {
              const roomId = room.id || room._id;
              if (roomId) {
                const msgs = await getRoomMessages(roomId);
                messageCount = msgs?.length || 0;
                hasMessages = messageCount > 0;
              }
            } catch (error) {
              console.error(`Error fetching messages for room ${room.id}:`, error);
              hasMessages = false;
            }
          }
          
          return {
            ...room,
            otherParticipantEmail,
            displayName: room.name || otherParticipantEmail || 'Unknown',
            lastMessage,
            lastMessageTime,
            unread_count: room.unread_count || 0,
            hasMessages, // Flag indicating if room has messages
            messageCount // Count of messages
          };
        }));
        
        // Filter out rooms with no messages
        const roomsWithMessages = processedRooms.filter(room => room.hasMessages === true);
        
        console.log('All rooms:', processedRooms.length);
        console.log('Rooms with messages:', roomsWithMessages.length);
        console.log('Empty rooms filtered out:', processedRooms.length - roomsWithMessages.length);
        
        setChatList(roomsWithMessages);
        setFilteredChats(roomsWithMessages);

        // Fetch messages for the first chat if available
        if (roomsWithMessages.length > 0) {
          const roomId = roomsWithMessages[0].id || roomsWithMessages[0]._id;
          if (roomId) {
            const msgs = await getRoomMessages(roomId);
            setMessages(msgs);
            
            // Mark first room as read when loaded
            try {
              await api.post(`/chat/rooms/${roomId}/read`);
              setChatList(prev => prev.map(room =>
                (room.id === roomId || room._id === roomId)
                  ? { ...room, unread_count: 0 }
                  : room
              ));
              setFilteredChats(prev => prev.map(room =>
                (room.id === roomId || room._id === roomId)
                  ? { ...room, unread_count: 0 }
                  : room
              ));
            } catch (err) {
              console.error('Failed to mark room as read:', err);
            }
          }
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setChatList([]);
        setFilteredChats([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, []);

  const fetchMessagesForChat = async (chat) => {
    try {
      const roomId = chat.id || chat._id;
      if (!roomId) {
        setMessages([]);
        return;
      }
      
      // Fetch messages
      const msgs = await getRoomMessages(roomId);
      setMessages(msgs);
      
      // Mark room as read when fetching messages
      try {
        await api.post(`/chat/rooms/${roomId}/read`);
        // Update unread count in state - set to 0
        setChatList(prev => prev.map(room =>
          (room.id === roomId || room._id === roomId)
            ? { ...room, unread_count: 0 }
            : room
        ));
        setFilteredChats(prev => prev.map(room =>
          (room.id === roomId || room._id === roomId)
            ? { ...room, unread_count: 0 }
            : room
        ));
      } catch (err) {
        console.error('Failed to mark room as read:', err);
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  // Handle chat selection (only for real chat rooms)
  const handleChatSelect = (originalIdx, chat) => {
    setSelectedUser(null); // Deselect user profile
    setSelectedChatIdx(originalIdx);
    fetchMessagesForChat(chat);
    setIsSearchMode(false);
    setChatSearch('');
  };

  // Handle user profile selection (from search results)
  const handleUserClick = async (user) => {
    setSelectedUser(user);
    setSelectedChatIdx(null); // Deselect chat
    setMessages([]); // Clear messages
    
    // Check if there's already a chat room with this user
    const existingRoom = chatList.find(room => 
      room.participants?.includes(user.email)
    );
    
    if (existingRoom) {
      // If room exists, select it (this will mark as read)
      const idx = chatList.findIndex(r => r.id === existingRoom.id);
      setSelectedChatIdx(idx);
      await fetchMessagesForChat(existingRoom);
      setSelectedUser(null); // Clear selected user since we're now in a chat
      setIsSearchMode(false);
      setChatSearch('');
    } else {
      // Create a new chat room
      try {
        setIsLoading(true);
        const newRoom = await createChatRoom(user.id, user.email);
        if (newRoom) {
          // Add the new room to chat list
          const processedRoom = {
            ...newRoom,
            otherParticipantEmail: user.email,
            displayName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
            participants: [currentUser.email, user.email],
            hasMessages: false,
            messageCount: 0,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            profile_image: user.profile_image || user.avatar,
            unread_count: 0
          };
          
          // Update chat list with new room
          setChatList(prev => [processedRoom, ...prev]);
          setFilteredChats(prev => [processedRoom, ...prev]);
          
          // Select the new room
          setSelectedChatIdx(0);
          setSelectedUser(null); // Clear selected user
          setIsSearchMode(false);
          setChatSearch('');
          
          // Fetch messages for the new room (will be empty)
          await fetchMessagesForChat(processedRoom);
        }
      } catch (error) {
        console.error('Error creating chat room:', error);
        alert('Failed to create chat room. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Update search to use /users/search API
  const handleChatSearchChange = async (e) => {
    const value = e.target.value;
    setChatSearch(value);
    setIsLoading(true);

    try {
      if (value.trim().length < 3) {
        setFilteredChats(chatList);
        setIsSearchMode(false);
        setIsLoading(false);
        return;
      }
      
      // Search for users using the API
      const results = await searchUsers(value);
      
      // Filter out current user
      const filteredResults = results.filter(user => user.email !== currentUser.email);
      
      // Mark as search results
      const searchResults = filteredResults.map(user => ({
        ...user,
        isSearchResult: true,
        room_id: null,
        unread_count: 0,
        last_message: null
      }));
      
      setFilteredChats(searchResults);
      setIsSearchMode(true);
    } catch (error) {
      console.error('Error searching users:', error);
      setFilteredChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new chat button click
  const handleNewChatClick = () => {
    setChatSearch('');
    setFilteredChats(chatList);
    setIsSearchMode(false);
  };

  // --- Details section state ---
  const [activeTab, setActiveTab] = useState("files");
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // Handle input change
  const handleInputChange = (e) => setInput(e.target.value);

  // Handle send message
  const handleSend = async () => {
    if (input.trim() === "") return;
    
    // Get current room
    const currentRoom = chatList[selectedChatIdx];
    if (!currentRoom) return;
    
    const roomId = currentRoom.id || currentRoom._id;
    const messageContent = input;
    const tempId = `temp-${Date.now()}`;

    // Optimistically add message
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      sender_email: currentUser.email,
      timestamp: new Date().toISOString(),
      fromMe: true,
      status: 'sending'
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setInput("");

    try {
      // Send message using the API
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

      // Refresh messages to get the latest
      await fetchMessagesForChat(currentRoom);

      // IMPORTANT: Clear unread count for this room since user just sent a message
      setChatList(prev => prev.map(room =>
        (room.id === roomId || room._id === roomId)
          ? { ...room, unread_count: 0 }
          : room
      ));
      setFilteredChats(prev => prev.map(room =>
        (room.id === roomId || room._id === roomId)
          ? { ...room, unread_count: 0 }
          : room
      ));

      // If this was the first message in a new room, ensure it appears in chat list
      if (currentRoom.hasMessages === false) {
        // Update the room to show it has messages now
        const updatedChatList = chatList.map(room => 
          room.id === currentRoom.id 
            ? { ...room, hasMessages: true, messageCount: 1 }
            : room
        );
        setChatList(updatedChatList);
        setFilteredChats(updatedChatList);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Mark the message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, status: 'failed', error: true }
            : msg
        )
      );

      // Show error to user
      alert('Failed to send message. Please try again.');
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Details section handlers ---
  const handleTabClick = (tab) => setActiveTab(tab);
  const handleViewAllPhotos = () => setShowAllPhotos(true);

  // Example files and photos
  const files = [
    { name: "images.png", icon: "image" },
    { name: "images.png", icon: "image" },
    { name: "Files.pdf", icon: "pdf" }
  ];
  const photos = [chatimg, chatimg1, chatimg2, chatimg3, chatimg4];

  return (
    <>
      <div
        className={`w-full min-h-screen flex flex-col transition-all duration-1000 ease-in-out
        ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <Navbar />
        <AppNavBar />
        
        {/* Chat Content Area */}
        <div className="flex flex-1 overflow-hidden w-full">
           {/* Sidebar */}
           <div className="w-[261px] h-[700px] p-[10px]">
            <div className="flex flex-col w-[229px] h-[660px] gap-[24px]">

              {/* Chats */}
              <div className="flex flex-col w-full h-[180px] gap-[24px]">
                 <div className="flex flex-col w-full h-[77px] gap-[23px]">

                    <div className="flex flex-row justify-between items-center w-full h-[20px]">
                      <span className="inter-bold text-[16px] text-[#040B23] tracking-[0.07em]">Chats</span>
                      <div className="flex flex-row items-center w-[100px] justify-center h-[20px] gap-[20px]">
                         <ChatThreeDotIcon />
                         <ChatInboxIcon />
                         <ChatEditIcon 
                           onClick={handleNewChatClick}
                           className="cursor-pointer hover:opacity-70"
                         />
                      </div>
                    </div>

                    <div className="relative w-[229px] h-[34px]">
                       <ChatSearchIcon 
                         className="absolute left-[10px] top-[50%] translate-y-[-50%]"
                       />
                       <input
                         type="text"
                         placeholder="Search chat"
                         className="w-full h-full pl-[33px] pr-[10px] py-[9px] bg-[#F6F6F6] border border-[#EAEAEA] rounded-[6px] opacity-100 outline-none text-[12px] inter-regular"
                         value={chatSearch}
                         onChange={handleChatSearchChange}
                       />
                     </div>
                 </div>
                 <div className="flex flex-col w-full h-[79px] gap-[16px]">
                   <div className="flex flex-row items-center justify-between w-full h-[16px]">
                      <span className="inter-bold text-[12px] tracking-[0.07em]">Shortcuts</span>
                      <ChatShortcutsArrowIcon />
                   </div>

                   <div className="flex flex-row items-center justify-between w-[87.23px] h-[15px]">
                     <span className="text-[#5A5A5A]">@</span>
                      <span className="inter-regular text-[12px] tracking-[0.07em] text-[#5A5A5A]">Mentions</span>
                   </div>

                   <div className="flex flex-row items-center justify-between w-[75px] h-[16px]">
                     <ChatStarIcon />
                      <span className="inter-regular text-[12px] tracking-[0.07em] text-[#5A5A5A]">Starred</span>
                   </div>
                 </div>
                  <div className="w-full h-[79px] gap-[16px]"></div>
              </div>

              {/* All messages - ONLY ROOMS WITH MESSAGES */}
              <div className="flex flex-col w-full h-[490px] gap-[22px]">
                <div className="flex flex-row items-center justify-between w-full h-[16px]">
                   <span className="inter-bold text-[12px] tracking-[0.07em]">
                     {isSearchMode ? 'Search Results' : 'All Messages'}
                   </span>
                   <ChatAllMessagesArrowIcon />
                </div>

                <div className="flex flex-col w-[229px] h-[452px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center w-full h-full text-[#B6B6B6] text-[12px]">
                      Loading...
                    </div>
                  ) : filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center w-full h-full text-[#B6B6B6] text-[12px] gap-2">
                      {isSearchMode ? (
                        <p>No users found.</p>
                      ) : (
                        <>
                          <p>No conversations yet.</p>
                          <p className="text-center text-[10px]">Search for users to start chatting</p>
                        </>
                      )}
                    </div>
                  ) : (
                    filteredChats.map((item, idx) => {
                      // If this is a user search result (not a chat room), show as user profile
                      const isUserResult = item.isSearchResult || (!item.room_id && !item.unread_count && !item.last_message);
                      const displayImg = item.profile_image || item.avatar || item.img || profileimg;
                      const displayName = item.username || item.name || item.display_name || 'Unknown User';
                      const originalIdx = chatList.findIndex(c => (c.id || c._id) === (item.id || item._id));
                      
                      if (isUserResult) {
                        return (
                          <div
                            key={item.id || item.email}
                            className="w-full h-[50px] px-[10px] py-[10px] cursor-pointer hover:bg-gray-100"
                            onClick={() => handleUserClick(item)}
                          >
                            <div className="flex flex-row items-center w-[115px] h-[30px] gap-[5px]">
                              <img src={displayImg} alt="User" className="w-[30px] h-[30px] rounded-[50%] object-cover" />
                              <div className="flex flex-col justify-between w-full h-[30px]">
                                <span className="inter-bold text-[12px] tracking-[0.07em] whitespace-nowrap overflow-hidden text-ellipsis">
                                  {item.first_name} {item.last_name}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Only render chat rooms that have messages
                      if (!item.hasMessages) {
                        return null; // Skip empty rooms
                      }
                      
                      // Render chat room with messages
                      return (
                        <div
                          key={item.id}
                          className={`w-full h-[50px] ${selectedChatIdx === originalIdx ? "bg-[#F6F3FF]" : ""} px-[10px] py-[10px] cursor-pointer hover:bg-gray-100`}
                          onClick={() => handleChatSelect(originalIdx, item)}
                        >
                          <div className="flex flex-row items-center justify-between w-[201px] h-[30px]">
                            <div className="flex flex-row w-[115px] h-[30px] gap-[5px]">
                              <img src={displayImg} alt="User" className="w-[30px] h-[30px] rounded-[50%] object-cover" />
                              <div className="flex flex-col justify-between w-full h-[30px]">
                                <span className="inter-bold text-[12px] tracking-[0.07em]">
                                  {item.first_name} {item.last_name}
                                </span>
                                <span className="inter-regular text-[8px] tracking-[0.07em] text-[#B6B6B6]">
                                  {item.lastMessageTime ? new Date(item.lastMessageTime).toLocaleTimeString() : ""}
                                </span>
                                {item.lastMessage && (
                                  <span className="inter-regular text-[8px] text-[#70707C] truncate max-w-[80px]">
                                    {item.lastMessage}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Unread count bubble - ONLY shows when > 0 */}
                            {(item.unread_count > 0) && (
                              <div
                                className="flex items-center justify-center"
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  background: "#6A37F5",
                                  opacity: 1,
                                }}
                              >
                                <span className="inter-regular text-[10px] tracking-[0.07em] text-white">
                                  {item.unread_count}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
           </div>

          {/* Chat Main Area and Details section in a flex row */}
          <div className="flex flex-row flex-1 h-full overflow-hidden">
            <ChatMainArea
              chatList={chatList}
              selectedChatIdx={selectedChatIdx}
              input={input}
              handleInputChange={handleInputChange}
              handleKeyDown={handleKeyDown}
              handleSend={handleSend}
              messages={messages}
              setMessages={setMessages}
              selectedUser={selectedUser}
              setInput={setInput}
            />
            {/* Details section */}
            <ChatDetails
              activeTab={activeTab}
              handleTabClick={handleTabClick}
              files={files}
              photos={photos}
              showAllPhotos={showAllPhotos}
              handleViewAllPhotos={handleViewAllPhotos}
            />
          </div>

          {/* Right Sidebar */}
          <RightSidebar />
        </div>
      </div>
    </>
  );
};

export default ChatHome;