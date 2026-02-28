import { useEffect, useRef, useState } from "react";
import { useNavigate} from "react-router-dom";
import { TextField, Button, IconButton, Badge } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import {CallEnd , Mic, MicOff, ScreenShare, StopScreenShare, Chat} from "@mui/icons-material";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import io from "socket.io-client";
const serverUrl = "http://localhost:8000";
import styles from "../styles/videoComponent.module.css";
var connections = {};

const peerConfigConnections = {
    "iceServers" : [
        {"urls" : "stun:stun.l.google.com:19302"}
    ]
};

export default function VideoMeet() {
    let routeTo = useNavigate();
    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoRef = useRef();
    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState();

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModel, setShowModel] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([]);

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([]);

    let [videos, setVideos] = useState([]);

    useEffect(() => {
        getPermissions();
    });

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true});    
            if(videoPermission){
                setVideoAvailable(true);
                console.log("Video permission granted.");
            }else{
                setVideoAvailable(false);
                console.log("Video permission denied.");
            }
            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true});    
            if(audioPermission){
                setAudioAvailable(true);
                console.log("Audio permission granted.");
            }else{
                setAudioAvailable(false);
                console.log("Audio permission denied.");
            }
            if(navigator.mediaDevices.getDisplayMedia){
                setScreenAvailable(true);
            }else{
                setScreenAvailable(false);
            }
            if(videoAvailable || audioAvailable){
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable});
                if(userMediaStream){
                    window.localStream = userMediaStream;
                    if(localVideoRef.current){
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (err) {
            console.error("Error accessing media devices.", err.message);
        }   
    };

    useEffect(() => {
        if(video !== undefined && audio !== undefined){
            getUserMedia();
            console.log("SET STATE HAS", video, audio);
        }
    }, [video, audio]);
    
    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach((track) => track.stop());
        } catch (error) {
            console.error("Error stopping existing media tracks.", error.message);
        }
        window.localStream = stream;
        localVideoRef.current.srcObject = stream;
        for(let id in connections){
            if(id === socketIdRef.current) continue;
            connections[id].addStream(window.localStream);
            connections[id].createOffer()
            .then((description)=>{
                connections[id].setLocalDescription(description)
                .then(()=>{
                    socketRef.current.emit("signal", id, JSON.stringify({"sdp" : connections[id].localDescription}));
                })
                .catch((err)=>{
                    console.error("Error creating offer.", err.message);
                });
            });
        }
        stream.getTracks().forEach(track => track.onended = ()=> {
            setVideo(false);
            setAudio(false);
            try{
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }catch(err){
                console.log("Error accessing media devices.", err.message);
            }

            // black silence
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            for(let id in connections){
                connections[id].addStream(window.localStream);
                connections[id].createOffer()
                .then((description)=>{
                    connections[id].setLocalDescription(description)
                    .then(()=>{
                        socketRef.current.emit("signal", id, JSON.stringify({"sdp" : connections[id].localDescription}));
                    })
                    .catch((err)=>{
                        console.log("Error creating offer.", err.message);
                    });
                });
            }
        });
    };

    let getUserMedia = () => {
        if((video && videoAvailable) || (audio && audioAvailable)){
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio})
            .then(getUserMediaSuccess) // todo : getUserMediaSuccess
            .then((stream) => { })
            .catch((err) => {
                console.error("Error accessing media devices.", err.message);
            });
        }else{
            try{
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }catch(err){
                console.error("Error accessing media devices.", err.message);   
            }
        }
    }

    let getDisplayMediaSuccess = (stream) =>{
        try{
            window.localStream.getTracks().forEach((track) => track.stop());
        }catch(err){ console.log(e)}

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for(let id in connections){
            if(id === socketIdRef.current) continue;
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description)=>{
                connections[id].setLocalDescription(description)
                .then(()=>{
                    socketRef.current.emit("signal", id, JSON.stringify({"sdp" : connections[id].localDescription}));
                })
                .catch((err)=> console.log(err) );
            })
        }
        stream.getTracks().forEach(track => track.onended = ()=> {
            setScreen(false);
            try{
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }catch(err){
                console.log("Error accessing media devices.", err.message);
            }

            // black silence
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            getUserMedia();
        });
    };

    let getDisplayMedia = () => {
        if(screen){
            if(navigator.mediaDevices.getDisplayMedia){
                navigator.mediaDevices.getDisplayMedia({ video: true, audio : true})
                .then(getDisplayMediaSuccess)
                .then((stream)=>{})
                .catch((e)=> console.log(e));
            }
        }
    };

//    const iceCandidatesQueue = useRef({}); 
// let gotMessageFromServer = async (fromId, message) => {
//     var signal = JSON.parse(message);

//     if (fromId === socketIdRef.current) return;

//     const pc = connections[fromId];

//     // 2. Handle SDP first and await its completion
//     if (signal.sdp) {
//         try {
//             await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            
//             if (signal.sdp.type === 'offer') {
//                 const description = await pc.createAnswer();
//                 await pc.setLocalDescription(description);
//                 socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': pc.localDescription }));
//             }

//             // 3. After SDP is set, process any queued candidates for this peer
//             if (iceCandidatesQueue.current[fromId]) {
//                 for (const candidate of iceCandidatesQueue.current[fromId]) {
//                     await pc.addIceCandidate(new RTCIceCandidate(candidate));
//                 }
//                 delete iceCandidatesQueue.current[fromId];
//             }
//         } catch (e) {
//             console.error("SDP Error:", e);
//         }
//     }

//     // 4. Handle ICE candidates
//     if (signal.ice) {
//         if (pc.remoteDescription && pc.remoteDescription.type) {
//             // Remote description is ready, add immediately
//             await pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.error(e));
//         } else {
//             // Not ready yet, push to queue
//             if (!iceCandidatesQueue.current[fromId]) iceCandidatesQueue.current[fromId] = [];
//             iceCandidatesQueue.current[fromId].push(signal.ice);
//         }
//     }
// };
    
    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    };

    let connectToSocketServer = () => {
        socketRef.current = io.connect(serverUrl, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }


    let silence = () => {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator(); 
        const destination = oscillator.connect(audioContext.createMediaStreamDestination());
        oscillator.start();
        audioContext.resume();
        return Object.assign(destination.stream.getAudioTracks()[0], {enabled: false});
    }

    //black silence
    let black = ({width = 640, height = 480} = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), {width, height});
        // some animations
        canvas.getContext("2d").fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], {enabled: false});
    };   

    let addMessage = (data, sender, socketIdSender) =>{
        setMessages((prevMessage)=>[
            ...prevMessage,
            {sender : sender, data : data}
        ]);
        if(socketIdSender !== socketIdRef.current){
            setNewMessages((prevMessage)=> prevMessage + 1);
        }
    };

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    //TODO: check if browser is chrome
    // if(isChrome() === false){
    //     alert("Please use Chrome browser for better experience");
    // }

    let handleVideo = () =>{
        setVideo(!video);
    }

    let handleAudio = () =>{
        setAudio(!audio);
    }
    useEffect(() => {
        if(screen !== undefined){
            getDisplayMedia();
        }
    },[screen]);

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }

    let handleScreen = () =>{
        setScreen(!screen);
    };

    let sendMessage = () =>{
        socketRef.current.emit("chat-message", message, username);
        setMessage("");
    }

    let handleEndCall = () =>{
        try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch (error) { console.log(error) }
        routeTo("/home");
    }

    return ( 
        <div>
            {askForUsername === true ? 
                <div>
                    <h2>Enter into lobby</h2>
                    <TextField id="outlined-basic" label="Outlined" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
                    <Button variant="contained" onClick={connect} >Connect</Button>
                    <div>
                        <video ref={localVideoRef} autoPlay muted></video>
                    </div>
                </div>
            :
                <div className={styles.meetVideoContainer}>
                    {showModel ? 
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1>Chat</h1>
                                <div className={styles.chattingDisplay}>
                                    {messages.length !== 0 ? messages.map((item, index) => {
                                        return (
                                            <div style={{marginBottom : "20px"}} key={index}>
                                                <p style={{fontWeight : "bold"}} >{item.sender}</p>
                                                <p>{item.data}</p>
                                            </div>
                                        )
                                    }) : <p>No Messages Yet</p> }
                                </div>
                                <div className={styles.chattingArea}>
                                    <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter Your chat" variant="outlined" />
                                    <Button variant="contained" onClick={sendMessage}>Send</Button>
                                </div>
                            </div>
                        </div> 
                        : 
                        <></>
                    }
                    
                    <div className={styles.buttonContainers}>
                        <IconButton style={{color : "white"}} onClick={handleVideo}>
                            {(video === true ? <VideocamIcon/> : <VideocamOffIcon/> )}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{color : "red"}}>
                            <CallEnd/>
                        </IconButton>
                        <IconButton style={{color : "white"}} onClick={handleAudio}>
                            {(audio === true ? <Mic/> : <MicOff/> )}
                        </IconButton>
                        {screenAvailable === true ? 
                            <IconButton onClick={handleScreen} style={{color : "white"}}>    
                                {screen === true ? <ScreenShare/> : <StopScreenShare/>}
                            </IconButton>
                            : <></>
                        }
                        <Badge onClick={()=> setShowModel(!showModel)} badgeContent={newMessages} max={999} color="secondary">
                            <IconButton style={{color : "white"}}>
                                <Chat/>
                            </IconButton>
                        </Badge>
                    </div>
                    <video className={styles.meetUserVideo}  ref={localVideoRef} autoPlay muted ></video>
                    <div className={styles.conferenceView} >
                        {videos.map((video) => (
                            <div key={video.socketId}>
                                <video 
                                    data-socket={video.socketId} 
                                    ref={(ref) => {
                                        if(ref && video.stream){
                                            ref.srcObject = video.stream;
                                        
                                        }
                                    }}
                                    autoPlay
                                >
                                </video>
                            </div>
                        ))}
                    </div>
                </div>
            }
        </div>
     );
};