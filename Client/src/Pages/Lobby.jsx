import React, { useCallback, useState  , useEffect} from 'react'
import { useSocket } from '../Context/SocketProvider';
import { useNavigate } from "react-router-dom";

export default function Lobby() {

const [email, setEmail] = useState("");
const [room, setRoom] = useState("");

const navigate = useNavigate() ;

const socket = useSocket();

const handleSubmit = useCallback((e) => {
    e.preventDefault();
    socket.emit('room:join' , {email,room})
}, [email, room , socket]);

const handleRoomJoin = useCallback(
   (data) =>{
    const {email , room } = data ;
    navigate(`/room/${room}`)
    },
  [socket],
)


useEffect(() => {
  socket.on('room:join' , handleRoomJoin)
  return ()=>{
    socket.off('room:join' , handleRoomJoin)
  }
}, [socket])


  return (
    <div className="bg-gradient-to-r from-blue-500 via-blue-200 to-blue-400 h-screen w-full pt-24">
      <h1 className="p-2 text-blue-800  text-center font-bold text-[50px] text-shadow-xl "> Video Call App</h1>
      <p className = "text-blue-400 text-[20px] text-center m-2 ">Vdo Call application made with WebRTC  React and 💙</p>
      <p className = "text-gray-400 text-[20px] text-center m-2">-Created by Pretisha Sahoo</p>

      <form className="flex flex-col items-center  w-[90%] sm:w-[40%] mx-auto p-6 m-6 border border-blue-50 rounded-xl">
        <label htmlFor="email" className="sr-only">Email Id</label>
        <input onChange={e=>setEmail(e.target.value)} value={email} className ="rounded-xl mb-2 p-4 bg-blue-100 w-full text-center" type="email" placeholder="Type in your email" />
        <label htmlFor="room" className="sr-only">Room Code</label>
        <input  onChange={e=>setRoom(e.target.value)}  value={room} type="text" className ="rounded-xl mb-2 p-4 w-full bg-blue-100 text-center" placeholder="Enter room code" />
        <button onClick={handleSubmit} className="p-4 mt-2 bg-gradient-to-r from-blue-900 to-blue-200 w-full text-white rounded-xl">Join</button>
      </form>

    </div>
  )
}
