import React  , {useCallback, useEffect, useState} from 'react'
import { useSocket } from '../Context/SocketProvider'
import ReactPlayer from 'react-player'
import Peer from "../Service/Peer"
import { useParams } from 'react-router-dom';


export default function Room() {
  const { room } = useParams(); 

  const socket = useSocket() ;

  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [stream, setStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)

  const handleUserJoined = useCallback(({email , id})=>{
    console.log(`${email} joined room`)
    setRemoteSocketId(id);
  } ,[])

  const handleCall = useCallback(
    async() => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio:true ,
            video:true 
        });
        const offer = await Peer.getOffer();
        socket.emit("user:call" , { to:remoteSocketId , offer});
        setStream(stream);
    },
    [remoteSocketId,socket],
  )

  const handleIncomingCall = useCallback(
    async({from , offer}) => {
      setRemoteSocketId(from)
      const stream = await navigator.mediaDevices.getUserMedia({
          audio:true ,
          video:true 
      });
      setStream(stream);
      console.log("Incoming: call" , offer)
      const ans = await Peer.getAnswer(offer);
      socket.emit("call:accepted" , {to:from, ans})
    },
    [socket]
  )

  
  const sendStreams = useCallback(() => {
    for (const track of stream.getTracks()) {
      console.log(track)
      Peer.peer.addTrack(track, stream);
    }
  }, [stream]);
  
  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      Peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );


  const handleEndCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null); 
    }
  
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        track.stop();
      });
      setRemoteStream(null);
    }
    socket.emit("room:leave", {
      email: SocketIdToEmailMap.get(remoteSocketId), 
      room: room
    });
  
    Peer.peer.close();
    Peer.peer = null; 
  };
  

  const handleNegoNeeded = useCallback(
      async()=>{
      const offer = await Peer.getOffer() ;
      socket.emit("peer:nego:needed" , {offer , to : remoteSocketId})
    },
    [remoteSocketId,socket],
  )
  
  const handleNegoNeedIncoming = useCallback(
    async({from , offer}) => {
      const ans= await Peer.getAnswer(offer);
      socket.emit("peer:nego:done" , {to:from , ans});
    },
    [socket],
  )

  const handleNegoNeedFinal = useCallback(
    async ({ans}) => {
      await Peer.setLocalDescription(ans);
    },
    [],
  )

  useEffect(() => {
    socket.on("user:joined" ,handleUserJoined );
    socket.on("incoming:call" , handleIncomingCall);
    socket.on("call:accepted" , handleCallAccepted);
    socket.on("peer:nego:needed" , handleNegoNeedIncoming);
    socket.on("peer:nego:final" , handleNegoNeedFinal);
    return ()=>{
    socket.off("user:joined" ,handleUserJoined );
    socket.off("incoming:call" , handleIncomingCall);
    socket.off("call:accepted" , handleCallAccepted);
    socket.off("peer:nego:needed" , handleNegoNeedIncoming);
    socket.off("peer:nego:final" , handleNegoNeedFinal);
    }
  }, [socket, handleUserJoined , handleIncomingCall , handleCallAccepted , handleNegoNeedIncoming, handleNegoNeedFinal])


  

  useEffect(() => {
    Peer.peer.addEventListener('negotiationneeded' , handleNegoNeeded);
    return ()=>{
      Peer.peer.removeEventListener('negotiationneeded' , handleNegoNeeded);
    }
  }, [handleNegoNeeded])
  

  useEffect(() => {
    Peer.peer.addEventListener("track" , async ev=>{
      const remoteStream = ev.streams
      setRemoteStream(remoteStream[0])
    })
  }, [])

  
  return (
    <div className="bg-gradient-to-r from-blue-500 via-blue-200 to-blue-400  h-screen">
    <div>Room</div>
    <h4>{remoteSocketId?"Connected" : "No one in room"}</h4>
    {remoteSocketId && !stream && <button  onClick = {handleCall} className="p-4 mt-2 bg-gradient-to-r from-blue-900 to-blue-200 w-full text-white rounded-xl">Call</button>}
    {stream && <button onClick={sendStreams } className="p-4 mt-2 bg-gradient-to-r from-blue-900 to-blue-200 w-full text-white rounded-xl">Send Stream</button>}
    {stream &&  <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4 p-4 border border-blue-400 rounded-lg shadow-xl bg-gradient-to-r from-blue-500 via-blue-200 to-blue-400  ">
      { stream && 
      <ReactPlayer
        playing
        muted
        url={stream}
        width="100%"  
        height="90%"
        style={{
          borderRadius: "0.5rem",
          overflow: "hidden",
          border: "1px solid #60A5FA",
          boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
          width: "100%",
        }}
      />}
      {remoteStream && 
      <ReactPlayer
        playing
        muted
        url={remoteStream}
        width="100%"   
        height="90%"
        style={{
          borderRadius: "0.5rem",
          overflow: "hidden",
          border: "1px solid #60A5FA",
          boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
          width: "100%",
        }}
      />}
    </div>
    }
    {stream && <button  onClick = {handleEndCall} className="p-4 mt-2 bg-gradient-to-r from-blue-900 to-blue-200 w-full text-white rounded-xl">End Call</button>}
    </div>
  )
}



