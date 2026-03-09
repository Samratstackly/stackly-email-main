import React,{useState,useEffect} from "react";
import {Navbar} from "./Navbar/Navbar";
import { AppNavBar } from "./Navbar/AppNavBar";
import { Sidebar } from "./Sidebar";
import { InboxList } from "./InboxList";
import { MailView } from "./MailView";
import { RightSidebar } from "./RightSidebar";
import { useSmoothNavigation } from "../../../hooks/useSmoothNavigation";
import { getDraftMails, getInboxMails, getSentMails, getSpamMails,getArchivedMails,getTrashMails,toggleReadMail,getStarredMails, archiveMail, deleteMail, unarchiveMail, toggleStarMail, restoreMail } from "../../../api/api";
import { ComposeModal } from "./ComposeSection/ComposeModal";

const Home = () => {
  const { visible, smoothNavigate } = useSmoothNavigation(1000);
  // const [mails, setMails] = useState([]);
  const [inboxMails, setInboxMails] = useState([]);
const [sentMails, setSentMails] = useState([]);
const [draftMails, setDraftMails] = useState([]);
const [spamMails, setSpamMails] = useState([]);
const [archivedMails, setArchivedMails] = useState([]);
const [trashMails, setTrashMails] = useState([]);
const [favoriteMails, setFavoriteMails] = useState([]);
  const [selectedMail, setSelectedMail] = useState(null);
  const [selectedMailbox, setSelectedMailbox] = useState("inbox");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const normalizeMail = (mail) => ({
  ...mail,
  id: mail.id || mail.mail_id || mail.email_id,
  from:
    mail.from ||
    mail.sender_email ||
    mail.sender_id ||
    "",
  to:
    mail.to ||
    mail.receiver_email ||
    mail.receiver_id ||
    "",
  date:
    mail.date ||
    mail.created_at ||
    mail.updated_at ||
    null,
});


  // const loadMailbox = async (mailbox) => {
  //   try {
  //     let response;

  //     switch (mailbox) {
  //       case "inbox":
  //         response = await getInboxMails();
  //         break;
  //       case "sent":
  //         response = await getSentMails();
  //         break;
  //       case "drafts":
  //         response = await getDraftMails();
  //         break;
  //       case "junk":
  //         response = await getSpamMails();
  //         break;
  //       case "favorite":
  //         response = await getStarredMails();
  //         break;
  //       case "trash":
  //         response = await getTrashMails();
  //         break;
  //       case "archived":
  //         response = await getArchivedMails();
  //         break;
  //       default:
  //       // response = await getInboxMails();
  //     }

  //     const normalized = response.data.map((mail) => ({
  //       ...mail,
  //       from: mail.from || mail.sender_email || mail.sender_id || "",
  //       to: mail.to || mail.receiver_email || mail.receiver_id || "",
  //       date: mail.date || mail.created_at || mail.updated_at || null,
  //     }));

  //     setMails(normalized);
  //     setSelectedMailbox(mailbox);
  //     setSelectedMail(null);
  //   } catch (error) {
  //     console.error("Failed to load mailbox:", error);
  //     setMails([]);
  //   }
  // };

  const loadMailbox = async (mailbox) => {
    try {
      let response;

      switch (mailbox) {
        case "inbox":
          response = await getInboxMails();
          // setInboxMails(response.data);
          setInboxMails(response.data.map(normalizeMail));
          break;
        // case "inbox":
        //   response = await getInboxMails();
        //   setInboxMails(
        //     response.data
        //       .filter((mail) => mail.receiver_email === currentUser.email)
        //       .map(normalizeMail),
        //   );
        //   break;

        case "sent":
          response = await getSentMails();
          // setSentMails(response.data);
          //        setSentMails(
          //   response.data.map(mail => ({
          //     ...mail,
          //     to: mail.receiver_email,   // 🔥 IMPORTANT
          //     from: mail.sender_email,
          //     date: mail.created_at      // 🔥 IMPORTANT
          //   }))
          // );
          setSentMails(response.data.map(normalizeMail));
          break;

        case "drafts":
          response = await getDraftMails();
          // setDraftMails(response.data);
          setDraftMails(response.data.map(normalizeMail));
          break;

        case "junk":
          response = await getSpamMails();
          // setSpamMails(response.data);
          setSpamMails(response.data.map(normalizeMail));
          break;

        case "archived":
          response = await getArchivedMails();
          // setArchivedMails(response.data);
          setArchivedMails(response.data.map(normalizeMail));
          break;

        case "trash":
          response = await getTrashMails();
          // setTrashMails(response.data);
          setTrashMails(response.data.map(normalizeMail));
          break;
        case "favorite":
          response = await getStarredMails();
          setFavoriteMails(response.data.map(normalizeMail));
          break;

        default:
          return;
      }

      // setSelectedMailbox(mailbox);
      setSelectedMail(null);
    } catch (error) {
      console.error("Failed to load mailbox:", error);
    }
  };

//   useEffect(() => {
//   loadMailbox("inbox");
// }, []);


useEffect(() => {
  if (selectedMailbox) {
    loadMailbox(selectedMailbox);
  }
}, [selectedMailbox]);

  const mails =
    selectedMailbox === "inbox"
      ? inboxMails
      : selectedMailbox === "sent"
        ? sentMails
        : selectedMailbox === "drafts"
          ? draftMails
          : selectedMailbox === "junk"
            ? spamMails
            : selectedMailbox === "archived"
              ? archivedMails
              : selectedMailbox === "trash"
                ? trashMails
                : selectedMailbox === "favorite"
                  ? favoriteMails
                  : [];

  // const handleArchive = async (mailId) => {
  //   try {
  //     const mail = mails.find((m) => m.id === mailId);
  //     if (!mail) return;

  //     const newValue = !mail.is_archived;

  //     await toggleArchiveMail(mailId, newValue);

  //     // If archiving from inbox
  //     if (selectedMailbox === "inbox" && newValue) {
  //       selectNextMail(mailId);
  //       return;
  //     }

  //     // If unarchiving from archive
  //     if (selectedMailbox === "archived" && !newValue) {
  //       selectNextMail(mailId);
  //       return;
  //     }

  //     // Otherwise just update state
  //     setMails((prev) =>
  //       prev.map((m) =>
  //         m.id === mailId ? { ...m, is_archived: newValue } : m,
  //       ),
  //     );
  //   } catch (err) {
  //     console.error("Archive failed", err);
  //   }
  // };

//   const handleArchive = async (mailId) => {
//   try {
//     await archiveMail(mailId);

//     // remove from current mailbox immediately
//     setMails(prev => prev.filter(m => m.id !== mailId));
//     setSelectedMail(null);
//   } catch (err) {
//     console.error("Archive failed", err);
//   }
// };

const handleArchive = async (mailId) => {
  try {
    await archiveMail(mailId);

    if (selectedMailbox === "inbox") {
      setInboxMails(prev => prev.filter(m => m.id !== mailId));
    }

    if (selectedMailbox === "sent") {
      setSentMails(prev => prev.filter(m => m.id !== mailId));
    }

    if (selectedMailbox === "drafts") {
      setDraftMails(prev => prev.filter(m => m.id !== mailId));
    }

    setSelectedMail(null);
  } catch (err) {
    console.error("Archive failed", err);
  }
};


const handleUnarchive = async (mailId) => {
  try {
    await unarchiveMail(mailId);

    // remove from archive UI
    if (selectedMailbox === "archived") {
  setArchivedMails(prev => prev.filter(m => m.id !== mailId));
}
    setSelectedMail(null);
  } catch (err) {
    console.error("Unarchive failed", err);
  }
};

  const handleDelete = async (mailId) => {
    if (!mailId) return;

    try {
      await deleteMail(mailId);

      // Remove from current mailbox view
      // selectNextMail(mailId);
        if (selectedMailbox === "inbox") {
      setInboxMails(prev => prev.filter(m => m.id !== mailId));
    }

    if (selectedMailbox === "sent") {
      setSentMails(prev => prev.filter(m => m.id !== mailId));
    }

    if (selectedMailbox === "drafts") {
      setDraftMails(prev => prev.filter(m => m.id !== mailId));
    }
     setSelectedMail(null);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleToggleRead = async (mailId) => {
    try {
      await toggleReadMail(mailId);

      setMails((prev) =>
        prev.map((m) => (m.id === mailId ? { ...m, isRead: !m.isRead } : m)),
      );
    } catch (err) {
      console.error("Read toggle failed", err);
    }
  };

//   const handleToggleStar = async (mailId) => {
//   try {
//     const mail = mails.find((m) => m.id === mailId);
//     if (!mail) return;

//     const newValue = !mail.is_favorite;
//     await toggleStarMail(mailId, newValue);

//     if (selectedMailbox === "favorite" && !newValue) {
//       setFavoriteMails(prev => prev.filter(m => m.id !== mailId));
//       setSelectedMail(null);
//       return; 
//     }

//     if (selectedMailbox === "inbox") {
//       setInboxMails(prev =>
//         prev.map(m =>
//           m.id === mailId ? { ...m, is_favorite: newValue } : m
//         )
//       );
//     }

//     if (selectedMailbox === "sent") {
//       setSentMails(prev =>
//         prev.map(m =>
//           m.id === mailId ? { ...m, is_favorite: newValue } : m
//         )
//       );
//     }

//     if (selectedMail?.id === mailId) {
//       setSelectedMail(prev => ({
//         ...prev,
//         is_favorite: newValue,
//       }));
//     }

//    if (newValue) {
//       setFavoriteMails(prev => [...prev, { ...mail, is_favorite: true }]);
//     } else {
//       setFavoriteMails(prev => prev.filter(m => m.id !== mailId));
//     }

//   } catch (err) {
//     console.error("Star failed", err);
//   }
// };

const handleToggleStar = async (mailId) => {
  try {
    const mail =
      inboxMails.find(m => m.id === mailId) ||
      sentMails.find(m => m.id === mailId) ||
      favoriteMails.find(m => m.id === mailId);

    if (!mail) return;

    const newValue = !mail.is_favorite;
    await toggleStarMail(mailId, newValue);

    // ✅ Update Inbox (DO NOT REMOVE)
    setInboxMails(prev =>
      prev.map(m =>
        m.id === mailId ? { ...m, is_favorite: newValue } : m
      )
    );

    // ✅ Update Sent
    setSentMails(prev =>
      prev.map(m =>
        m.id === mailId ? { ...m, is_favorite: newValue } : m
      )
    );

    // ✅ Update selected mail
    if (selectedMail?.id === mailId) {
      setSelectedMail(prev => ({ ...prev, is_favorite: newValue }));
    }

    // ✅ Favourite list = filter result
    if (newValue) {
      setFavoriteMails(prev =>
        prev.some(m => m.id === mailId)
          ? prev
          : [...prev, { ...mail, is_favorite: true }]
      );
    } else {
      setFavoriteMails(prev =>
        prev.filter(m => m.id !== mailId)
      );
    }

  } catch (err) {
    console.error("Star failed", err);
  }
};


  const handleRestore = async (mailId) => {
    try {
      await restoreMail(mailId);
        const restoredMail = trashMails.find(m => m.id === mailId);
    if (!restoredMail) return;
    setTrashMails(prev => prev.filter(m => m.id !== mailId));
    setInboxMails(prev => [restoredMail, ...prev]);
    //  setSelectedMailbox("inbox");
    setSelectedMail(null);

      // setTrashMails((prev) => prev.filter((m) => m.id !== mailId));
      // setSelectedMail(null);
      // setSelectedMailbox("inbox");
      // await loadMailbox("inbox");
      // selectNextMail(mailId);
    } catch (err) {
      console.error("Restore failed", err);
    }
  };

  // const selectNextMail = (removedId) => {
  //   setMails((prev) => {
  //     const updated = prev.filter((m) => m.id !== removedId);

  //     if (updated.length > 0) {
  //       setSelectedMail(updated[0]); // open next mail like Gmail
  //     } else {
  //       setSelectedMail(null);
  //     }

  //     return updated;
  //   });
  // };

  const selectNextMail = (removedId) => {
  if (selectedMailbox === "inbox") {
    setInboxMails(prev => {
      const updated = prev.filter(m => m.id !== removedId);
      setSelectedMail(updated[0] || null);
      return updated;
    });
  }

  if (selectedMailbox === "sent") {
    setSentMails(prev => {
      const updated = prev.filter(m => m.id !== removedId);
      setSelectedMail(updated[0] || null);
      return updated;
    });
  }

  if (selectedMailbox === "drafts") {
    setDraftMails(prev => {
      const updated = prev.filter(m => m.id !== removedId);
      setSelectedMail(updated[0] || null);
      return updated;
    });
  }
};

  return (
    <>
      <div
        className={`w-full flex flex-col overflow-hidden transition-all duration-1000 ease-in-out
        ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <Navbar />
        <AppNavBar />
        <div className="flex h-[700px] h-screen overflow-hidden">
          <Sidebar
            selectedMailbox={selectedMailbox}
            setSelectedMailbox={setSelectedMailbox}
            loadMailbox={loadMailbox}
          />
          <InboxList
            mails={mails}
            selectedMail={selectedMail}
            setSelectedMail={setSelectedMail}
            selectedMailbox={selectedMailbox}
            setIsComposeOpen={setIsComposeOpen}
            setDraftData={setDraftData}
            onToggleStar={handleToggleStar}
          />
          <MailView
            mail={selectedMail}
            mails={mails}
            selectedMailbox={selectedMailbox}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onToggleStar={handleToggleStar}
            onToggleRead={handleToggleRead}
            onUnarchive={handleUnarchive}
            setSelectedMail={setSelectedMail}
            onRestore={handleRestore} 
          />
          <RightSidebar />
          <ComposeModal
            isOpen={isComposeOpen}
            onClose={async () => {
              setIsComposeOpen(false);
              setDraftData(null);
              if (selectedMailbox === "drafts") {
                await loadMailbox("drafts");
              }
            }}
            // onSendSuccess={async() =>{await loadMailbox("sent")}}
            // onSendSuccess={() => {setSelectedMailbox("sent")}}
            // onSendSuccess={()=>{}}
            onSendSuccess={async () => {
              await loadMailbox("sent");
              setSelectedMailbox("sent");
            }}
            draftData={draftData}
          />
        </div>
      </div>
    </>
  );
};
export default Home;
