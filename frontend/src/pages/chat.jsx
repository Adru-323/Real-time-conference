

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



// 1st og hai //2nd gemini // 3rd web rtc included 



import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import api from "../api";
import { useAuth } from "../authContext.js";
import { socket } from "../socket";
import VideoCall from "../components/VideoCall.jsx";

function Chat({ currentUserId }) {
  const { receiverId } = useParams();
  const location = useLocation();

  const { user } = useAuth();
  const myId = (currentUserId || user?._id || "").toString();

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

    api
      .get(`/api/auth/user/${receiverId}`)
      .then((res) => {
        if (res.data?.user?.username) {
          setReceiverName(res.data.user.username);
        }
      })
      .catch((err) => {
        console.error("Receiver name fetch error:", err);
      });
  }, [receiverId]);

  useEffect(() => {
    let active = true;

    api
      .get(`/api/auth/messages/${receiverId}`)
      .then((res) => {
        if (active) {
          const history = res.data.messages || [];
          setMessages((current) => {
            const byId = new Map(history.map((message) => [message._id, message]));
            current.forEach((message) => {
              const senderId = (message.sender?._id || message.sender)?.toString();
              const receiverIdFromMessage = (message.receiver?._id || message.receiver)?.toString();
              const belongsToConversation =
                (senderId === myId && receiverIdFromMessage === receiverId) ||
                (senderId === receiverId && receiverIdFromMessage === myId);
              if (belongsToConversation) byId.set(message._id, message);
            });
            return [...byId.values()].sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          });
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || "Could not load conversation history");
        }
      });

    return () => {
      active = false;
    };
  }, [receiverId, myId]);

  // Naya message aane par auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket logic
  useEffect(() => {
    if (!user) return undefined;

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
  }, [receiverId, user]);

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

      {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

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
