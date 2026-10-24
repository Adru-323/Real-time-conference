
// import { useCallback, useEffect, useRef, useState } from "react";
// import { socket } from "../socket";

// const rtcConfig = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//   ],
// }; //Stun server se public ID find ki 

// export default function VideoCall({ receiverId }) {
//   const localVideo = useRef(null);
//   const remoteVideo = useRef(null);
//   const pcRef = useRef(null);
//   const localStreamRef = useRef(null);
//   const remoteUserRef = useRef(null);
//   const pendingIce = useRef([]);

//   const [incoming, setIncoming] = useState(null);
//   const [status, setStatus] = useState("idle");
//   const [localStream, setLocalStream] = useState(null);
//   const [remoteStream, setRemoteStream] = useState(null);
//   const [error, setError] = useState("");

//   const getMedia = useCallback(async () => {
//     if (localStreamRef.current) return localStreamRef.current;

//     const stream = await navigator.mediaDevices.getUserMedia({
//       audio: true,
//       video: true,
//     });

//     localStreamRef.current = stream;
//     setLocalStream(stream);
//     return stream;
//   }, []);

//   const createPeer = useCallback(async (userId) => {
//     if (pcRef.current) return pcRef.current;

//     const stream = await getMedia();
//     const pc = new RTCPeerConnection(rtcConfig);

//     pcRef.current = pc;
//     remoteUserRef.current = userId.toString();
//     pendingIce.current = [];

//     stream.getTracks().forEach((track) => {
//       pc.addTrack(track, stream);
//     });

//     pc.ontrack = (event) => {
//       if (event.streams[0]) setRemoteStream(event.streams[0]);
//     };

//     pc.onicecandidate = (event) => {
//       if (event.candidate && remoteUserRef.current) {
//         socket.emit("webrtc-ice-candidate", {
//           to: remoteUserRef.current,
//           candidate: event.candidate,
//         });
//       }
//     };

//     pc.onconnectionstatechange = () => {
//       if (pc.connectionState === "connected") {
//         setStatus("connected");
//       } else if (pc.connectionState === "failed") {
//         setStatus("failed");
//         setError("Connection fail hua. TURN server ki zarurat ho sakti hai.");
//       } else if (pc.connectionState === "disconnected") {
//         setStatus("reconnecting");
//       };
//     };

//     return pc;
//   }, [getMedia]);

//   const addPendingIce = useCallback(async (pc) => {
//     const queued = pendingIce.current.splice(0);

//     for (const candidate of queued) {
//       try {
//         await pc.addIceCandidate(new RTCIceCandidate(candidate));
//       } catch (err) {
//         console.error("ICE candidate error:", err);
//       }
//     }
//   }, []);

//   const startCall = useCallback(async () => {
//     try {
//       if (!receiverId) throw new Error("Receiver ID missing");
//       if (!socket.connected) throw new Error("Socket connected nahi hai");

//       setError("");
//       await createPeer(receiverId);
//       setStatus("calling");
//       socket.emit("call-user", { to: receiverId });
//     } catch (err) {
//       setError(err.message);
//     }
//   }, [receiverId, createPeer]);

//   const acceptCall = useCallback(async () => {
//     try {
//       if (!incoming?.from) return;

//       await createPeer(incoming.from);
//       setStatus("connecting");
//       socket.emit("call-accepted", { to: incoming.from });
//       setIncoming(null);
//     } catch (err) {
//       setError(err.message || "Call accept nahi hui");
//     }
//   }, [incoming, createPeer]);

//   const endCall = useCallback((notify = true) => {
//     const target = remoteUserRef.current || incoming?.from || receiverId;

//     if (notify && target && socket.connected) {
//       socket.emit("end-call", { to: target });
//     }

//     pcRef.current?.close();
//     pcRef.current = null;

//     localStreamRef.current?.getTracks().forEach((track) => track.stop());
//     localStreamRef.current = null;
//     remoteUserRef.current = null;
//     pendingIce.current = [];

//     setLocalStream(null);
//     setRemoteStream(null);
//     setIncoming(null);
//     setStatus("idle");
//     setError("");
//   }, [incoming, receiverId]);

//   useEffect(() => {
//     const onIncoming = ({ from }) => {
//       if (from?.toString() !== receiverId?.toString()) return;
//       setIncoming({ from });
//     };

//     const onAccepted = async ({ from }) => {
//       try {
//         if (from?.toString() !== receiverId?.toString()) return;

//         const pc = pcRef.current;
//         if (!pc) return;

//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);

//         socket.emit("webrtc-offer", {
//           to: from,
//           offer: pc.localDescription,
//         });
//       } catch (err) {
//         setError(err.message || "Offer create nahi hua");
//       }
//     };

//     const onOffer = async ({ from, offer }) => {
//       try {
//         if (from?.toString() !== receiverId?.toString()) return;

//         const pc = pcRef.current;
//         if (!pc) {
//           setError("Incoming call pehle accept karo.");
//           return;
//         }

//         await pc.setRemoteDescription(
//           new RTCSessionDescription(offer)
//         );
//         await addPendingIce(pc);

//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);

//         socket.emit("webrtc-answer", {
//           to: from,
//           answer: pc.localDescription,
//         });
//       } catch (err) {
//         setError(err.message || "Offer process nahi hua");
//       }
//     };

//     const onAnswer = async ({ from, answer }) => {
//       try {
//         if (from?.toString() !== receiverId?.toString()) return;

//         const pc = pcRef.current;
//         if (!pc || pc.signalingState !== "have-local-offer") return;

//         await pc.setRemoteDescription(
//           new RTCSessionDescription(answer)
//         );
//         await addPendingIce(pc);
//       } catch (err) {
//         setError(err.message || "Answer process nahi hua");
//       }
//     };

//     const onCandidate = async ({ from, candidate }) => {
//       if (from?.toString() !== receiverId?.toString()) return;

//       const pc = pcRef.current;
//       if (!pc || !pc.remoteDescription) {
//         pendingIce.current.push(candidate);
//         return;
//       }

//       try {
//         await pc.addIceCandidate(new RTCIceCandidate(candidate));
//       } catch (err) {
//         console.error("ICE candidate error:", err);
//       }
//     };

//     const onEnded = ({ from }) => {
//       if (from?.toString() === receiverId?.toString()) {
//         endCall(false);
//       }
//     };

//     socket.on("incoming-call", onIncoming);
//     socket.on("call-accepted", onAccepted);
//     socket.on("webrtc-offer", onOffer);
//     socket.on("webrtc-answer", onAnswer);
//     socket.on("webrtc-ice-candidate", onCandidate);
//     socket.on("call-ended", onEnded);

//     return () => {
//       socket.off("incoming-call", onIncoming);
//       socket.off("call-accepted", onAccepted);
//       socket.off("webrtc-offer", onOffer);
//       socket.off("webrtc-answer", onAnswer);
//       socket.off("webrtc-ice-candidate", onCandidate);
//       socket.off("call-ended", onEnded);
//     };
//   }, [receiverId, addPendingIce, endCall]);

//   useEffect(() => {
//     if (localVideo.current) localVideo.current.srcObject = localStream;
//   }, [localStream]);

//   useEffect(() => {
//     if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
//   }, [remoteStream]);

//   const toggleMic = () => {
//     localStreamRef.current?.getAudioTracks().forEach((track) => {
//       track.enabled = !track.enabled;
//     });
//   };

//   const toggleCamera = () => {
//     localStreamRef.current?.getVideoTracks().forEach((track) => {
//       track.enabled = !track.enabled;
//     });
//   };

//   return (
//     <section>
//       <h3>Audio / Video Call</h3>
//       <p>Status: {status}</p>

//       {incoming && (
//         <div>
//           <p>Incoming call from {incoming.from}</p>
//           <button onClick={acceptCall}>Accept</button>
//           <button onClick={() => endCall(true)}>Reject</button>
//         </div>
//       )}

//       <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
//         <div>
//           <p>My video</p>
//           <video
//             ref={localVideo}
//             autoPlay
//             muted
//             playsInline
//             style={{ width: 240, background: "#222" }}
//           />
//         </div>

//         <div>
//           <p>Remote video</p>
//           <video
//             ref={remoteVideo}
//             autoPlay
//             playsInline
//             style={{ width: 240, background: "#222" }}
//           />
//         </div>
//       </div>

//       <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
//         <button onClick={startCall} disabled={status !== "idle" || !!incoming}>
//           Start call
//         </button>
//         <button onClick={toggleMic} disabled={!localStream}>
//           Mute / Unmute
//         </button>
//         <button onClick={toggleCamera} disabled={!localStream}>
//           Camera on / off
//         </button>
//         <button onClick={() => endCall(true)}>
//           End call
//         </button>
//       </div>

//       {error && <p style={{ color: "red" }}>{error}</p>}
//     </section>
//   );
// }





// ====== new gemini 
import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../socket";

const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoCall({ receiverId, isOpen, onClose ,receiverName}) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteUserRef = useRef(null);
  const pendingIce = useRef([]);

  const [incoming, setIncoming] = useState(null);
  const [status, setStatus] = useState("idle");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState("");

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  // Call active state: Taaki accept karne ke baad bhi modal open rahe
  const [isCallActive, setIsCallActive] = useState(false);

  const getMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const createPeer = useCallback(
    async (userId) => {
      if (pcRef.current) return pcRef.current;

      const stream = await getMedia();
      const pc = new RTCPeerConnection(rtcConfig);

      pcRef.current = pc;
      remoteUserRef.current = userId.toString();
      pendingIce.current = [];

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        if (event.streams[0]) setRemoteStream(event.streams[0]);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && remoteUserRef.current) {
          socket.emit("webrtc-ice-candidate", {
            to: remoteUserRef.current,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setStatus("connected");
        } else if (pc.connectionState === "failed") {
          setStatus("failed");
          setError("Connection fail hua. TURN server ki zarurat ho sakti hai.");
        } else if (pc.connectionState === "disconnected") {
          setStatus("reconnecting");
        }
      };

      return pc;
    },
    [getMedia]
  );

  const addPendingIce = useCallback(async (pc) => {
    const queued = pendingIce.current.splice(0);

    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("ICE candidate error:", err);
      }
    }
  }, []);

  const startCall = useCallback(async () => {
    try {
      if (!receiverId) throw new Error("Receiver ID missing");
      if (!socket.connected) throw new Error("Socket connected nahi hai");

      setError("");
      await createPeer(receiverId);
      setStatus("calling");
      setIsCallActive(true); // Call active kiya
      socket.emit("call-user", { to: receiverId });
    } catch (err) {
      setError(err.message);
    }
  }, [receiverId, createPeer]);

  const acceptCall = useCallback(async () => {
    try {
      if (!incoming?.from) return;

      await createPeer(incoming.from);
      setStatus("connecting");
      setIsCallActive(true); // Receiver ke liye modal open rakhega
      socket.emit("call-accepted", { to: incoming.from });
      setIncoming(null);
    } catch (err) {
      setError(err.message || "Call accept nahi hui");
    }
  }, [incoming, createPeer]);

  const endCall = useCallback(
    (notify = true) => {
      const target = remoteUserRef.current || incoming?.from || receiverId;

      if (notify && target && socket.connected) {
        socket.emit("end-call", { to: target });
      }

      pcRef.current?.close();
      pcRef.current = null;

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      remoteUserRef.current = null;
      pendingIce.current = [];

      setLocalStream(null);
      setRemoteStream(null);
      setIncoming(null);
      setIsCallActive(false); // Reset call state
      setStatus("idle");
      setError("");

      if (onClose) onClose();
    },
    [incoming, receiverId, onClose]
  );

  useEffect(() => {
    const onIncoming = ({ from }) => {
      if (from?.toString() !== receiverId?.toString()) return;
      setIncoming({ from });
    };

    const onAccepted = async ({ from }) => {
      try {
        if (from?.toString() !== receiverId?.toString()) return;

        const pc = pcRef.current;
        if (!pc) return;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("webrtc-offer", {
          to: from,
          offer: pc.localDescription,
        });
      } catch (err) {
        setError(err.message || "Offer create nahi hua");
      }
    };

    const onOffer = async ({ from, offer }) => {
      try {
        if (from?.toString() !== receiverId?.toString()) return;

        const pc = pcRef.current;
        if (!pc) {
          setError("Incoming call pehle accept karo.");
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await addPendingIce(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          to: from,
          answer: pc.localDescription,
        });
      } catch (err) {
        setError(err.message || "Offer process nahi hua");
      }
    };

    const onAnswer = async ({ from, answer }) => {
      try {
        if (from?.toString() !== receiverId?.toString()) return;

        const pc = pcRef.current;
        if (!pc || pc.signalingState !== "have-local-offer") return;

        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await addPendingIce(pc);
      } catch (err) {
        setError(err.message || "Answer process nahi hua");
      }
    };

    const onCandidate = async ({ from, candidate }) => {
      if (from?.toString() !== receiverId?.toString()) return;

      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) {
        pendingIce.current.push(candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("ICE candidate error:", err);
      }
    };

    const onEnded = ({ from }) => {
      if (from?.toString() === receiverId?.toString()) {
        endCall(false);
      }
    };

    socket.on("incoming-call", onIncoming);
    socket.on("call-accepted", onAccepted);
    socket.on("webrtc-offer", onOffer);
    socket.on("webrtc-answer", onAnswer);
    socket.on("webrtc-ice-candidate", onCandidate);
    socket.on("call-ended", onEnded);

    return () => {
      socket.off("incoming-call", onIncoming);
      socket.off("call-accepted", onAccepted);
      socket.off("webrtc-offer", onOffer);
      socket.off("webrtc-answer", onAnswer);
      socket.off("webrtc-ice-candidate", onCandidate);
      socket.off("call-ended", onEnded);
    };
  }, [receiverId, addPendingIce, endCall]);

  useEffect(() => {
    if (localVideo.current) localVideo.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
  }, [remoteStream]);

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsCameraOff(!track.enabled);
      });
    }
  };

  // Condition: Jab tak call active hai ya koi incoming hai ya caller ne modal khola hai, screen par rahega
  if (!isOpen && !incoming && !isCallActive) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.75)", zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content bg-dark text-white border-secondary shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header border-secondary py-2 px-3">
            <div className="d-flex align-items-center gap-2">
              <span
                className={`badge rounded-pill ${
                  status === "connected"
                    ? "bg-success"
                    : status === "calling" || status === "connecting"
                    ? "bg-warning text-dark"
                    : "bg-secondary"
                }`}
              >
                ● {status.toUpperCase()}
              </span>
              {/* <small className="text-light">User: {receiverId}</small> */}
              <small className="text-light fw-bold">{receiverName || `User: ${receiverId}`}</small>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => endCall(true)}
            ></button>
          </div>

          {/* Video Body */}
          <div
            className="modal-body p-0 position-relative bg-black d-flex align-items-center justify-content-center"
            style={{ height: "420px" }}
          >
            {/* Remote Video */}
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className="w-100 h-100"
              style={{ objectFit: "cover" }}
            />

            {!remoteStream && (
              <div className="position-absolute text-center text-muted">
                <div
                  className="rounded-circle bg-secondary d-inline-flex align-items-center justify-content-center mb-2"
                  style={{ width: "65px", height: "65px", fontSize: "1.5rem" }}
                >
                  👤
                </div>
                <p className="mb-0 small">
                  {status === "calling"
                    ? "Calling..."
                    : status === "connecting"
                    ? "Connecting stream..."
                    : "Waiting for other party..."}
                </p>
              </div>
            )}

            {/* Local Video Thumbnail */}
            <div
              className="position-absolute end-0 bottom-0 m-3 border border-secondary rounded-3 overflow-hidden shadow"
              style={{
                width: "140px",
                height: "95px",
                backgroundColor: "#212529",
                zIndex: 10,
              }}
            >
              <video
                ref={localVideo}
                autoPlay
                muted
                playsInline
                className="w-100 h-100"
                style={{
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                  display: isCameraOff ? "none" : "block",
                }}
              />
              {isCameraOff && (
                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted small">
                  Cam Off
                </div>
              )}
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="alert alert-danger py-1 px-3 mb-0 small text-center rounded-0 border-0">
              {error}
            </div>
          )}

          {/* Incoming Call Alert Bar */}
          {incoming && (
            <div className="p-3 bg-secondary bg-opacity-25 border-top border-secondary d-flex justify-content-between align-items-center">
              <div>
                <strong>Incoming Video Call...</strong>
                <div className="small text-muted">From: {incoming.from}</div>
              </div>
              <div className="d-flex gap-2">
                <button
                  onClick={acceptCall}
                  className="btn btn-success btn-sm px-3"
                >
                  Accept
                </button>
                <button
                  onClick={() => endCall(true)}
                  className="btn btn-danger btn-sm px-3"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="modal-footer border-secondary justify-content-center gap-3 py-3">
            {status === "idle" && (
              <button onClick={startCall} className="btn btn-success px-4 rounded-pill">
                📞 Start Call
              </button>
            )}

            {status !== "idle" && (
              <>
                <button
                  onClick={toggleMic}
                  disabled={!localStream}
                  className={`btn rounded-circle p-2 ${
                    isMuted ? "btn-danger" : "btn-secondary"
                  }`}
                  style={{ width: "45px", height: "45px" }}
                  title="Mute / Unmute"
                >
                  {isMuted ? "🔇" : "🎤"}
                </button>

                <button
                  onClick={toggleCamera}
                  disabled={!localStream}
                  className={`btn rounded-circle p-2 ${
                    isCameraOff ? "btn-danger" : "btn-secondary"
                  }`}
                  style={{ width: "45px", height: "45px" }}
                  title="Camera On / Off"
                >
                  {isCameraOff ? "🚫" : "📷"}
                </button>

                <button
                  onClick={() => endCall(true)}
                  className="btn btn-danger rounded-circle p-2"
                  style={{ width: "45px", height: "45px" }}
                  title="End Call"
                >
                  📞
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}