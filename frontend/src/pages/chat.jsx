

// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { socket } from "../socket";

// function Chat() {
//   const { receiverId } = useParams();

//   const [text, setText] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     console.log("Receiver ID:", receiverId);

//     const handleMessage = (message) => {
//       console.log("MESSAGE RECEIVED:", message);

//       setMessages((prev) => {
//         // Avoid adding the same message twice
//         if (
//           message._id &&
//           prev.some((item) => item._id === message._id)
//         ) {
//           return prev;
//         }

//         return [...prev, message];
//       });
//     };

//     const handleError = (data) => {
//       console.error("MESSAGE ERROR:", data);
//       setError(data?.message || "Message send nahi hua");
//     };

//     const handleConnect = () => {
//       console.log("Socket connected:", socket.id);
//       setError("");
//     };

//     const handleDisconnect = (reason) => {
//       console.log("Socket disconnected:", reason);
//     };

//     socket.on("receive-message", handleMessage);
//     socket.on("message-sent", handleMessage);
//     socket.on("message-error", handleError);
//     socket.on("connect", handleConnect);
//     socket.on("disconnect", handleDisconnect);

//     // Connect if not already connected
//     if (!socket.connected) {
//       socket.connect();
//     }

//     return () => {
//       socket.off("receive-message", handleMessage);
//       socket.off("message-sent", handleMessage);
//       socket.off("message-error", handleError);
//       socket.off("connect", handleConnect);
//       socket.off("disconnect", handleDisconnect);
//     };
//   }, [receiverId]);

//   const sendMessage = (e) => {
//     e.preventDefault();

//     const trimmedText = text.trim();

//     if (!trimmedText) return;

//     if (!receiverId) {
//       setError("Receiver ID nahi mili.");
//       return;
//     }

//     if (!socket.connected) {
//       setError("Socket connected nahi hai. Dobara try karo.");
//       console.error("Socket is not connected!");
//       return;
//     }

//     console.log("Sending message:", {
//       to: receiverId,
//       text: trimmedText,
//     });

//     setError("");

//     socket.emit("send-message", {
//       to: receiverId,
//       text: trimmedText,
//     });

//     setText("");
//   };

//   return (
//     <div style={{ maxWidth: "600px", margin: "30px auto", padding: "16px" }}>
//       <h2>Chat</h2>

//       <p>Receiver ID: {receiverId || "Not found"}</p>

//       <p>
//         Socket status:{" "}
//         {socket.connected ? "Connected" : "Disconnected"}
//       </p>

//       <div
//         style={{
//           minHeight: "250px",
//           border: "1px solid #ccc",
//           padding: "12px",
//           marginBottom: "12px",
//           overflowY: "auto",
//         }}
//       >
//         {messages.length === 0 ? (
//           <p>No messages yet.</p>
//         ) : (
//           messages.map((message, index) => (
//             <p key={message._id || index}>
//               {message.text}
//             </p>
//           ))
//         )}
//       </div>

//       {error && (
//         <p style={{ color: "red" }}>{error}</p>
//       )}

//       <form onSubmit={sendMessage} style={{ display: "flex", gap: "8px" }}>
//         <input
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           placeholder="Message likho..."
//           style={{ flex: 1, padding: "10px" }}
//         />

//         <button type="submit">Send</button>
//       </form>
//     </div>
//   );
// }

// export default Chat;























// import { useEffect, useState, useRef } from "react";
// import { useParams } from "react-router-dom";
// import { socket } from "../socket";
// import VideoCall from "../components/VideoCall.jsx";

// function Chat({ currentUserId }) {
//   const { receiverId } = useParams();

//   // Agar prop se currentUserId nahi mili, toh localStorage se try karega
//   const myId = (currentUserId || localStorage.getItem("userId") || "").toString();

//   const [text, setText] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [error, setError] = useState("");
//   const [isConnected, setIsConnected] = useState(socket.connected);

//   const scrollRef = useRef(null);

//   // Naya message aane par auto-scroll down
//   useEffect(() => {
//     scrollRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   useEffect(() => {
//     console.log("Active Chat Receiver ID:", receiverId);
//     setMessages([]); // Naye user ki chat kholne par purane clear karega

//     const handleMessage = (message) => {
//       console.log("MESSAGE RECEIVED ON CLIENT:", message);

//       const senderId = (message.sender?._id || message.sender)?.toString();
//       const recId = (message.receiver?._id || message.receiver)?.toString();
//       const currentChatPartner = receiverId?.toString();

//       // Check: Message issi chat conversation ka hai ya kisi teesre bande ka?
//       const belongsToThisChat =
//         senderId === currentChatPartner || recId === currentChatPartner;

//       // Agar kisi aur teesre bande ka message hai toh screen par display mat karo
//       if (!belongsToThisChat) {
//         return;
//       }

//       setMessages((prev) => {
//         // Duplicate check
//         if (message._id && prev.some((item) => item._id === message._id)) {
//           return prev;
//         }
//         return [...prev, message];
//       });
//     };

//     const handleError = (data) => {
//       console.error("MESSAGE ERROR:", data);
//       setError(data?.message || "Message send nahi hua");
//     };

//     const handleConnect = () => {
//       console.log("Socket connected:", socket.id);
//       setIsConnected(true);
//       setError("");
//     };

//     const handleDisconnect = (reason) => {
//       console.log("Socket disconnected:", reason);
//       setIsConnected(false);
//     };

//     socket.on("receive-message", handleMessage);
//     socket.on("message-sent", handleMessage);
//     socket.on("message-error", handleError);
//     socket.on("connect", handleConnect);
//     socket.on("disconnect", handleDisconnect);

//     if (!socket.connected) {
//       socket.connect();
//     }

//     return () => {
//       socket.off("receive-message", handleMessage);
//       socket.off("message-sent", handleMessage);
//       socket.off("message-error", handleError);
//       socket.off("connect", handleConnect);
//       socket.off("disconnect", handleDisconnect);
//     };
//   }, [receiverId]);

//   const sendMessage = (e) => {
//     e.preventDefault();

//     const trimmedText = text.trim();
//     if (!trimmedText) return;

//     if (!receiverId) {
//       setError("Receiver ID nahi mili.");
//       return;
//     }

//     if (!socket.connected) {
//       setError("Socket connected nahi hai. Dobara try karo.");
//       return;
//     }

//     setError("");

//     // Backend payload: { to, text }
//     socket.emit("send-message", {
//       to: receiverId,
//       text: trimmedText,
//     });

//     setText("");
//   };

//   return (
//     <div style={{ maxWidth: "600px", margin: "20px auto", padding: "16px", fontFamily: "sans-serif" }}>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
//         <h3 style={{ margin: 0 }}>Chat: {receiverId}</h3>
//         <span style={{ fontSize: "12px", color: isConnected ? "#28a745" : "#dc3545", fontWeight: "bold" }}>
//           ● {isConnected ? "Connected" : "Disconnected"}
//         </span>
//       </div>

//       {/* 2-Way Message Box */}
//       <div
//         style={{
//           minHeight: "350px",
//           maxHeight: "450px",
//           border: "1px solid #ccc",
//           borderRadius: "8px",
//           padding: "16px",
//           marginBottom: "12px",
//           overflowY: "auto",
//           backgroundColor: "#f9f9f9",
//           display: "flex",
//           flexDirection: "column",
//           gap: "8px",
//         }}
//       >
//         {messages.length === 0 ? (
//           <p style={{ textAlign: "center", color: "#888", margin: "auto" }}>
//             No messages yet. Send a message to start chatting!
//           </p>
//         ) : (
//           messages.map((message, index) => {
//             const senderId = (message.sender?._id || message.sender)?.toString();
            
//             // 2-Way logic: Agar sender active user hai ya message-sent event hai
//             const isMe = myId ? senderId === myId : senderId !== receiverId;

//             return (
//               <div
//                 key={message._id || index}
//                 style={{
//                   alignSelf: isMe ? "flex-end" : "flex-start",
//                   maxWidth: "70%",
//                   backgroundColor: isMe ? "#0084ff" : "#e4e6eb",
//                   color: isMe ? "#ffffff" : "#000000",
//                   padding: "8px 14px",
//                   borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
//                   wordBreak: "break-word",
//                 }}
//               >
//                 <div>{message.text}</div>
//                 {message.createdAt && (
//                   <div
//                     style={{
//                       fontSize: "10px",
//                       marginTop: "4px",
//                       textAlign: "right",
//                       opacity: 0.7,
//                     }}
//                   >
//                     {new Date(message.createdAt).toLocaleTimeString([], {
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     })}
//                   </div>
//                 )}
//               </div>
//             );
//           })
//         )}
//         <div ref={scrollRef} />
//       </div>

//       {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}

//       <form onSubmit={sendMessage} style={{ display: "flex", gap: "8px" }}>
//         <input
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           placeholder="Message likho..."
//           disabled={!isConnected}
//           style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
//         />
//         <button
//           type="submit"
//           disabled={!isConnected || !text.trim()}
//           style={{
//             padding: "10px 18px",
//             backgroundColor: "#0084ff",
//             color: "white",
//             border: "none",
//             borderRadius: "6px",
//             cursor: "pointer",
//           }}
//         >
//           Send
//         </button>
//       </form>
//       <VideoCall receiverId={receiverId} />
//     </div>
//   );
// }

// export default Chat;









// 1st og hai //2nd gemini // 3rd web rtc included 



import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios"; // <-- axios import karein
import { socket } from "../socket";
import VideoCall from "../components/VideoCall.jsx";

function Chat({ currentUserId }) {
  const { receiverId } = useParams();
  const location = useLocation();

  const myId = (currentUserId || localStorage.getItem("userId") || "").toString();

  // State me pehle location.state check karega, agar nahi hai toh empty string
  const [receiverName, setReceiverName] = useState(location.state?.receiverName || "");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isCallOpen, setIsCallOpen] = useState(false);

  const scrollRef = useRef(null);

  // Jab bhi receiverId aaye ya change ho, backend se username mangwao
  useEffect(() => {
    if (!receiverId) return;

    axios
      .get( `${import.meta.env.VITE_API_URL}/api/auth/user/${receiverId}`, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data?.user?.username) {
          setReceiverName(res.data.user.username);
        }
      })
      .catch((err) => {
        console.error("Receiver name fetch error:", err);
      });
  }, [receiverId]);

  // Naya message aane par auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket logic
  useEffect(() => {
    setMessages([]);

    const handleMessage = (message) => {
      const senderId = (message.sender?._id || message.sender)?.toString();
      const recId = (message.receiver?._id || message.receiver)?.toString();
      const currentChatPartner = receiverId?.toString();

      const belongsToThisChat =
        senderId === currentChatPartner || recId === currentChatPartner;

      if (!belongsToThisChat) return;

      setMessages((prev) => {
        if (message._id && prev.some((item) => item._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    const handleError = (data) => setError(data?.message || "Message send nahi hua");
    const handleConnect = () => { setIsConnected(true); setError(""); };
    const handleDisconnect = () => setIsConnected(false);

    socket.on("receive-message", handleMessage);
    socket.on("message-sent", handleMessage);
    socket.on("message-error", handleError);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("receive-message", handleMessage);
      socket.off("message-sent", handleMessage);
      socket.off("message-error", handleError);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [receiverId]);

  const sendMessage = (e) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText || !receiverId || !socket.connected) return;

    socket.emit("send-message", {
      to: receiverId,
      text: trimmedText,
    });
    setText("");
  };

  return (
    <div className="container py-4" style={{ maxWidth: "650px" }}>
      <div className="card shadow-sm border-0">
        {/* Chat Header */}
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
          <div>
            {/* Ab yahan username dikhega */}
            <h5 className="mb-0 fw-bold">
              {receiverName || "Loading..."}
            </h5>
            <small className={isConnected ? "text-success fw-semibold" : "text-danger fw-semibold"}>
              ● {isConnected ? "Connected" : "Disconnected"}
            </small>
          </div>
          <button
            onClick={() => setIsCallOpen(true)}
            className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
          >
            <span>📹</span> <span>Call</span>
          </button>
        </div>

        {/* Messages Body */}
        <div
          className="card-body p-3 overflow-auto d-flex flex-column gap-2"
          style={{ height: "400px", backgroundColor: "#f8f9fa" }}
        >
          {messages.length === 0 ? (
            <div className="m-auto text-center text-muted small">
              No messages yet. Send a message to start conversation!
            </div>
          ) : (
            messages.map((message, index) => {
              const senderId = (message.sender?._id || message.sender)?.toString();
              const isMe = myId ? senderId === myId : senderId !== receiverId;

              return (
                <div
                  key={message._id || index}
                  className={`d-flex flex-column ${
                    isMe ? "align-self-end text-white" : "align-self-start text-dark"
                  }`}
                  style={{ maxWidth: "75%" }}
                >
                  <div
                    className={`p-2 px-3 ${
                      isMe ? "bg-primary rounded-start rounded-top" : "bg-white border rounded-end rounded-top"
                    }`}
                    style={{
                      borderRadius: isMe ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                      wordBreak: "break-word",
                    }}
                  >
                    {message.text}
                  </div>
                  {message.createdAt && (
                    <small
                      className={`text-muted mt-1 ${isMe ? "text-end" : "text-start"}`}
                      style={{ fontSize: "10px" }}
                    >
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  )}
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        {/* Footer Input */}
        <div className="card-footer bg-white p-3 border-top">
          <form onSubmit={sendMessage} className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message likho..."
              disabled={!isConnected}
            />
            <button
              type="submit"
              className="btn btn-primary px-4"
              disabled={!isConnected || !text.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* VideoCall Component */}
      <VideoCall
        receiverId={receiverId}
        receiverName={receiverName}
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
      />
    </div>
  );
}

export default Chat;