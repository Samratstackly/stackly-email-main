import { useState, useMemo } from 'react';
import notesimg from "../../../assets/images/3d-notes.png";
import discussion from "../../../assets/images/discussion.png";
import shipment from "../../../assets/images/shipment.png";
import image1 from "../../../assets/images/image1.png";
import image2 from "../../../assets/images/image2.png";
import image3 from "../../../assets/images/image3.png";
import favimage from "../../../assets/images/favimage.png";
import favimage1 from "../../../assets/images/favimage1.png";
import favimage2 from "../../../assets/images/favimage2.png";
import favimage3 from "../../../assets/images/favimage3.png";

export const RightSidebar1 = ({ onClose }) => {
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTask, setNewTask] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [notes, setNotes] = useState([
    { id: 1, title: 'Title here', content: 'Take your notes', bgColor: '#F1F8DC' },
    { id: 2, title: 'Meeting Agenda', content: 'Discuss project updates', bgColor: '#DCF6F8' },
    { id: 3, title: 'Action Items', content: 'Follow up on client feedback', bgColor: '#DCE4F8' },
    { id: 4, title: 'Design Review', content: 'Present new wireframes', bgColor: '#F8DCDC' },
    { id: 5, title: 'Budget Discussion', content: 'quarterly spending', bgColor: '#F1F8DC' },
    { id: 6, title: 'Next Steps', content: 'Plan for next sprint', bgColor: '#DCF8E0' },
  ]);
  const [todos, setTodos] = useState([
    { id: 1, text: 'Finish Design', completed: false },
    { id: 2, text: 'Implement Feedback', completed: false },
    { id: 3, text: 'Conduct User Testing', completed: false },
    { id: 4, text: 'Prepare Final Presentation', completed: false },
    { id: 5, text: 'Prepare Final Presentation', completed: false },
  ]);

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const addTodo = () => {
    if (newTask.trim()) {
      const newTodo = {
        id: todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1,
        text: newTask,
        completed: false
      };
      setTodos([...todos, newTodo]);
      setNewTask('');
    }
  };

  const addNote = () => {
    if (noteTitle.trim() || noteContent.trim()) {
      const colors = ['#F1F8DC', '#DCF6F8', '#DCE4F8', '#F8DCDC', '#DCF8E0'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newNote = {
        id: notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1,
        title: noteTitle.trim() || 'Untitled',
        content: noteContent.trim() || 'No content',
        bgColor: randomColor
      };
      setNotes([newNote, ...notes]);
      setNoteTitle('');
      setNoteContent('');
    }
  };

  // Sample data for contacts
  const contacts = [
    { id: 1, name: 'Michael', image: favimage, isFavorite: true },
    { id: 2, name: 'Sarah', image: favimage1, isFavorite: true },
    { id: 3, name: 'David', image: favimage2, isFavorite: true },
    { id: 4, name: 'Emily', image: favimage3, isFavorite: true },
    { id: 5, name: 'Michael', image: favimage, isFavorite: false },
    { id: 6, name: 'Sarah', image: favimage1, isFavorite: false },
    { id: 7, name: 'David', image: favimage2, isFavorite: false },
    { id: 8, name: 'Emily', image: favimage3, isFavorite: false },
    { id: 9, name: 'Michael', image: favimage, isFavorite: false },
    { id: 10, name: 'Sarah', image: favimage1, isFavorite: false },
    { id: 11, name: 'David', image: favimage2, isFavorite: false },
    { id: 12, name: 'Emily', image: favimage3, isFavorite: false },
    { id: 13, name: 'Michael', image: favimage, isFavorite: false },
    { id: 14, name: 'Sarah', image: favimage1, isFavorite: false },
    { id: 15, name: 'David', image: favimage2, isFavorite: false },
    { id: 16, name: 'Emily', image: favimage3, isFavorite: false },
  ];

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(query)
    );
  }, [searchQuery, contacts]);

  // Separate favorites and all contacts from filtered results
  const favoriteContacts = useMemo(() => 
    filteredContacts.filter(contact => contact.isFavorite),
    [filteredContacts]
  );
  
  const allContacts = useMemo(() => 
    filteredContacts.filter(contact => !contact.isFavorite),
    [filteredContacts]
  );

  const renderContactItem = (contact) => (
    <div key={contact.id} className='flex flex-row w-full h-[24px] gap-[12px]'>
      <img src={contact.image} alt={contact.name} className='w-[24px] h-[24px]' />
      <div className='flex flex justify-between w-[233px] h-[20px]'>
        <span className='inter-regular text-[12px] gap-[20px] tracking-[1px]'>{contact.name}</span>
        <div className='flex flex-row items-center w-[80px] h-[20px] gap-[10px]'>
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.75713 2.885L5.4213 2.13C5.20213 1.63667 5.09213 1.39 4.92796 1.20083C4.72258 0.963927 4.45454 0.789758 4.15463 0.698333C3.91546 0.625 3.64546 0.625 3.10463 0.625C2.31463 0.625 1.91963 0.625 1.58796 0.776667C1.17882 0.975452 0.862115 1.32439 0.703797 1.75083C0.584631 2.095 0.618797 2.44917 0.687131 3.15833C1.41491 10.7 5.54991 14.8347 13.0921 15.5625C13.8005 15.6308 14.1546 15.665 14.4996 15.5458C14.9256 15.3875 15.2742 15.0712 15.473 14.6625C15.6246 14.33 15.6246 13.935 15.6246 13.145C15.6246 12.6042 15.6246 12.3342 15.5513 12.095C15.4599 11.7951 15.2857 11.527 15.0488 11.3217C14.8605 11.1575 14.613 11.0483 14.1196 10.8283L13.3646 10.4933C12.8296 10.2558 12.563 10.1367 12.2913 10.1108C12.0312 10.0859 11.7689 10.1224 11.5255 10.2175C11.2713 10.3167 11.0471 10.5033 10.5971 10.8783C10.1496 11.2508 9.9263 11.4367 9.65296 11.5367C9.3906 11.6274 9.11081 11.6562 8.83546 11.6208C8.54713 11.5792 8.32713 11.4608 7.88546 11.225C6.51463 10.4917 5.75796 9.73583 5.02463 8.36417C4.7888 7.9225 4.6713 7.7025 4.6288 7.41417C4.5933 7.13916 4.62182 6.85967 4.71213 6.5975C4.81213 6.32333 4.9988 6.1 5.3713 5.6525C5.7463 5.2025 5.9338 4.97833 6.03213 4.72417C6.12713 4.48083 6.1638 4.21833 6.1388 3.95833C6.1138 3.68667 5.99463 3.42 5.7563 2.885H5.75713Z" stroke="black" strokeWidth="1.25" strokeLinecap="round"/>
          </svg>

          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.7664 15.9504C14.2531 15.7195 17.0298 12.9029 17.2581 9.36702C17.3023 8.67535 17.3023 7.95869 17.2581 7.26702C17.0298 3.73202 14.2531 0.91702 10.7664 0.68452C9.56219 0.60516 8.35402 0.60516 7.14977 0.68452C3.66311 0.916187 0.886441 3.73202 0.658108 7.26785C0.613964 7.96716 0.613964 8.66855 0.658108 9.36785C0.741441 10.6554 1.31061 11.8479 1.98144 12.8545C2.37061 13.5587 2.11394 14.4379 1.70811 15.207C1.41644 15.7612 1.26977 16.0379 1.38727 16.2379C1.50394 16.4379 1.76644 16.4445 2.29061 16.457C3.32811 16.482 4.02727 16.1887 4.58227 15.7795C4.89644 15.547 5.05394 15.4312 5.16228 15.4179C5.27061 15.4045 5.48477 15.4929 5.91144 15.6679C6.29477 15.8262 6.74061 15.9237 7.14894 15.9512C8.33644 16.0295 9.57727 16.0295 10.7673 15.9512L10.7664 15.9504Z" stroke="black" strokeWidth="1.25" strokeLinejoin="round"/>
            <path d="M8.95368 8.54199H8.96201M12.2837 8.54199H12.2912M5.62451 8.54199H5.63201" stroke="black" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          <svg width="13" height="3" viewBox="0 0 13 3" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.45917 0.625C6.68018 0.625 6.89214 0.712798 7.04842 0.869078C7.2047 1.02536 7.2925 1.23732 7.2925 1.45833C7.2925 1.67935 7.2047 1.89131 7.04842 2.04759C6.89214 2.20387 6.68018 2.29167 6.45917 2.29167C6.23815 2.29167 6.02619 2.20387 5.86991 2.04759C5.71363 1.89131 5.62583 1.67935 5.62583 1.45833C5.62583 1.23732 5.71363 1.02536 5.86991 0.869078C6.02619 0.712798 6.23815 0.625 6.45917 0.625ZM11.4592 0.625C11.6802 0.625 11.8921 0.712798 12.0484 0.869078C12.2047 1.02536 12.2925 1.23732 12.2925 1.45833C12.2925 1.67935 12.2047 1.89131 12.0484 2.04759C11.8921 2.20387 11.6802 2.29167 11.4592 2.29167C11.2382 2.29167 11.0262 2.20387 10.8699 2.04759C10.7136 1.89131 10.6258 1.67935 10.6258 1.45833C10.6258 1.23732 10.7136 1.02536 10.8699 0.869078C11.0262 0.712798 11.2382 0.625 11.4592 0.625ZM1.45833 0.625C1.67935 0.625 1.89131 0.712798 2.04759 0.869078C2.20387 1.02536 2.29167 1.23732 2.29167 1.45833C2.29167 1.67935 2.20387 1.89131 2.04759 2.04759C1.89131 2.20387 1.67935 2.29167 1.45833 2.29167C1.23732 2.29167 1.02536 2.20387 0.869077 2.04759C0.712797 1.89131 0.625 1.67935 0.625 1.45833C0.625 1.23732 0.712797 1.02536 0.869077 0.869078C1.02536 0.712798 1.23732 0.625 1.45833 0.625Z" stroke="black" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="w-[289px] h-full flex flex-col bg-white rounded-[7px] shadow-[-2px_0px_4px_0px_#7E7E7E4F] z-50"
    >
      {/* Popup content goes here */}
      <div className='flex flex-row items-center justify-center w-full h-[50px] border-b border-[#D9D9D9]'>
        <div className='flex flex-row w-[267px] h-[30px] flex items-center justify-between'>
            <div className='flex flex-row items-center w-[114px] h-[30px] gap-[15px]'>
               <div 
                 className={`flex items-center justify-center w-[30px] h-[30px] rounded-[5px] cursor-pointer ${selectedIcon === 'shipment' ? 'bg-[#6A37F5]' : ''}`}
                 onClick={() => setSelectedIcon('shipment')}
               >
                 <img src={shipment} alt="shipment" className='w-[20px] h-[20px]'/>
               </div>
               <div 
                 className={`flex items-center justify-center w-[30px] h-[30px] rounded-[5px] cursor-pointer ${selectedIcon === 'notes' ? 'bg-[#6A37F5]' : ''}`}
                 onClick={() => setSelectedIcon('notes')}
               >
                 <img src={notesimg} alt="notes" className='w-[20px] h-[20px]' />
               </div>
               <div 
                 className={`flex items-center justify-center w-[30px] h-[30px] rounded-[5px] cursor-pointer ${selectedIcon === 'discussion' ? 'bg-[#6A37F5]' : ''}`}
                 onClick={() => setSelectedIcon('discussion')}
               >
                 <img src={discussion} alt="discussion" className='w-[20px] h-[20px]' />
               </div>
            </div>
            <div className='flex items-center justify-center w-[20px] h-[20px] cursor-pointer' onClick={onClose}>
              <div className='flex items-center justify-center w-[16.667px] h-[16.67px] rounded-[50%] bg-[#EDEDED]'>
                <svg width="4" height="8" viewBox="0 0 4 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.625 0.625C0.625 0.625 3.125 3.08 3.125 3.95833C3.125 4.83667 0.625 7.29167 0.625 7.29167" stroke="#6A37F5" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
        </div>
      </div>

      {/* Notes display */}
      {selectedIcon === 'shipment' && (
        <div className="fixed flex flex-col w-[286px] h-[660px] top-[182px] px-[10px] gap-[10px] py-[20px]">
          <span className='inter-regular text-[10px] text-[#686868]'>
            Your <span className='inter-semibold text-[12px] text-black'>Notes</span>
          </span> 
          <div className='flex flex-col w-[270px] h-[111px] gap-[0px]  rounded-[8px] border-[1px] border-[#EAEAEA] relative'>
            <div className='flex items-center w-full h-[44px] bg-[#F4F4F4] rounded-tl-[8px] rounded-tr-[8px]'>
              <input 
                type="text" 
                placeholder="Title here"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className='w-full h-[35px] px-[10px] outline-none inter-regular text-[12px] placeholder:text-[#858585] bg-transparent'
              />
            </div>
            <input 
              type="text" 
              placeholder="Take your notes"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNote()}
              className='w-full h-[67px] rounded-bl-[8px] rounded-br-[8px] px-[10px] outline-none text-[12px] inter-regular placeholder:text-[12px] placeholder:inter-regular'
            />
            <button 
              className='absolute bottom-[0px] right-[0px] w-[53px] h-[35px] p-[10px] gap-[10px] flex items-center justify-center cursor-pointer'
              onClick={addNote}
            >
              <span className='inter-medium text-[12px] text-[#6A37F5]'>Done</span>
            </button>
          </div>

          {/* Notes content Section */}
          <div className='flex flex-col w-[266px] h-full mt-[10px] gap-[12px] overflow-y-auto'>
            {notes.map((note) => (
              <div 
                key={note.id} 
                className='flex flex-col w-full h-[76px] p-[10px] rounded-[8px] gap-[10px]'
                style={{ backgroundColor: note.bgColor }}
              >
                <span className='inter-semibold text-[12px]'>{note.title}</span>
                <span className='inter-regular text-[12px] text-[#383838]'>{note.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* To-do section */}
      {selectedIcon === 'notes' && (
        <div className="fixed flex flex-col w-[286px] h-[690px] top-[182px] px-[10px] gap-[10px] pt-[20px]">
          <span className='inter-regular text-[10px] text-[#686868]'>
            Your <span className='inter-semibold text-[12px] text-[#040B23]'>To-Do Lists</span>
          </span>
          <div className='flex flex-col w-[270px] h-[94px] gap-[0px]  rounded-[8px] border-[1px] border-[#EAEAEA] relative'>
           <input 
            type="text" 
            placeholder="Type your task" 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            className='w-full h-[44px] px-[10px] bg-[#F4F4F4] rounded-tl-[8px] rounded-tr-[8px] outline-none inter-regular text-[12px] placeholder:text-[#858585]'
          />
            <div className='flex items-center justify-between w-[270px] h-[50px] px-[10px] gap-[50px]'>
               <div className='flex flex-row w-[70px] h-[16px] gap-[10px]'>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.3331 11.9993C10.3331 12.3058 10.2728 12.6092 10.1555 12.8923C10.0383 13.1754 9.8664 13.4326 9.64973 13.6493C9.43306 13.8659 9.17584 14.0378 8.89274 14.1551C8.60965 14.2723 8.30623 14.3327 7.99981 14.3327C7.6934 14.3327 7.38998 14.2723 7.10689 14.1551C6.82379 14.0378 6.56657 13.8659 6.3499 13.6493C6.13323 13.4326 5.96136 13.1754 5.8441 12.8923C5.72683 12.6092 5.66648 12.3058 5.66648 11.9993M12.8205 11.9993H3.17981C2.9466 11.9993 2.71864 11.93 2.52477 11.8004C2.3309 11.6707 2.17982 11.4865 2.09063 11.271C2.00144 11.0556 1.97814 10.8185 2.02368 10.5897C2.06922 10.361 2.18155 10.1509 2.34648 9.98602L2.74781 9.58402C3.12267 9.20892 3.33321 8.70031 3.33315 8.17002V6.33268C3.33315 5.09501 3.82481 3.90802 4.69998 3.03285C5.57515 2.15768 6.76214 1.66602 7.99981 1.66602C9.23749 1.66602 10.4245 2.15768 11.2996 3.03285C12.1748 3.90802 12.6665 5.09501 12.6665 6.33268V8.17002C12.6666 8.70041 12.8774 9.20903 13.2525 9.58402L13.6545 9.98602C13.8191 10.151 13.9311 10.3611 13.9765 10.5897C14.0218 10.8183 13.9985 11.0553 13.9093 11.2706C13.8202 11.486 13.6693 11.6701 13.4756 11.7998C13.282 11.9295 13.0536 11.9989 12.8205 11.9993Z" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M10.6667 1.33398V4.00065M5.33333 1.33398V4.00065M2 6.66732H14M8.66667 2.66732H7.33333C4.81933 2.66732 3.562 2.66732 2.78133 3.44865C2.00067 4.22998 2 5.48665 2 8.00065V9.33398C2 11.848 2 13.1053 2.78133 13.886C3.56267 14.6667 4.81933 14.6673 7.33333 14.6673H8.66667C11.1807 14.6673 12.438 14.6673 13.2187 13.886C13.9993 13.1047 14 11.848 14 9.33398V8.00065C14 5.48665 14 4.22932 13.2187 3.44865C12.4373 2.66798 11.1807 2.66732 8.66667 2.66732Z" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>

                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.926 2L11.5947 2.65067C11.8933 2.94133 12.0427 3.08667 11.99 3.21C11.938 3.33333 11.7273 3.33333 11.304 3.33333H6.13065C3.48065 3.33333 1.33398 5.42267 1.33398 8C1.33398 8.99133 1.65198 9.91067 2.19398 10.6667M5.07532 14L4.40665 13.3493C4.10798 13.0587 3.95865 12.9133 4.01132 12.79C4.06332 12.6667 4.27398 12.6667 4.69732 12.6667H9.87065C12.5207 12.6667 14.6673 10.5773 14.6673 8C14.6676 7.04288 14.3667 6.10994 13.8073 5.33333" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
               </div>
               <button 
                 className='w-[53px] h-[35px] p-[10px] gap-[10px] flex items-center justify-center cursor-pointer'
                 onClick={addTodo}
               >
                 <span className='inter-medium text-[12px] text-[#6A37F5]'>Add</span>
               </button>
            </div>
          </div>
          
          {/* To-do content Section */}
           <div className='flex flex-col w-[170px] h-full gap-[14px] mt-[10px] overflow-y-auto'>
            {todos.map((todo) => (
              <div key={todo.id} className='flex flex-row w-full h-[15px] gap-[6px]'>
                <div 
                  className='flex items-center justify-center w-[14px] h-[14px] cursor-pointer'
                  onClick={() => toggleTodo(todo.id)}
                >
                  {todo.completed ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="7" cy="7" r="6.125" fill="#6A37F5" stroke="#6A37F5" strokeWidth="0.875"/>
                      <path d="M4 7L6 9L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 12.25C9.8995 12.25 12.25 9.8995 12.25 7C12.25 4.1005 9.8995 1.75 7 1.75C4.1005 1.75 1.75 4.1005 1.75 7C1.75 9.8995 4.1005 12.25 7 12.25Z" stroke="#6A37F5" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={`inter-regular text-[12px] ${todo.completed ? 'line-through text-[#888]' : ''}`}>
                  {todo.text}
                </span>
              </div>
            ))}
            <button className='w-[43px] h-[20px] rounded-[4px] gap-[10px] bg-[#512ABA14] inter-regular text-[10px] text-[#383838] px-[7px] leading-[23px]'>Today</button>
           </div>

           {/* Bottom div */}
           <div className='flex items-center w-[286px] h-[70px] px-[15px] border-t border-[#D9D9D9] mt-auto'>
              <div className='flex flex-row w-[150px] h-[20px] gap-[5px]'>
                 <div className='flex items-center justify-center w-[20px] h-[20px]'>
                  <svg width="5" height="10" viewBox="0 0 5 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M-4.37114e-07 0C-4.37114e-07 0 5 3.6825 5 5C5 6.3175 0 10 0 10" fill="#040B23"/>
                  </svg>
                 </div>
                  <span className='inter-semibold text-[12px] text-[#040B23] mt-[1px]'>
                    Completed Task ({todos.filter(todo => todo.completed).length})
                  </span>
              </div>
           </div>
        </div>
      )}

      {/* Discussion section */}
      {selectedIcon === 'discussion' && (
        <div className="fixed flex flex-col w-full h-[700px] top-[182px] gap-[18px] px-[10px] py-[10px]">
          <span className='inter-regular text-[10px] text-[#686868]'>
            Organisation <span className='inter-semibold text-[12px] text-black'>Peoples</span>
          </span>
          <div className='flex flex-row items-center w-[269px] h-[34px] gap-[10px] px-[10px] rounded-[8px] border border-[#EAEAEA] bg-white'>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M9.83333 9.83333L12.5 12.5M11.1667 5.83333C11.1667 4.41885 10.6048 3.06229 9.60457 2.0621C8.60438 1.0619 7.24782 0.5 5.83333 0.5C4.41885 0.5 3.06229 1.0619 2.0621 2.0621C1.0619 3.06229 0.5 4.41885 0.5 5.83333C0.5 7.24782 1.0619 8.60438 2.0621 9.60457C3.06229 10.6048 4.41885 11.1667 5.83333 11.1667C7.24782 11.1667 8.60438 10.6048 9.60457 9.60457C10.6048 8.60438 11.1667 7.24782 11.1667 5.83333Z" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

          <input 
             type="text" 
             placeholder="Search People" 
             className='w-full h-full outline-none text-[12px] inter-regular placeholder:text-[#C1C1C1]'
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
          />

        </div>

        {/* Favorite content Section */}
        <div className='flex flex-col w-[269px] h-[175px] gap-[20px]'>
          <span className='inter-bold text-[11px] tracking-[2px]'>Favorites</span>
          <div className='flex flex-col w-[269px] h-[138px] gap-[14px]'>
            {favoriteContacts.length > 0 ? (
              favoriteContacts.map(renderContactItem)
            ) : (
              <div className='flex justify-center items-center h-[24px]'>
                <span className='inter-regular text-[12px] text-[#888]'>
                  {searchQuery ? 'No matching favorites found' : 'No favorites'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* All Contacts Section */}
         <div className='flex flex-col w-[269px] h-[350px] gap-[20px] mt-[10px]'>
          <span className='inter-bold text-[11px] tracking-[1px] '>All Contacts</span>

          {/* Contacts List */}
          <div className='flex flex-col w-[269px] h-[300px] gap-[14px] overflow-y-auto'>
            {allContacts.length > 0 ? (
              allContacts.map(renderContactItem)
            ) : (
              <div className='flex justify-center items-center h-[24px]'>
                <span className='inter-regular text-[12px] text-[#888]'>
                  {searchQuery ? 'No contacts found' : 'No contacts'}
                </span>
              </div>
            )}
          </div>
         </div>
        </div>
      )}
    </div>
  );
};